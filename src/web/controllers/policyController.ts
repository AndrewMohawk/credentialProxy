import { Request, Response } from 'express';
import {
  createPolicy,
  updatePolicy,
  fetchPolicy,
  fetchPolicies,
  deletePolicy,
  simulatePolicy
} from '../../services/policyService';
import { Policy, PolicyType } from '../../core/policies/policyEngine';
import { validatePolicy } from '../../core/policies/policyValidation';
import { 
  getTemplateById, 
  getTemplatesForCredentialType, 
  PolicyTemplate 
} from '../../core/policies/policyTemplates';

export const policyController = {
  // CRUD operations
  
  listPolicies: async (req: Request, res: Response) => {
    try {
      const { credentialId } = req.query;
      const policies = await fetchPolicies(credentialId as string);
      res.json(policies);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
  
  getPolicy: async (req: Request, res: Response) => {
    try {
      const policy = await fetchPolicy(req.params.id);
      res.json(policy);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  },
  
  createPolicy: async (req: Request, res: Response) => {
    try {
      const { policy, credentialId } = req.body;
      
      // Validate policy
      const validation = await validatePolicy(policy);
      if (!validation.valid) {
        return res.status(400).json({ errors: validation.errors });
      }
      
      const newPolicy = await createPolicy(policy, credentialId);
      res.status(201).json(newPolicy);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
  
  updatePolicy: async (req: Request, res: Response) => {
    try {
      const { policy } = req.body;
      
      // Validate policy
      const validation = await validatePolicy(policy);
      if (!validation.valid) {
        return res.status(400).json({ errors: validation.errors });
      }
      
      const updatedPolicy = await updatePolicy(req.params.id, policy);
      res.json(updatedPolicy);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
  
  deletePolicy: async (req: Request, res: Response) => {
    try {
      await deletePolicy(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
  
  // Policy Simulation
  
  simulatePolicy: async (req: Request, res: Response) => {
    try {
      const { policy, request, credentialId } = req.body;
      
      // Validate policy
      const validation = await validatePolicy(policy);
      if (!validation.valid) {
        return res.status(400).json({ 
          passed: false,
          result: 'INVALID_POLICY',
          details: 'The policy is invalid and cannot be simulated.',
          validationErrors: validation.errors
        });
      }
      
      const result = await simulatePolicy(policy, request);
      
      res.json({
        passed: result.allowed,
        result: result.allowed ? 'ALLOWED' : 'DENIED',
        details: result.reason
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
  
  // Template operations
  
  listTemplates: async (req: Request, res: Response) => {
    try {
      const { credentialType } = req.query;
      
      // Get templates for the specified credential type or all templates if not specified
      const templates: PolicyTemplate[] = credentialType 
        ? getTemplatesForCredentialType(credentialType as string)
        : [];
        
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
  
  getTemplate: async (req: Request, res: Response) => {
    try {
      const templateId = req.params.id;
      const template = getTemplateById(templateId);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      res.json(template);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  },
  
  // View rendering
  
  renderWizard: (req: Request, res: Response) => {
    const { credentialId } = req.query;
    res.render('policies/wizard', { credentialId });
  },
  
  renderWizardEdit: async (req: Request, res: Response) => {
    try {
      const policy = await fetchPolicy(req.params.id);
      res.render('policies/wizard', { policy });
    } catch (error) {
      res.status(404).render('error', { error: (error as Error).message });
    }
  },
  
  // Analytics
  
  renderAnalytics: (req: Request, res: Response) => {
    const { credentialId } = req.query;
    res.render('policies/analytics', { credentialId });
  },
  
  getPolicyAnalytics: async (req: Request, res: Response) => {
    try {
      const { credentialId, timeRange = 'week' } = req.query;
      
      // This would be a real data aggregation query in production
      // For demonstration, we're using mock data
      const mockData = {
        totalPolicies: 12,
        activePolicies: 8,
        policyTypes: {
          [PolicyType.ALLOW_LIST]: 3,
          [PolicyType.DENY_LIST]: 2,
          [PolicyType.TIME_BASED]: 2,
          [PolicyType.COUNT_BASED]: 4,
          [PolicyType.MANUAL_APPROVAL]: 1
        },
        evaluationResults: {
          allowed: 856,
          denied: 142,
          total: 998
        },
        topPolicies: [
          { id: '1', name: 'IP Restrictions', evaluations: 456, denialRate: 0.12 },
          { id: '2', name: 'Business Hours Only', evaluations: 320, denialRate: 0.08 },
          { id: '3', name: 'Rate Limiting', evaluations: 222, denialRate: 0.32 }
        ]
      };
      
      res.json(mockData);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}; 