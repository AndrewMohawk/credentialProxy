import { Request, Response } from 'express';
import { prisma } from '../../db/index';
import { logger } from '../../utils/logger';
import { validatePolicy } from '../../core/policies/validators/policyValidator';
import { Policy } from '../../core/policies/policyEngine';

/**
 * Note: Several TypeScript errors are suppressed with @ts-ignore directives
 * due to schema differences between the Prisma models and our application models.
 * The actual runtime behavior is correct.
 */

/**
 * Controller for managing policies
 */
export class PolicyController {
  /**
   * Get all policies for a credential
   * @param req Express request
   * @param res Express response
   */
  async getPolicies(req: Request, res: Response): Promise<void> {
    try {
      const { credentialId } = req.params;
      
      if (!credentialId) {
        res.status(400).json({ error: 'Credential ID is required' });
        return;
      }
      
      const policies = await prisma.policy.findMany({
        where: { credentialId }
      });
      
      res.json(policies);
    } catch (error) {
      logger.error('Error retrieving policies', { error });
      res.status(500).json({ error: 'Error retrieving policies' });
    }
  }

  /**
   * Get a specific policy by ID
   * @param req Express request
   * @param res Express response
   */
  async getPolicy(req: Request, res: Response): Promise<void> {
    try {
      const { policyId } = req.params;
      
      if (!policyId) {
        res.status(400).json({ error: 'Policy ID is required' });
        return;
      }
      
      const policy = await prisma.policy.findUnique({
        where: { id: policyId }
      });
      
      if (!policy) {
        res.status(404).json({ error: 'Policy not found' });
        return;
      }
      
      res.json(policy);
    } catch (error) {
      logger.error('Error retrieving policy', { error });
      res.status(500).json({ error: 'Error retrieving policy' });
    }
  }

  /**
   * Create a new policy
   * @param req Express request
   * @param res Express response
   */
  async createPolicy(req: Request, res: Response): Promise<void> {
    try {
      const { credentialId } = req.params;
      const policyData = req.body;
      
      if (!credentialId) {
        res.status(400).json({ error: 'Credential ID is required' });
        return;
      }
      
      // Check if credential exists
      const credential = await prisma.credential.findUnique({
        where: { id: credentialId }
      });
      
      if (!credential) {
        res.status(404).json({ error: 'Credential not found' });
        return;
      }
      
      // Validate policy
      const validationResult = validatePolicy(policyData as Policy);
      if (!validationResult.valid) {
        res.status(400).json({
          error: 'Invalid policy configuration',
          validationErrors: validationResult.errors
        });
        return;
      }
      
      // Create the policy
      const policy = await prisma.policy.create({
        data: {
          name: policyData.name,
          description: policyData.description,
          type: policyData.type,
          config: policyData as any,
          enabled: true,
          version: 1,
          credentialId,
          createdBy: req.user?.id
        }
      });
      
      res.status(201).json(policy);
    } catch (error) {
      logger.error('Error creating policy', { error });
      res.status(500).json({ error: 'Error creating policy' });
    }
  }

  /**
   * Update an existing policy
   * @param req Express request
   * @param res Express response
   */
  async updatePolicy(req: Request, res: Response): Promise<void> {
    try {
      const { policyId } = req.params;
      const policyData = req.body;
      
      if (!policyId) {
        res.status(400).json({ error: 'Policy ID is required' });
        return;
      }
      
      // Check if policy exists
      const existingPolicy = await prisma.policy.findUnique({
        where: { id: policyId }
      });
      
      if (!existingPolicy) {
        res.status(404).json({ error: 'Policy not found' });
        return;
      }
      
      // Validate policy
      const validationResult = validatePolicy(policyData as Policy);
      if (!validationResult.valid) {
        res.status(400).json({
          error: 'Invalid policy configuration',
          validationErrors: validationResult.errors
        });
        return;
      }
      
      // Update the policy and increment version
      const policy = await prisma.policy.update({
        where: { id: policyId },
        data: {
          name: policyData.name,
          description: policyData.description,
          type: policyData.type,
          config: policyData as any,
          version: { increment: 1 },
          updatedAt: new Date()
        }
      });
      
      res.json(policy);
    } catch (error) {
      logger.error('Error updating policy', { error });
      res.status(500).json({ error: 'Error updating policy' });
    }
  }

  /**
   * Enable or disable a policy
   * @param req Express request
   * @param res Express response
   */
  async togglePolicy(req: Request, res: Response): Promise<void> {
    try {
      const { policyId } = req.params;
      const { enabled } = req.body;
      
      if (!policyId) {
        res.status(400).json({ error: 'Policy ID is required' });
        return;
      }
      
      if (typeof enabled !== 'boolean') {
        res.status(400).json({ error: 'Enabled status must be a boolean' });
        return;
      }
      
      // Check if policy exists
      const existingPolicy = await prisma.policy.findUnique({
        where: { id: policyId }
      });
      
      if (!existingPolicy) {
        res.status(404).json({ error: 'Policy not found' });
        return;
      }
      
      // Update the policy's enabled status
      const policy = await prisma.policy.update({
        where: { id: policyId },
        data: {
          enabled,
          updatedAt: new Date()
        }
      });
      
      res.json(policy);
    } catch (error) {
      logger.error('Error toggling policy', { error });
      res.status(500).json({ error: 'Error toggling policy' });
    }
  }

  /**
   * Delete a policy
   * @param req Express request
   * @param res Express response
   */
  async deletePolicy(req: Request, res: Response): Promise<void> {
    try {
      const { policyId } = req.params;
      
      if (!policyId) {
        res.status(400).json({ error: 'Policy ID is required' });
        return;
      }
      
      // Check if policy exists
      const existingPolicy = await prisma.policy.findUnique({
        where: { id: policyId }
      });
      
      if (!existingPolicy) {
        res.status(404).json({ error: 'Policy not found' });
        return;
      }
      
      // Delete the policy
      await prisma.policy.delete({
        where: { id: policyId }
      });
      
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting policy', { error });
      res.status(500).json({ error: 'Error deleting policy' });
    }
  }
} 