import { Request, Response } from 'express';
import { PluginManager } from '../../plugins/PluginManager';
import { PolicyTemplateService } from '../../core/policies/policyTemplateService';
import { 
  getTemplateById, 
  getTemplatesForCredentialType, 
  getRecommendedTemplates,
  ALL_TEMPLATES,
  TemplateCategory 
} from '../../core/policies/policyTemplates';
import { PolicyType } from '../../core/policies/policyTypes';
import { logger } from '../../utils/logger';
import { prisma } from '../../db/prisma';

const pluginManager = PluginManager.getInstance();
const policyTemplateService = new PolicyTemplateService(pluginManager);

/**
 * Get all policy templates
 */
export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    // Group templates by category
    const templatesByCategory = ALL_TEMPLATES.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {} as Record<TemplateCategory, any[]>);
    
    // Format for response
    const categories = Object.keys(templatesByCategory).map(category => ({
      name: category,
      templates: templatesByCategory[category as TemplateCategory],
    }));
    
    res.status(200).json({
      success: true,
      data: {
        templates: ALL_TEMPLATES,
        categories,
      },
    });
  } catch (error: any) {
    logger.error(`Error fetching templates: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to fetch templates: ${error.message}`
    });
  }
};

/**
 * Get templates for a specific credential type
 */
export const getTemplatesForType = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    const { credentialType } = req.params;
    
    if (!credentialType) {
      return res.status(400).json({
        success: false,
        error: 'Credential type is required'
      });
    }
    
    const templates = getTemplatesForCredentialType(credentialType.toLowerCase());
    
    // Group templates by category
    const templatesByCategory = templates.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {} as Record<TemplateCategory, any[]>);
    
    // Format for response
    const categories = Object.keys(templatesByCategory).map(category => ({
      name: category,
      templates: templatesByCategory[category as TemplateCategory],
    }));
    
    res.status(200).json({
      success: true,
      data: {
        templates,
        categories,
        recommended: getRecommendedTemplates(credentialType.toLowerCase()),
      },
    });
  } catch (error: any) {
    logger.error(`Error fetching templates for type: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to fetch templates: ${error.message}`
    });
  }
};

/**
 * Get a specific template by ID
 */
export const getTemplate = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required'
      });
    }
    
    const template = getTemplateById(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    logger.error(`Error fetching template: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to fetch template: ${error.message}`
    });
  }
};

/**
 * Get templates for a specific credential
 */
export const getTemplatesForCredential = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    const { credentialId } = req.params;
    
    if (!credentialId) {
      return res.status(400).json({
        success: false,
        error: 'Credential ID is required'
      });
    }
    
    // Check if the credential belongs to the user
    const credential = await prisma.credential.findFirst({
      where: {
        id: credentialId,
        userId: req.user.id,
      },
    });
    
    if (!credential) {
      return res.status(404).json({
        success: false,
        error: 'Credential not found or does not belong to you'
      });
    }
    
    const templates = getTemplatesForCredentialType(credential.type.toLowerCase());
    
    res.status(200).json({
      success: true,
      data: {
        templates,
        recommended: getRecommendedTemplates(credential.type.toLowerCase()),
        credential: {
          id: credential.id,
          name: credential.name,
          type: credential.type,
        },
      },
    });
  } catch (error: any) {
    logger.error(`Error fetching templates for credential: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to fetch templates: ${error.message}`
    });
  }
};

/**
 * Apply a template to a credential
 */
export const applyTemplate = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    const { credentialId } = req.params;
    const { templateId, applicationId, customization } = req.body;
    
    if (!credentialId || !templateId) {
      return res.status(400).json({
        success: false,
        error: 'Credential ID and template ID are required'
      });
    }
    
    // Check if the credential belongs to the user
    const credential = await prisma.credential.findFirst({
      where: {
        id: credentialId,
        userId: req.user.id,
      },
    });
    
    if (!credential) {
      return res.status(404).json({
        success: false,
        error: 'Credential not found or does not belong to you'
      });
    }
    
    // If applicationId is provided, check if it's associated with the credential
    if (applicationId) {
      const application = await prisma.application.findFirst({
        where: {
          id: applicationId,
          credentials: {
            some: {
              id: credentialId,
            },
          },
        },
      });
      
      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Application not found or not associated with this credential'
        });
      }
    }
    
    // Apply the template
    const policy = await policyTemplateService.applyTemplate(
      templateId,
      credentialId,
      applicationId,
      customization
    );
    
    if (!policy) {
      return res.status(400).json({
        success: false,
        error: 'Failed to apply template. Template may not be compatible with credential type.'
      });
    }
    
    // Create audit record
    await prisma.auditEvent.create({
      data: {
        type: 'POLICY_CREATED',
        details: {
          templateId,
          credentialId,
          applicationId,
          policyId: policy.id,
        },
        userId: req.user.id,
        credentialId,
        applicationId,
        policyId: policy.id,
      },
    });
    
    res.status(201).json({
      success: true,
      data: policy,
      message: 'Template applied successfully',
    });
  } catch (error: any) {
    logger.error(`Error applying template: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to apply template: ${error.message}`
    });
  }
};

/**
 * Apply recommended templates to a credential
 */
export const applyRecommendedTemplates = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    const { credentialId } = req.params;
    
    if (!credentialId) {
      return res.status(400).json({
        success: false,
        error: 'Credential ID is required'
      });
    }
    
    // Check if the credential belongs to the user
    const credential = await prisma.credential.findFirst({
      where: {
        id: credentialId,
        userId: req.user.id,
      },
    });
    
    if (!credential) {
      return res.status(404).json({
        success: false,
        error: 'Credential not found or does not belong to you'
      });
    }
    
    // Apply recommended templates
    const policies = await policyTemplateService.applyRecommendedTemplates(credentialId);
    
    // Create audit record
    await prisma.auditEvent.create({
      data: {
        type: 'RECOMMENDED_POLICIES_APPLIED',
        details: {
          credentialId,
          policyCount: policies.length,
          policyIds: policies.map(p => p.id),
        },
        userId: req.user.id,
        credentialId,
      },
    });
    
    res.status(201).json({
      success: true,
      data: {
        policies,
        count: policies.length,
      },
      message: `${policies.length} recommended templates applied successfully`,
    });
  } catch (error: any) {
    logger.error(`Error applying recommended templates: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Failed to apply recommended templates: ${error.message}`
    });
  }
}; 