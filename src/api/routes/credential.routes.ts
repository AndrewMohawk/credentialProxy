import express from 'express';
import { authMiddleware } from '../../middleware/auth';
import { prisma } from '../../db/prisma';
import { logger } from '../../utils/logger';

const router = express.Router();

// Apply auth middleware to all credential routes
router.use(authMiddleware);

// Get all credentials for an application
router.get('/', async (req, res) => {
  try {
    const { applicationId } = req.query;
    
    if (!applicationId) {
      return res.status(400).json({
        success: false,
        error: 'Application ID is required'
      });
    }
    
    const credentials = await prisma.credential.findMany({
      where: { 
        applications: {
          some: {
            id: applicationId as string
          }
        }
      }
    });
    
    res.status(200).json({
      success: true,
      data: credentials
    });
  } catch (error: any) {
    logger.error(`Error fetching credentials: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to fetch credentials: ${error.message}`
    });
  }
});

// Get a specific credential
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const credential = await prisma.credential.findUnique({
      where: { id }
    });
    
    if (!credential) {
      return res.status(404).json({
        success: false,
        error: `Credential with ID ${id} not found`
      });
    }
    
    res.status(200).json({
      success: true,
      data: credential
    });
  } catch (error: any) {
    logger.error(`Error fetching credential: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to fetch credential: ${error.message}`
    });
  }
});

// Create a new credential
router.post('/', async (req, res) => {
  try {
    const credentialData = req.body;
    const newCredential = await prisma.credential.create({
      data: credentialData
    });
    
    res.status(201).json({
      success: true,
      data: newCredential
    });
  } catch (error: any) {
    logger.error(`Error creating credential: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to create credential: ${error.message}`
    });
  }
});

// Placeholder route for updating a credential
router.put('/:id', (req, res) => {
  res.status(200).json({ message: `Update credential with ID: ${req.params.id}` });
});

// Placeholder route for deleting a credential
router.delete('/:id', (req, res) => {
  res.status(200).json({ message: `Delete credential with ID: ${req.params.id}` });
});

export const credentialRoutes = router; 