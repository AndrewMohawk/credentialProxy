import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'node:crypto';
import { prisma } from '../../db/prisma';
import { logger } from '../../utils/logger';
import { evaluateRequest, Policy, PolicyStatus } from '../../core/policies/policyEngine';
import { queueProxyRequest } from '../../services/proxyQueueProcessor';
import { getPluginManager } from '../../plugins';
import { mapCredentialTypeToPluginId } from '../../services/operationExecutor';

/**
 * Handle a proxy request from a third-party application
 */
export const handleProxyRequest = async (req: Request, res: Response) => {
  try {
    // Validate required fields
    const { applicationId, credentialId, operation, parameters, timestamp, signature } = req.body;
    
    if (!applicationId || !credentialId || !operation || !parameters || !timestamp || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }
    
    // Check if timestamp is valid (within 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const requestTime = Math.floor(Number(timestamp) / 1000);
    
    if (Math.abs(currentTime - requestTime) > 300) {
      return res.status(400).json({
        success: false,
        error: 'Request timestamp is invalid or expired',
      });
    }
    
    // Get the application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { policies: true },
    });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found',
      });
    }
    
    // Get the credential
    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
    });
    
    if (!credential) {
      return res.status(404).json({
        success: false,
        error: 'Credential not found',
      });
    }
    
    // Check if the plugin for this credential type is enabled
    try {
      const pluginManager = getPluginManager();
      const pluginId = mapCredentialTypeToPluginId(credential.type);
      
      if (!pluginManager.isPluginEnabled(pluginId)) {
        logger.warn(`Plugin ${pluginId} is disabled for credential ${credentialId}`);
        return res.status(400).json({
          success: false,
          error: `Plugin for credential type ${credential.type} is disabled or not available`,
        });
      }
    } catch (error: any) {
      logger.error(`Error checking plugin status: ${error.message}`);
      return res.status(400).json({
        success: false,
        error: `Unsupported credential type: ${credential.type}`,
      });
    }
    
    // Verify the signature
    const isValidSignature = verifySignature(
      applicationId,
      credentialId,
      operation,
      parameters,
      timestamp,
      signature,
      application.publicKey
    );
    
    if (!isValidSignature) {
      logger.warn(`Invalid signature for request from application ${applicationId}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid signature',
      });
    }
    
    // Create a request object
    const requestId = uuidv4();
    const proxyRequest = {
      id: requestId,
      applicationId,
      credentialId,
      operation,
      parameters,
      timestamp: new Date(Number(timestamp)),
    };
    
    // Convert database policies to the Policy interface expected by evaluateRequest
    const policiesForEvaluation: Policy[] = application.policies.map(dbPolicy => {
      // Check if the database policy has the required fields
      // If not, provide default values
      return {
        id: dbPolicy.id,
        type: dbPolicy.type as any, // Type assertion to handle enum differences
        name: dbPolicy.name,
        description: '', // Default empty string for description
        applicationId: dbPolicy.applicationId || undefined,
        credentialId: dbPolicy.credentialId,
        config: dbPolicy.configuration as Record<string, any>,
        priority: 0, // Default priority
        isActive: dbPolicy.isEnabled,
      };
    });
    
    // Evaluate policies
    const policyResult = await evaluateRequest(proxyRequest, policiesForEvaluation);
    
    // Log the access attempt
    await prisma.auditEvent.create({
      data: {
        id: requestId,
        type: 'proxy_request',
        applicationId,
        credentialId,
        details: JSON.stringify({
          operation,
          parameters,
          status: policyResult.status,
          reason: policyResult.reason
        }),
        requestStatus: policyResult.status as any, // Type assertion to handle enum differences
      },
    });
    
    // Handle the response based on policy evaluation
    if (policyResult.status === PolicyStatus.PENDING) {
      return res.status(202).json({
        success: true,
        status: 'PENDING',
        message: 'Request requires manual approval',
        requestId,
      });
    } else if (policyResult.status === PolicyStatus.APPROVED) {
      // Add the request to the queue for processing
      const queueResult = await queueProxyRequest(
        requestId,
        applicationId,
        credentialId,
        operation,
        parameters
      );
      
      if (!queueResult) {
        return res.status(500).json({
          success: false,
          error: 'Failed to queue request for processing',
        });
      }
      
      return res.status(202).json({
        success: true,
        status: 'APPROVED',
        message: 'Request approved and queued for processing',
        requestId,
      });
    } else {
      // Request was denied
      return res.status(403).json({
        success: false,
        status: 'DENIED',
        message: policyResult.reason || 'Request denied by policy',
        requestId,
      });
    }
  } catch (error: any) {
    logger.error(`Error handling proxy request: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Check the status of a pending request
 */
export const checkRequestStatus = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    
    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required',
      });
    }
    
    // Get the audit log entry for the request
    const auditEvent = await prisma.auditEvent.findUnique({
      where: { id: requestId },
    });
    
    if (!auditEvent) {
      return res.status(404).json({
        success: false,
        error: 'Request not found',
      });
    }
    
    // Return the status and response data
    return res.status(200).json({
      success: true,
      status: auditEvent.requestStatus,
      completedAt: auditEvent.createdAt, // Use createdAt as completedAt
      response: auditEvent.responseData ? JSON.parse(auditEvent.responseData as string) : null,
    });
  } catch (error: any) {
    logger.error(`Error checking request status: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Verify the signature of a request
 */
const verifySignature = (
  applicationId: string,
  credentialId: string,
  operation: string,
  parameters: Record<string, any>,
  timestamp: string,
  signature: string,
  publicKey: string
): boolean => {
  try {
    // Create the message to verify
    const message = JSON.stringify({
      applicationId,
      credentialId,
      operation,
      parameters,
      timestamp,
    });
    
    // Verify the signature
    const verifier = crypto.createVerify('SHA256');
    verifier.update(message);
    
    return verifier.verify(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(signature, 'base64')
    );
  } catch (error: any) {
    logger.error(`Error verifying signature: ${error.message}`);
    return false;
  }
}; 