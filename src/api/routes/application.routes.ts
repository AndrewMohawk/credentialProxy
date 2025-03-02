import express from 'express';
import { authMiddleware } from '../../middleware/auth';
import { prisma } from '../../db/prisma';
import { logger } from '../../utils/logger';
import { config } from '../../config';
import crypto from 'crypto';
// @ts-ignore - ApplicationStatus is defined in the Prisma schema
import { ApplicationStatus } from '@prisma/client';

const router = express.Router();

// Apply auth middleware to all application routes except self-registration and revocation
router.use(['/register-self', '/revoke-credential', '/revoke-self'], (req, res, next) => next());
router.use(authMiddleware);

// Get all applications
router.get('/', async (req, res) => {
  try {
    const applications = await prisma.application.findMany();
    res.status(200).json({ 
      success: true, 
      data: applications 
    });
  } catch (error: any) {
    logger.error(`Error fetching applications: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: `Failed to fetch applications: ${error.message}` 
    });
  }
});

// Get a specific application
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const application = await prisma.application.findUnique({
      where: { id },
      include: { credentials: true, policies: true }
    });
    
    if (!application) {
      return res.status(404).json({ 
        success: false, 
        error: `Application with ID ${id} not found` 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: application 
    });
  } catch (error: any) {
    logger.error(`Error fetching application: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: `Failed to fetch application: ${error.message}` 
    });
  }
});

// Create a new application
router.post('/', async (req, res) => {
  try {
    const applicationData = req.body;
    const newApplication = await prisma.application.create({
      data: applicationData
    });
    
    res.status(201).json({ 
      success: true, 
      data: newApplication 
    });
  } catch (error: any) {
    logger.error(`Error creating application: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: `Failed to create application: ${error.message}` 
    });
  }
});

// Self-registration endpoint for applications
router.post('/register-self', async (req, res) => {
  try {
    // Check if auto-registration is enabled
    if (!config.applications.allowAutoRegistration) {
      return res.status(403).json({
        success: false,
        error: 'Auto-registration is disabled'
      });
    }

    const { name, publicKey, description, callbackUrl } = req.body;

    // Validate required fields
    if (!name || !publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Name and publicKey are required fields'
      });
    }

    // Generate a secret for the application
    const secret = crypto.randomBytes(24).toString('hex');
    
    // Get client IP
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    
    // Check if the public key is pre-approved
    let status = config.applications.autoRegistrationDefaultStatus === 'active' 
      ? ApplicationStatus.ACTIVE 
      : ApplicationStatus.PENDING;
    
    let preApprovedKey = null;
    
    if (config.applications.enablePreApprovedKeys) {
      // Check for matching pre-approved key that's not expired
      preApprovedKey = await prisma.preApprovedPublicKey.findFirst({
        where: {
          publicKey,
          used: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });
      
      if (preApprovedKey) {
        // Public key is pre-approved, set status to ACTIVE
        status = ApplicationStatus.ACTIVE;
      }
    }
    
    // Create the application with all required fields
    // @ts-ignore - TypeScript doesn't recognize that status and secret fields are in the model
    const newApplication = await prisma.application.create({
      data: {
        name,
        publicKey,
        // Use type assertion to tell TypeScript this is valid
        status: status as any,
        secret,
        description: description || null,
        callbackUrl: callbackUrl || null,
        registrationIp: ip as string,
      } as any
    });
    
    // If there was a pre-approved key and it's configured for one-time use, mark it as used
    if (preApprovedKey && config.applications.preApprovedKeysOneTimeUse) {
      await prisma.preApprovedPublicKey.update({
        where: { id: preApprovedKey.id },
        data: {
          used: true,
          usedByApplication: newApplication.id
        }
      });
    }
    
    // Log the event with additional details if pre-approved
    await prisma.auditEvent.create({
      data: {
        type: 'APPLICATION_SELF_REGISTRATION',
        details: {
          name: newApplication.name,
          ip,
          status,
          preApproved: !!preApprovedKey,
          preApprovedKeyId: preApprovedKey?.id
        },
        applicationId: newApplication.id
      }
    });
    
    logger.info(`New application self-registered: ${name} (${newApplication.id})${preApprovedKey ? ' [Pre-approved]' : ''}`);
    
    // Return the application with the secret (this is the only time the secret will be provided)
    // @ts-ignore - TypeScript doesn't recognize the status and secret fields
    res.status(201).json({
      success: true,
      data: {
        ...newApplication,
        secret // Include the secret only in the response
      },
      message: status === ApplicationStatus.PENDING 
        ? 'Application registered successfully and is pending approval' 
        : 'Application registered successfully'
    });
  } catch (error: any) {
    logger.error(`Error during application self-registration: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to register application'
    });
  }
});

// Credential revocation endpoint for applications
router.post('/revoke-credential', async (req, res) => {
  try {
    const { applicationId, credentialId, secret, reason } = req.body;
    
    // Validate required fields
    if (!applicationId || !credentialId || !secret) {
      return res.status(400).json({
        success: false,
        error: 'ApplicationId, credentialId, and secret are required'
      });
    }
    
    // Find the application
    const application = await prisma.application.findUnique({
      where: { id: applicationId }
    });
    
    // Check if application exists
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }
    
    // Check if application is already revoked
    // @ts-ignore - TypeScript doesn't recognize the status field
    if (application.status === ApplicationStatus.REVOKED) {
      return res.status(400).json({
        success: false,
        error: 'Application is already revoked'
      });
    }
    
    // Verify the secret
    // @ts-ignore - TypeScript doesn't recognize the secret field
    if (application.secret !== secret) {
      return res.status(403).json({
        success: false,
        error: 'Invalid secret'
      });
    }
    
    // Check if the credential exists and is associated with the application
    const credential = await prisma.credential.findFirst({
      where: {
        id: credentialId,
        applications: {
          some: {
            id: applicationId
          }
        }
      }
    });
    
    if (!credential) {
      return res.status(404).json({
        success: false,
        error: 'Credential not found or not associated with this application'
      });
    }
    
    // Remove the credential from the application
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        credentials: {
          disconnect: { id: credentialId }
        }
      }
    });
    
    // Log the event
    await prisma.auditEvent.create({
      data: {
        type: 'CREDENTIAL_SELF_REVOCATION',
        details: {
          reason: reason || 'No reason provided',
          credentialId,
          applicationId
        },
        applicationId,
        credentialId
      }
    });
    
    logger.info(`Credential ${credentialId} revoked by application ${applicationId}`);
    
    res.status(200).json({
      success: true,
      message: 'Credential revoked successfully'
    });
  } catch (error: any) {
    logger.error(`Error revoking credential: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke credential'
    });
  }
});

// Update for fully revoking application access (for when the application itself is compromised)
router.post('/revoke-self', async (req, res) => {
  try {
    const { applicationId, secret, reason } = req.body;
    
    // Validate required fields
    if (!applicationId || !secret) {
      return res.status(400).json({
        success: false,
        error: 'ApplicationId and secret are required'
      });
    }
    
    // Find the application
    const application = await prisma.application.findUnique({
      where: { id: applicationId }
    });
    
    // Check if application exists
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }
    
    // Check if application is already revoked
    // @ts-ignore - TypeScript doesn't recognize the status field
    if (application.status === ApplicationStatus.REVOKED) {
      return res.status(400).json({
        success: false,
        error: 'Application is already revoked'
      });
    }
    
    // Verify the secret
    // @ts-ignore - TypeScript doesn't recognize the secret field
    if (application.secret !== secret) {
      return res.status(403).json({
        success: false,
        error: 'Invalid secret'
      });
    }
    
    // Revoke the application
    // @ts-ignore - TypeScript doesn't recognize the status field
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.REVOKED as any,
        revokedAt: new Date(),
        revokedReason: reason || 'Self-revoked by application'
      } as any
    });
    
    // Log the event
    await prisma.auditEvent.create({
      data: {
        type: 'APPLICATION_SELF_REVOCATION',
        details: {
          reason: reason || 'No reason provided',
          applicationId
        },
        applicationId
      }
    });
    
    logger.info(`Application ${applicationId} self-revoked`);
    
    res.status(200).json({
      success: true,
      message: 'Application revoked successfully'
    });
  } catch (error: any) {
    logger.error(`Error self-revoking application: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke application'
    });
  }
});

// Approve a pending application
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the application
    const application = await prisma.application.findUnique({
      where: { id }
    });
    
    // Check if application exists
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }
    
    // @ts-ignore - TypeScript doesn't recognize the status field
    if (application.status !== ApplicationStatus.PENDING) {
      return res.status(400).json({
        success: false,
        error: 'Only pending applications can be approved'
      });
    }
    
    // Update the application status to ACTIVE
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status: ApplicationStatus.ACTIVE as any
      } as any
    });
    
    // Log the event
    await prisma.auditEvent.create({
      data: {
        type: 'APPLICATION_APPROVAL',
        details: {
          applicationId: id,
          approvedBy: req.user?.id || 'system'
        },
        applicationId: id,
        userId: req.user?.id
      }
    });
    
    logger.info(`Application ${id} approved by ${req.user?.id || 'system'}`);
    
    res.status(200).json({
      success: true,
      data: updatedApplication,
      message: 'Application approved successfully'
    });
  } catch (error: any) {
    logger.error(`Error approving application: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to approve application'
    });
  }
});

// Placeholder route for updating an application
router.put('/:id', (req, res) => {
  res.status(200).json({ message: `Update application with ID: ${req.params.id}` });
});

// Placeholder route for deleting an application
router.delete('/:id', (req, res) => {
  res.status(200).json({ message: `Delete application with ID: ${req.params.id}` });
});

export const applicationRoutes = router; 