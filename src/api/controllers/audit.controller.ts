import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { logger } from '../../utils/logger';

/**
 * Get all audit logs
 * @param req Express request
 * @param res Express response
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const userId = req.user.id;
    
    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    // Build where clause
    const where: any = {
      userId
    };
    
    if (type) {
      where.type = type;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }
    
    // Get total count for pagination
    const totalCount = await prisma.auditEvent.count({
      where
    });
    
    // Get audit logs
    const auditLogs = await prisma.auditEvent.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        },
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
        },
        policy: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    res.status(200).json({
      success: true,
      data: auditLogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error: any) {
    logger.error(`Error fetching audit logs: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to fetch audit logs: ${error.message}`
    });
  }
};

/**
 * Get audit log by ID
 * @param req Express request
 * @param res Express response
 */
export const getAuditLogById = async (req: Request, res: Response) => {
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
    
    const auditLog = await prisma.auditEvent.findFirst({
      where: {
        id,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
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
        },
        policy: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });
    
    if (!auditLog) {
      return res.status(404).json({
        success: false,
        error: 'Audit log not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: auditLog
    });
  } catch (error: any) {
    logger.error(`Error fetching audit log: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to fetch audit log: ${error.message}`
    });
  }
}; 