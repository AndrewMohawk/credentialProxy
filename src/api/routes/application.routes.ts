import express from 'express';
import { authMiddleware } from '../../middleware/auth';
import { prisma } from '../../db/prisma';
import { logger } from '../../utils/logger';

const router = express.Router();

// Apply auth middleware to all application routes
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

// Placeholder route for updating an application
router.put('/:id', (req, res) => {
  res.status(200).json({ message: `Update application with ID: ${req.params.id}` });
});

// Placeholder route for deleting an application
router.delete('/:id', (req, res) => {
  res.status(200).json({ message: `Delete application with ID: ${req.params.id}` });
});

export const applicationRoutes = router; 