import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { logger } from '../../utils/logger';

/**
 * Get all applications
 * @param req Express request
 * @param res Express response
 */
export const getAllApplications = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const applications = await prisma.application.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

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
};

/**
 * Get application by ID
 * @param req Express request
 * @param res Express response
 */
export const getApplicationById = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        credentials: true,
        policies: true,
        auditEvents: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
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
};

/**
 * Create a new application
 * @param req Express request
 * @param res Express response
 */
export const createApplication = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { name, publicKey, description, callbackUrl, status } = req.body;

    // Validate required fields
    if (!name || !publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Name and publicKey are required fields'
      });
    }

    const newApplication = await prisma.application.create({
      data: {
        name,
        publicKey,
        status: status || 'PENDING',
        description,
        callbackUrl,
        auditEvents: {
          create: {
            type: 'APPLICATION_CREATED',
            userId: req.user.id,
            details: {
              name,
              createdBy: req.user.id
            }
          }
        }
      }
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
};

/**
 * Update an application
 * @param req Express request
 * @param res Express response
 */
export const updateApplication = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const { name, description, callbackUrl, status } = req.body;

    // Check if application exists
    const existingApplication = await prisma.application.findUnique({
      where: { id }
    });

    if (!existingApplication) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        name,
        description,
        callbackUrl,
        status,
        auditEvents: {
          create: {
            type: 'APPLICATION_UPDATED',
            userId: req.user.id,
            details: {
              name,
              updatedBy: req.user.id,
              previousStatus: existingApplication.status,
              newStatus: status
            }
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: updatedApplication
    });
  } catch (error: any) {
    logger.error(`Error updating application: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to update application: ${error.message}`
    });
  }
};

/**
 * Delete an application
 * @param req Express request
 * @param res Express response
 */
export const deleteApplication = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;

    // Check if application exists
    const existingApplication = await prisma.application.findUnique({
      where: { id }
    });

    if (!existingApplication) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Create audit event before deleting
    await prisma.auditEvent.create({
      data: {
        type: 'APPLICATION_DELETED',
        userId: req.user.id,
        details: {
          name: existingApplication.name,
          deletedBy: req.user.id
        }
      }
    });

    // Delete the application
    await prisma.application.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error: any) {
    logger.error(`Error deleting application: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to delete application: ${error.message}`
    });
  }
}; 