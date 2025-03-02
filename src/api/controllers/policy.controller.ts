import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { logger } from '../../utils/logger';

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

    // Get policies associated with the user's credentials
    const policies = await prisma.policy.findMany({
      where: {
        credential: {
          userId: userId
        }
      },
      include: {
        credential: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        application: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: policies
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
    const userId = req.user.id;

    const policy = await prisma.policy.findFirst({
      where: {
        id,
        credential: {
          userId: userId
        }
      },
      include: {
        credential: true,
        application: true,
        auditEvents: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found'
      });
    }

    res.status(200).json({
      success: true,
      data: policy
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
      configuration, 
      credentialId, 
      applicationId, 
      isEnabled,
      pattern,
      startTime,
      endTime,
      maxCount
    } = req.body;

    // Validate required fields
    if (!name || !type || !credentialId) {
      return res.status(400).json({
        success: false,
        error: 'Name, type, and credentialId are required fields'
      });
    }

    // Check if the credential belongs to the user
    const credential = await prisma.credential.findFirst({
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

    // Create the policy
    const newPolicy = await prisma.policy.create({
      data: {
        name,
        type,
        configuration: configuration || {},
        credentialId,
        applicationId,
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        pattern,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        maxCount,
        auditEvents: {
          create: {
            type: 'POLICY_CREATED',
            userId: req.user.id,
            details: {
              name,
              policyType: type,
              credentialId,
              applicationId
            }
          }
        }
      }
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

    // Check if the policy exists and belongs to the user
    const existingPolicy = await prisma.policy.findFirst({
      where: {
        id,
        credential: {
          userId: req.user.id
        }
      }
    });

    if (!existingPolicy) {
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
              previousEnabled: existingPolicy.isEnabled,
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

    // Check if the policy exists and belongs to the user
    const existingPolicy = await prisma.policy.findFirst({
      where: {
        id,
        credential: {
          userId: req.user.id
        }
      }
    });

    if (!existingPolicy) {
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
          name: existingPolicy.name,
          policyType: existingPolicy.type,
          credentialId: existingPolicy.credentialId
        }
      }
    });

    // Delete the policy
    await prisma.policy.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Policy deleted successfully'
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