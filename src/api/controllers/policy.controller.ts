import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { 
  PolicyStatus, 
  evaluateRequest, 
  getApplicablePolicies, 
  checkApplicationCredentialAccess,
  Policy
} from '../../core/policies/policyEngine';

/**
 * Get all policies
 * @param req Express request
 * @param res Express response
 */
export const getAllPolicies = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const userId = req.user.id;
    const { credentialId, applicationId } = req.query;

    // Simple approach: get all policies
    // If credential/application filter is provided, use it
    const whereClause: any = {};
    
    // Add credential filter if provided
    if (credentialId) {
      whereClause.credentialId = credentialId as string;
    }

    // Add application filter if provided
    if (applicationId) {
      whereClause.applicationId = applicationId as string;
    }

    // Get all policies 
    const policies = await prisma.policy.findMany({
      where: whereClause,
      include: {
        credential: {
          select: {
            id: true,
            name: true,
            type: true,
            userId: true
          }
        },
        application: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Filter policies to only include those belonging to the user or global policies
    const userPolicies = policies.filter(policy => 
      // Include global policies (scope=GLOBAL)
      policy.scope === 'GLOBAL' || 
      // Include policies for user's credentials
      (policy.credential && policy.credential.userId === userId) ||
      // Include plugin policies (no credential relationship needed)
      policy.scope === 'PLUGIN'
    );

    res.status(200).json({
      success: true,
      data: userPolicies
    });
  } catch (error: any) {
    logger.error(`Error fetching policies: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to fetch policies: ${error.message}`
    });
  }
};

/**
 * Get policy by ID
 * @param req Express request
 * @param res Express response
 */
export const getPolicyById = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;
    
    // First check if the policy exists
    const policyToCheck = await prisma.policy.findUnique({
      where: { id },
      include: {
        credential: true
      }
    });

    if (!policyToCheck) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found'
      });
    }

    // For global policies, allow access
    // For credential policies, check ownership
    let allowAccess = false;
    
    if (policyToCheck.scope === 'GLOBAL') {
      // Anyone can view global policies
      allowAccess = true;
    } else if (policyToCheck.credentialId && policyToCheck.credential) {
      // For credential policies, check if the credential belongs to the user
      allowAccess = policyToCheck.credential.userId === req.user.id;
    } else if (policyToCheck.scope === 'PLUGIN') {
      // For plugin policies, allow access for authenticated users
      allowAccess = true;
    }

    if (!allowAccess) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found or does not belong to you'
      });
    }

    // Get the full policy with related data
    const policy = await prisma.policy.findUnique({
      where: { id },
      include: {
        credential: true,
        application: true,
        auditEvents: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 50 // Increase from 10 to 50 to show more history
        }
      }
    });

    // Get additional audit events that reference this policy (for evaluations)
    const policyUsageAuditEvents = await prisma.auditEvent.findMany({
      where: {
        policyId: id,
        type: 'policy_evaluation'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    res.status(200).json({
      success: true,
      data: {
        ...policy,
        usageHistory: policyUsageAuditEvents
      }
    });
  } catch (error: any) {
    logger.error(`Error fetching policy: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to fetch policy: ${error.message}`
    });
  }
};

/**
 * Create a new policy
 * @param req Express request
 * @param res Express response
 */
export const createPolicy = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { 
      name, 
      type, 
      description,
      configuration, 
      credentialId, 
      pluginId,
      applicationId, 
      isEnabled,
      pattern,
      startTime,
      endTime,
      maxCount,
      scope = 'CREDENTIAL', // Default to CREDENTIAL if not specified
    } = req.body;

    // Validate required fields based on scope
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Name and type are required fields'
      });
    }

    // Validate scope-specific requirements
    if (scope === 'CREDENTIAL' && !credentialId) {
      return res.status(400).json({
        success: false,
        error: 'credentialId is required for CREDENTIAL scope'
      });
    }

    if (scope === 'PLUGIN' && !pluginId) {
      return res.status(400).json({
        success: false,
        error: 'pluginId is required for PLUGIN scope'
      });
    }

    // If credentialId is provided, verify it belongs to the user
    let credential = null;
    if (credentialId) {
      credential = await prisma.credential.findFirst({
        where: {
          id: credentialId,
          userId: req.user.id
        }
      });

      if (!credential) {
        return res.status(404).json({
          success: false,
          error: 'Credential not found or does not belong to you'
        });
      }
    }

    // Create the policy
    const newPolicy = await prisma.policy.create({
      data: {
        name,
        description,
        type,
        scope,
        configuration: configuration || {},
        credentialId,
        applicationId,
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        pattern,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        maxCount,
        // The pluginId is added here through type casting since the Prisma client might
        // not have been fully updated yet to include it in its types
        ...(pluginId ? { pluginId } : {}),
        auditEvents: {
          create: {
            type: 'POLICY_CREATED',
            userId: req.user.id,
            details: {
              name,
              description,
              policyType: type,
              policyScope: scope,
              credentialId,
              pluginId,
              applicationId
            }
          }
        }
      } as any // Use type assertion to bypass the type checker
    });

    res.status(201).json({
      success: true,
      data: newPolicy
    });
  } catch (error: any) {
    logger.error(`Error creating policy: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to create policy: ${error.message}`
    });
  }
};

/**
 * Update a policy
 * @param req Express request
 * @param res Express response
 */
export const updatePolicy = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const { 
      name, 
      configuration, 
      applicationId, 
      isEnabled,
      pattern,
      startTime,
      endTime,
      maxCount
    } = req.body;

    // First, fetch the policy to determine its scope
    const policyToCheck = await prisma.policy.findUnique({
      where: { id },
      include: {
        credential: true
      }
    });

    if (!policyToCheck) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found'
      });
    }

    // For global policies, allow the operation
    // For credential policies, check ownership
    let allowOperation = false;
    
    if (policyToCheck.scope === 'GLOBAL') {
      // Anyone can update global policies
      allowOperation = true;
    } else if (policyToCheck.credentialId && policyToCheck.credential) {
      // For credential policies, check if the credential belongs to the user
      allowOperation = policyToCheck.credential.userId === req.user.id;
    } else if (policyToCheck.scope === 'PLUGIN') {
      // For plugin policies, we'll assume any authenticated user can manage them
      // since there's no direct user association with plugins in the schema
      allowOperation = true;
    }

    if (!allowOperation) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found or does not belong to you'
      });
    }

    // Update the policy
    const updatedPolicy = await prisma.policy.update({
      where: { id },
      data: {
        name,
        configuration: configuration || undefined,
        applicationId,
        isEnabled,
        pattern,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        maxCount,
        auditEvents: {
          create: {
            type: 'POLICY_UPDATED',
            userId: req.user.id,
            details: {
              name,
              previousEnabled: policyToCheck.isEnabled,
              newEnabled: isEnabled
            }
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: updatedPolicy
    });
  } catch (error: any) {
    logger.error(`Error updating policy: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to update policy: ${error.message}`
    });
  }
};

/**
 * Delete a policy
 * @param req Express request
 * @param res Express response
 */
export const deletePolicy = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;

    // First, fetch the policy to determine its scope
    const policyToCheck = await prisma.policy.findUnique({
      where: { id },
      include: {
        credential: true
      }
    });

    if (!policyToCheck) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found'
      });
    }

    // For global policies, allow the operation
    // For credential policies, check ownership
    let allowOperation = false;
    
    if (policyToCheck.scope === 'GLOBAL') {
      // Anyone can delete global policies
      allowOperation = true;
    } else if (policyToCheck.credentialId && policyToCheck.credential) {
      // For credential policies, check if the credential belongs to the user
      allowOperation = policyToCheck.credential.userId === req.user.id;
    } else if (policyToCheck.scope === 'PLUGIN') {
      // For plugin policies, we'll assume any authenticated user can manage them
      // since there's no direct user association with plugins in the schema
      allowOperation = true;
    }

    if (!allowOperation) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found or does not belong to you'
      });
    }

    // Create audit event before deleting
    await prisma.auditEvent.create({
      data: {
        type: 'POLICY_DELETED',
        userId: req.user.id,
        details: {
          name: policyToCheck.name,
          policyType: policyToCheck.type,
          credentialId: policyToCheck.credentialId
        }
      }
    });

    // Delete the policy
    await prisma.policy.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Policy deleted successfully'
      }
    });
  } catch (error: any) {
    logger.error(`Error deleting policy: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to delete policy: ${error.message}`
    });
  }
};

/**
 * Approve a pending policy request
 * @param req Express request
 * @param res Express response
 */
export const approvePendingRequest = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;

    // Find the policy request
    const policy = await prisma.policy.findUnique({
      where: { id },
      include: {
        credential: true,
        application: true
      }
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Policy request not found'
      });
    }

    // Check if the policy is already approved
    if (policy.isEnabled) {
      return res.status(400).json({
        success: false,
        error: 'Policy request is already approved'
      });
    }

    // Update the policy to mark it as approved (enabled)
    const updatedPolicy = await prisma.policy.update({
      where: { id },
      data: {
        isEnabled: true,
        auditEvents: {
          create: {
            type: 'POLICY_APPROVED',
            userId: req.user.id,
            details: {
              policyId: id,
              credentialId: policy.credentialId,
              applicationId: policy.applicationId
            }
          }
        }
      },
      include: {
        credential: true,
        application: true
      }
    });

    res.status(200).json({
      success: true,
      data: updatedPolicy,
      message: 'Policy request approved successfully'
    });
  } catch (error: any) {
    logger.error(`Error approving policy request: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to approve policy request: ${error.message}`
    });
  }
};

/**
 * Simulate a policy evaluation without executing the operation
 * @route POST /api/policies/simulate
 */
export const simulatePolicy = async (req: Request, res: Response) => {
  try {
    const { applicationId, credentialId, operation, parameters } = req.body;

    if (!applicationId) {
      return res.status(400).json({ error: 'Application ID is required' });
    }

    if (!credentialId) {
      return res.status(400).json({ error: 'Credential ID is required' });
    }

    if (!operation) {
      return res.status(400).json({ error: 'Operation is required' });
    }

    // Validate that application exists
    const application = await prisma.application.findUnique({
      where: { id: applicationId }
    });

    if (!application) {
      return res.status(404).json({ error: `Application with ID ${applicationId} not found` });
    }

    // Validate that credential exists
    const credential = await prisma.credential.findUnique({
      where: { id: credentialId }
    });

    if (!credential) {
      return res.status(404).json({ error: `Credential with ID ${credentialId} not found` });
    }

    // Check if the application has access to this credential
    const hasAccess = await checkApplicationCredentialAccess(applicationId, credentialId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        result: {
          status: PolicyStatus.DENIED,
          reason: `Application ${applicationId} does not have access to credential ${credentialId}`
        }
      });
    }

    // Get applicable policies for this combination
    const policies = await getApplicablePolicies(credentialId, applicationId);

    // Create a proxy request for evaluation
    const proxyRequest = {
      id: uuidv4(),
      applicationId,
      credentialId,
      operation,
      parameters: parameters || {},
      timestamp: new Date()
    };

    // Evaluate the request against policies, with simulate flag
    const result = await evaluateRequest({
      ...proxyRequest,
      simulate: true
    });

    // Return simulation results with additional context
    return res.status(200).json({
      success: true,
      result,
      metadata: {
        policiesEvaluated: policies.length,
        policies: policies.map((p: Policy) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          priority: p.priority
        }))
      }
    });
  } catch (error) {
    console.error('Error simulating policy evaluation:', error);
    return res.status(500).json({ error: 'Error simulating policy evaluation' });
  }
}; 