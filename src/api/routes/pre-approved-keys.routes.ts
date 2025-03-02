import express from 'express';
import { authMiddleware } from '../../middleware/auth';
import { prisma } from '../../db/prisma';
import { logger } from '../../utils/logger';
import { config } from '../../config';

const router = express.Router();

// Apply auth middleware to all routes - only admins should access these
router.use(authMiddleware);

// Get all pre-approved public keys
router.get('/', async (req, res) => {
  try {
    const preApprovedKeys = await prisma.preApprovedPublicKey.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
    
    res.status(200).json({ 
      success: true, 
      data: preApprovedKeys 
    });
  } catch (error: any) {
    logger.error(`Error fetching pre-approved keys: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: `Failed to fetch pre-approved keys: ${error.message}` 
    });
  }
});

// Get a specific pre-approved key
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const preApprovedKey = await prisma.preApprovedPublicKey.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
    
    if (!preApprovedKey) {
      return res.status(404).json({ 
        success: false, 
        error: `Pre-approved key with ID ${id} not found` 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: preApprovedKey 
    });
  } catch (error: any) {
    logger.error(`Error fetching pre-approved key: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: `Failed to fetch pre-approved key: ${error.message}` 
    });
  }
});

// Create a new pre-approved public key
router.post('/', async (req, res) => {
  try {
    const { publicKey, description, expiresAt } = req.body;
    
    // Validate required fields
    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Public key is required'
      });
    }
    
    // Check if public key already exists
    const existingKey = await prisma.preApprovedPublicKey.findFirst({
      where: { publicKey }
    });
    
    if (existingKey) {
      return res.status(400).json({
        success: false,
        error: 'Public key already exists in pre-approved keys'
      });
    }
    
    // Set expiration date if configured
    let expirationDate = null;
    if (expiresAt) {
      expirationDate = new Date(expiresAt);
    } else if (config.applications.preApprovedKeysExpirationDays) {
      expirationDate = new Date();
      expirationDate.setDate(
        expirationDate.getDate() + config.applications.preApprovedKeysExpirationDays
      );
    }
    
    // Ensure req.user exists - it should due to authMiddleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Create the pre-approved key
    const newPreApprovedKey = await prisma.preApprovedPublicKey.create({
      data: {
        publicKey,
        description: description || null,
        createdById: req.user.id,
        expiresAt: expirationDate
      }
    });
    
    // Log the event
    await prisma.auditEvent.create({
      data: {
        type: 'PRE_APPROVED_KEY_CREATED',
        details: {
          publicKey,
          description,
          expiresAt: expirationDate
        },
        userId: req.user.id
      }
    });
    
    logger.info(`New pre-approved key created by ${req.user.username} (${req.user.id})`);
    
    res.status(201).json({
      success: true,
      data: newPreApprovedKey
    });
  } catch (error: any) {
    logger.error(`Error creating pre-approved key: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to create pre-approved key: ${error.message}`
    });
  }
});

// Delete a pre-approved key
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the key exists
    const preApprovedKey = await prisma.preApprovedPublicKey.findUnique({
      where: { id }
    });
    
    if (!preApprovedKey) {
      return res.status(404).json({
        success: false,
        error: `Pre-approved key with ID ${id} not found`
      });
    }
    
    // Ensure req.user exists - it should due to authMiddleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Delete the key
    await prisma.preApprovedPublicKey.delete({
      where: { id }
    });
    
    // Log the event
    await prisma.auditEvent.create({
      data: {
        type: 'PRE_APPROVED_KEY_DELETED',
        details: {
          id,
          publicKey: preApprovedKey.publicKey
        },
        userId: req.user.id
      }
    });
    
    logger.info(`Pre-approved key ${id} deleted by ${req.user.username} (${req.user.id})`);
    
    res.status(200).json({
      success: true,
      message: 'Pre-approved key deleted successfully'
    });
  } catch (error: any) {
    logger.error(`Error deleting pre-approved key: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to delete pre-approved key: ${error.message}`
    });
  }
});

export const preApprovedKeysRoutes = router; 