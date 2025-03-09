import express from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { prisma } from '../../db/prisma';
import { logger } from '../../utils/logger';
import { encryptCredential, decryptCredential, validateCredentialData } from '../../core/credentials/credentialManager';
import { getPluginManager } from '../../plugins';

const router = express.Router();

// Get available credential types
router.get('/types', async (req, res) => {
  try {
    const pluginManager = getPluginManager();
    const availableTypes = pluginManager.getAvailablePluginTypes();
    
    // Map each type to a description
    const typesWithDescription = availableTypes.map(type => {
      const plugin = pluginManager.getPlugin(type);
      return {
        type,
        description: plugin ? plugin.getDescription() : `${type} Credentials`
      };
    });
    
    res.status(200).json({
      success: true,
      types: typesWithDescription
    });
  } catch (error: any) {
    logger.error(`Error getting credential types: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get credential types'
    });
  }
});

// Apply authentication middleware to all other credential routes
router.use(authenticateJWT);

// Get all credentials for a user, optionally filtered by application
router.get('/', async (req, res) => {
  try {
    const { applicationId } = req.query;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - User ID not found'
      });
    }
    
    // Build query based on whether application ID is provided
    const whereClause: any = {
      userId
    };
    
    // If application ID is provided, filter by that application
    if (applicationId) {
      whereClause.applications = {
        some: {
          id: applicationId as string
        }
      };
    }
    
    const credentials = await prisma.credential.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Mask sensitive data
    const maskedCredentials = credentials.map(cred => ({
      ...cred,
      data: { type: cred.type, masked: true }
    }));
    
    res.status(200).json({
      success: true,
      data: maskedCredentials
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
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - User ID not found'
      });
    }

    const credential = await prisma.credential.findFirst({
      where: { 
        id,
        userId
      }
    });
    
    if (!credential) {
      return res.status(404).json({
        success: false,
        error: `Credential with ID ${id} not found`
      });
    }
    
    // Mask sensitive data
    const maskedCredential = {
      ...credential,
      data: { type: credential.type, masked: true }
    };
    
    res.status(200).json({
      success: true,
      data: maskedCredential
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
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - User ID not found'
      });
    }

    const { name, type, data } = req.body;

    // Validate required fields
    if (!name || !type || !data) {
      return res.status(400).json({
        success: false,
        error: 'Name, type, and data are required'
      });
    }

    // Get the plugin manager and check if the plugin type is enabled
    const pluginManager = getPluginManager();
    if (!pluginManager.isPluginEnabled(type)) {
      return res.status(400).json({
        success: false,
        error: `Credential type ${type} is currently disabled or not available`
      });
    }

    // Validate credential data
    try {
      validateCredentialData(data);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Validate with plugin
    const validationResult = await pluginManager.validateCredential(type, data);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: validationResult.error || 'Invalid credential data'
      });
    }

    // Encrypt the credential data
    const encryptedData = encryptCredential(data);

    // Convert type string to Prisma enum if needed
    // This ensures compatibility between plugin types and Prisma schema types
    let credentialType;
    try {
      // For Prisma, we need to make sure the type is one of the enum values
      // This handles both standard types and custom plugin types
      credentialType = type as any;
      
      // Create the credential
      const credential = await prisma.credential.create({
        data: {
          name,
          type: credentialType,
          data: encryptedData,
          userId
        }
      });

      // Log the creation
      await prisma.auditEvent.create({
        data: {
          type: 'CREDENTIAL_CREATED',
          details: {
            credentialId: credential.id,
            credentialName: name,
            credentialType: type
          },
          userId,
          credentialId: credential.id
        }
      });

      // Return masked credential
      const maskedCredential = {
        ...credential,
        data: { type: credential.type, masked: true }
      };
      
      res.status(201).json({
        success: true,
        data: maskedCredential
      });
    } catch (error: any) {
      logger.error(`Database error creating credential: ${error.message}`);
      // Check for specific Prisma errors
      if (error.message.includes('Invalid value for argument `type`')) {
        return res.status(400).json({
          success: false,
          error: `Invalid credential type: ${type}. This may need to be added to the CredentialType enum in the Prisma schema.`
        });
      }
      throw error; // Let the outer catch handle other errors
    }
  } catch (error: any) {
    logger.error(`Error creating credential: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to create credential: ${error.message}`
    });
  }
});

// Update a credential
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - User ID not found'
      });
    }

    const { name, data } = req.body;

    // Find the credential
    const existingCredential = await prisma.credential.findFirst({
      where: { 
        id,
        userId
      }
    });

    if (!existingCredential) {
      return res.status(404).json({
        success: false,
        error: `Credential with ID ${id} not found`
      });
    }

    // Get plugin manager and check if plugin is enabled 
    const pluginManager = getPluginManager();
    if (!pluginManager.isPluginEnabled(existingCredential.type)) {
      return res.status(400).json({
        success: false,
        error: `Cannot update credential: type ${existingCredential.type} is currently disabled`
      });
    }

    // Prepare update data
    const updateData: any = {};

    if (name) {
      updateData.name = name;
    }

    if (data) {
      // Validate credential data
      try {
        validateCredentialData(data);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      // Validate with plugin
      const validationResult = await pluginManager.validateCredential(existingCredential.type, data);
      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          error: validationResult.error || 'Invalid credential data'
        });
      }

      // Encrypt the new data
      updateData.data = encryptCredential(data);
    }

    // Update the credential
    const updatedCredential = await prisma.credential.update({
      where: { id },
      data: updateData
    });

    // Log the update
    await prisma.auditEvent.create({
      data: {
        type: 'CREDENTIAL_UPDATED',
        details: {
          credentialId: id,
          credentialName: updatedCredential.name,
          credentialType: updatedCredential.type,
          fieldsUpdated: Object.keys(updateData)
        },
        userId,
        credentialId: id
      }
    });

    // Return masked credential
    const maskedCredential = {
      ...updatedCredential,
      data: { type: updatedCredential.type, masked: true }
    };
    
    res.status(200).json({
      success: true,
      data: maskedCredential
    });
  } catch (error: any) {
    logger.error(`Error updating credential: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to update credential: ${error.message}`
    });
  }
});

// Delete a credential
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - User ID not found'
      });
    }

    // Find the credential
    const credential = await prisma.credential.findFirst({
      where: { 
        id,
        userId
      }
    });

    if (!credential) {
      return res.status(404).json({
        success: false,
        error: `Credential with ID ${id} not found`
      });
    }

    // Delete the credential
    await prisma.credential.delete({
      where: { id }
    });

    // Log the deletion
    await prisma.auditEvent.create({
      data: {
        type: 'CREDENTIAL_DELETED',
        details: {
          credentialId: id,
          credentialName: credential.name,
          credentialType: credential.type
        },
        userId
      }
    });

    res.status(200).json({
      success: true,
      message: 'Credential deleted successfully'
    });
  } catch (error: any) {
    logger.error(`Error deleting credential: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to delete credential: ${error.message}`
    });
  }
});

// Enable a credential
router.post('/:id/enable', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - User ID not found'
      });
    }

    // Find the credential to ensure it exists and belongs to the user
    const credential = await prisma.credential.findFirst({
      where: { 
        id,
        userId
      }
    });

    if (!credential) {
      return res.status(404).json({
        success: false,
        error: `Credential with ID ${id} not found`
      });
    }

    // Check if the plugin type is enabled
    const pluginManager = getPluginManager();
    if (!pluginManager.isPluginEnabled(credential.type)) {
      return res.status(400).json({
        success: false,
        error: `Cannot enable credential: type ${credential.type} is currently disabled`
      });
    }

    // Update the credential to be enabled (using a Prisma property update)
    const updatedCredential = await prisma.credential.update({
      where: { id },
      data: { 
        isEnabled: true,
        updatedAt: new Date()
      }
    });

    // Log the action
    await prisma.auditEvent.create({
      data: {
        type: 'CREDENTIAL_ENABLED',
        details: {
          credentialId: id,
          credentialName: credential.name,
          credentialType: credential.type
        },
        userId,
        credentialId: id
      }
    });

    // Return success
    res.status(200).json({
      success: true,
      message: 'Credential enabled successfully',
      data: {
        ...updatedCredential,
        data: { type: updatedCredential.type, masked: true }
      }
    });
  } catch (error: any) {
    logger.error(`Error enabling credential: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to enable credential: ${error.message}`
    });
  }
});

// Disable a credential
router.post('/:id/disable', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - User ID not found'
      });
    }

    // Find the credential to ensure it exists and belongs to the user
    const credential = await prisma.credential.findFirst({
      where: { 
        id,
        userId
      }
    });

    if (!credential) {
      return res.status(404).json({
        success: false,
        error: `Credential with ID ${id} not found`
      });
    }

    // Update the credential to be disabled (using a Prisma property update)
    const updatedCredential = await prisma.credential.update({
      where: { id },
      data: { 
        isEnabled: false,
        updatedAt: new Date()
      }
    });

    // Log the action
    await prisma.auditEvent.create({
      data: {
        type: 'CREDENTIAL_DISABLED',
        details: {
          credentialId: id,
          credentialName: credential.name,
          credentialType: credential.type
        },
        userId,
        credentialId: id
      }
    });

    // Return success
    res.status(200).json({
      success: true,
      message: 'Credential disabled successfully',
      data: {
        ...updatedCredential,
        data: { type: updatedCredential.type, masked: true }
      }
    });
  } catch (error: any) {
    logger.error(`Error disabling credential: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to disable credential: ${error.message}`
    });
  }
});

export const credentialRoutes = router; 