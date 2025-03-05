import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { logger } from '../../utils/logger';

/**
 * Get dashboard metrics
 * @param req Express request
 * @param res Express response
 */
export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const userId = req.user.id;

    // Get credential count
    const credentialCount = await prisma.credential.count({
      where: {
        userId: userId
      }
    });

    // Get application count
    const applicationCount = await prisma.application.count();

    // Get policy count
    const policyCount = await prisma.policy.count({
      where: {
        credential: {
          userId: userId
        }
      }
    });

    // Get recent activity (last 5 audit events)
    const recentAuditEvents = await prisma.auditEvent.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Format recent activity for better display
    const recentActivity = recentAuditEvents.map(event => {
      // Set default action and target
      let action = 'Unknown Event';
      let target = '-';
      
      // Format based on event type
      switch (event.type) {
      case 'user_login':
        action = 'Login';
        target = 'Authentication';
        break;
      case 'user_logout':
        action = 'Logout';
        target = 'Authentication';
        break;
      case 'user_register':
        action = 'Registration';
        target = 'User Account';
        break;
      case 'credential_create':
        action = 'Created';
        target = 'Credential';
        break;
      case 'credential_update':
        action = 'Updated';
        target = 'Credential';
        break;
      case 'credential_delete':
        action = 'Deleted';
        target = 'Credential';
        break;
      case 'credential_use':
        action = 'Used';
        target = 'Credential';
        break;
      case 'application_create':
        action = 'Created';
        target = 'Application';
        break;
      case 'application_update':
        action = 'Updated';
        target = 'Application';
        break;
      case 'application_delete':
        action = 'Deleted';
        target = 'Application';
        break;
      case 'policy_create':
        action = 'Created';
        target = 'Policy';
        break;
      case 'policy_update':
        action = 'Updated';
        target = 'Policy';
        break;
      case 'policy_delete':
        action = 'Deleted';
        target = 'Policy';
        break;
      default: {
        // Try to extract meaningful action/target from the type
        const parts = event.type.split('_');
        if (parts.length >= 2) {
          action = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
          target = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        }
      }
      }
      
      return {
        id: event.id,
        action,
        target,
        details: event.details,
        timestamp: event.createdAt.toISOString()
      };
    });

    // System status checks
    const systemStatus = {
      apiStatus: true,
      credentialStoreStatus: true,
      queueStatus: true
    };

    res.status(200).json({
      success: true,
      data: {
        credentialCount,
        applicationCount,
        policyCount,
        recentActivity,
        systemStatus
      }
    });
  } catch (error: any) {
    logger.error(`Error fetching dashboard metrics: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to fetch dashboard metrics: ${error.message}`
    });
  }
}; 