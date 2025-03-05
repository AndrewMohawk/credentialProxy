import { Request, Response } from 'express';
import { Policy, PolicyType } from '../../core/policies/policyEngine';
import { validatePolicy, getPolicyTemplate, getPolicySuggestions, getPolicyFieldPaths } from '../../core/policies/validators/policyValidator';
import { logger } from '../../utils/logger';

/**
 * Controller for policy validation and simulation
 */
export class PolicyValidationController {
  /**
   * Validate a policy against its schema
   * @param req Express request with policy in body
   * @param res Express response
   */
  async validatePolicy(req: Request, res: Response): Promise<void> {
    try {
      const policy = req.body as Policy;
      
      if (!policy) {
        res.status(400).json({ 
          valid: false, 
          errors: [{ path: '', message: 'Policy not provided' }] 
        });
        return;
      }
      
      const validationResult = validatePolicy(policy);
      res.json(validationResult);
    } catch (error) {
      logger.error('Error validating policy', { error });
      res.status(500).json({ 
        valid: false, 
        errors: [{ path: '', message: 'Server error during validation' }] 
      });
    }
  }

  /**
   * Get a template for a specific policy type
   * @param req Express request with policy type in params
   * @param res Express response
   */
  async getPolicyTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      
      if (!type || !Object.values(PolicyType).includes(type as PolicyType)) {
        res.status(400).json({ 
          error: 'Invalid policy type',
          validTypes: Object.values(PolicyType)
        });
        return;
      }
      
      const template = getPolicyTemplate(type as PolicyType);
      res.json(template);
    } catch (error) {
      logger.error('Error getting policy template', { error });
      res.status(500).json({ error: 'Server error retrieving template' });
    }
  }

  /**
   * Simulate applying a policy to an operation request
   * @param req Express request with policy and operation details
   * @param res Express response
   */
  async simulatePolicy(req: Request, res: Response): Promise<void> {
    try {
      const { policy, operationRequest } = req.body;
      
      if (!policy || !operationRequest) {
        res.status(400).json({ 
          error: 'Both policy and operationRequest are required'
        });
        return;
      }
      
      // Validate the policy first
      const validationResult = validatePolicy(policy);
      if (!validationResult.valid) {
        res.status(400).json({
          result: 'INVALID_POLICY',
          passed: false,
          validationErrors: validationResult.errors,
          details: 'Policy validation failed'
        });
        return;
      }
      
      // This is a placeholder for actual policy simulation logic
      // In a real implementation, this would evaluate the policy against the operation
      const simulationResult = this.mockPolicySimulation(policy, operationRequest);
      
      res.json(simulationResult);
    } catch (error) {
      logger.error('Error simulating policy', { error });
      res.status(500).json({ error: 'Server error during policy simulation' });
    }
  }

  /**
   * Get completion suggestions for a policy
   * @param req Express request with policy type and path
   * @param res Express response
   */
  async getPolicySuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const { path } = req.query;
      
      if (!type || !Object.values(PolicyType).includes(type as PolicyType)) {
        res.status(400).json({ 
          error: 'Invalid policy type',
          validTypes: Object.values(PolicyType)
        });
        return;
      }
      
      const suggestions = getPolicySuggestions(
        type as PolicyType, 
        path ? String(path) : undefined
      );
      
      res.json(suggestions);
    } catch (error) {
      logger.error('Error getting policy suggestions', { error });
      res.status(500).json({ error: 'Server error retrieving suggestions' });
    }
  }

  /**
   * Get all valid field paths for a policy type
   * @param req Express request with policy type
   * @param res Express response
   */
  async getPolicyFieldPaths(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      
      if (!type || !Object.values(PolicyType).includes(type as PolicyType)) {
        res.status(400).json({ 
          error: 'Invalid policy type',
          validTypes: Object.values(PolicyType)
        });
        return;
      }
      
      const paths = getPolicyFieldPaths(type as PolicyType);
      res.json(paths);
    } catch (error) {
      logger.error('Error getting policy field paths', { error });
      res.status(500).json({ error: 'Server error retrieving field paths' });
    }
  }

  /**
   * Mock policy simulation - placeholder for actual simulation logic
   * @param policy The policy to simulate
   * @param operationRequest The operation request to test against
   * @returns Simulation result
   */
  private mockPolicySimulation(policy: Policy, operationRequest: any): any {
    // This is a placeholder for actual simulation logic
    // In a real implementation, we would evaluate the policy against the operation request
    
    const passed = Math.random() > 0.3; // Randomly determine pass/fail for demo
    
    if (passed) {
      return {
        result: 'ALLOWED',
        passed: true,
        details: 'Operation would be allowed by this policy'
      };
    } else {
      return {
        result: 'DENIED',
        passed: false,
        details: `Operation denied: ${policy.message || 'Policy conditions not met'}`
      };
    }
  }
} 