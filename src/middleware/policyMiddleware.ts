import { Request, Response, NextFunction } from 'express';
import { CredentialManager } from '../core/credential/CredentialManager';
import { logger } from '../utils/logger';
import { Policy, PolicyType } from '../core/policies/policyEngine';
import { prisma } from '../db/index';

/**
 * Middleware to evaluate and apply policies to credential operations
 */
export class PolicyMiddleware {
  private credentialManager: CredentialManager;

  constructor(credentialManager: CredentialManager) {
    this.credentialManager = credentialManager;
  }

  /**
   * Middleware to evaluate policies before allowing operations
   */
  evaluatePolicies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { credentialId, operation } = req.params;
      
      if (!credentialId || !operation) {
        logger.warn('Missing credentialId or operation in request', { 
          path: req.path, 
          method: req.method 
        });
        res.status(400).json({ error: 'Missing credential ID or operation' });
        return;
      }

      // Get the credential
      const credential = await prisma.credential.findUnique({
        where: { id: credentialId },
        include: { policies: true }
      });

      if (!credential) {
        logger.warn('Credential not found', { credentialId });
        res.status(404).json({ error: 'Credential not found' });
        return;
      }

      // If no policies, allow the operation
      if (!credential.policies || credential.policies.length === 0) {
        logger.info('No policies found for credential, allowing operation', { 
          credentialId, 
          operation 
        });
        next();
        return;
      }

      // Evaluate each policy
      const policyResults = await Promise.all(
        credential.policies.map(async (policy: any) => {
          return await this.evaluatePolicy(policy, {
            credential,
            operation,
            user: req.user,
            request: {
              ip: req.ip || '0.0.0.0', // Provide a default IP if undefined
              userAgent: req.headers['user-agent'],
              timestamp: new Date(),
              parameters: req.body
            }
          });
        })
      );

      // Check if any policy denies the operation
      const deniedResults = policyResults.filter((result: any) => !result.allowed);
      if (deniedResults.length > 0) {
        const firstDenial = deniedResults[0];
        logger.info('Operation denied by policy', { 
          credentialId, 
          operation, 
          policyId: firstDenial.policyId, 
          reason: firstDenial.reason 
        });
        
        res.status(403).json({
          error: 'Operation denied by policy',
          reason: firstDenial.reason,
          policyId: firstDenial.policyId
        });
        return;
      }

      // All policies passed, continue
      logger.info('All policies passed, allowing operation', { 
        credentialId, 
        operation 
      });
      next();
    } catch (error) {
      logger.error('Error evaluating policies', { error });
      res.status(500).json({ error: 'Error evaluating policies' });
    }
  };

  /**
   * Evaluate a single policy
   * @param policy The policy to evaluate
   * @param context The operation context
   * @returns Result of policy evaluation
   */
  private async evaluatePolicy(
    policy: Policy, 
    context: {
      credential: any;
      operation: string;
      user: any;
      request: {
        ip: string;
        userAgent?: string;
        timestamp: Date;
        parameters: any;
      };
    }
  ): Promise<{ allowed: boolean; policyId: string; reason?: string }> {
    // Ensure policy.id is not undefined
    const policyId = policy.id || 'unknown-policy';
    
    try {
      // This is a simplified policy evaluation
      // In a real implementation, this would have specific handling for each policy type
      
      switch (policy.type) {
      case PolicyType.ALLOW_LIST: {
        const { allowedValues, targetField } = policy as any;
        const fieldValue = this.getFieldValueFromContext(targetField, context);
          
        if (!allowedValues.includes(fieldValue)) {
          return {
            allowed: false,
            policyId,
            reason: policy.message || `Value '${fieldValue}' is not in the allowed list for field '${targetField}'`
          };
        }
        break;
      }
          
      case PolicyType.DENY_LIST: {
        const { deniedValues, targetField } = policy as any;
        const fieldValue = this.getFieldValueFromContext(targetField, context);
          
        if (deniedValues.includes(fieldValue)) {
          return {
            allowed: false,
            policyId,
            reason: policy.message || `Value '${fieldValue}' is in the denied list for field '${targetField}'`
          };
        }
        break;
      }
          
      case PolicyType.TIME_BASED: {
        const {
          allowedDays,
          allowedHoursStart,
          allowedHoursEnd,
          timezone,
          startDate,
          endDate
        } = policy as any;
          
        const now = new Date();
        const day = now.getDay(); // 0-6, 0 is Sunday
          
        // Check day of week restriction
        if (allowedDays && allowedDays.length > 0 && !allowedDays.includes(day)) {
          return {
            allowed: false,
            policyId,
            reason: policy.message || 'Operation not allowed on this day of the week'
          };
        }
          
        // Check time of day restriction (simplified, doesn't handle timezone properly)
        if (allowedHoursStart && allowedHoursEnd) {
          const [startHour, startMinute] = allowedHoursStart.split(':').map(Number);
          const [endHour, endMinute] = allowedHoursEnd.split(':').map(Number);
            
          const hour = now.getHours();
          const minute = now.getMinutes();
            
          const currentTime = hour * 60 + minute;
          const startTime = startHour * 60 + startMinute;
          const endTime = endHour * 60 + endMinute;
            
          if (currentTime < startTime || currentTime > endTime) {
            return {
              allowed: false,
              policyId,
              reason: policy.message || 'Operation not allowed at this time of day'
            };
          }
        }
          
        // Check date range restriction
        if (startDate) {
          const start = new Date(startDate);
          if (now < start) {
            return {
              allowed: false,
              policyId,
              reason: policy.message || 'Operation not allowed before the policy start date'
            };
          }
        }
          
        if (endDate) {
          const end = new Date(endDate);
          if (now > end) {
            return {
              allowed: false,
              policyId,
              reason: policy.message || 'Operation not allowed after the policy end date'
            };
          }
        }
        break;
      }
          
      case PolicyType.COUNT_BASED: {
        // For demonstration, we'll always allow count-based policies
        // In a real implementation, this would check against a counter in Redis or similar
        logger.info('COUNT_BASED policy evaluation currently stubbed out');
        break;
      }
          
      case PolicyType.MANUAL_APPROVAL: {
        // For demonstration, we'll assume no prior approval and deny
        // In a real implementation, this would check an approvals database
        return {
          allowed: false,
          policyId,
          reason: policy.message || 'This operation requires manual approval before proceeding'
        };
      }
          
      default:
        logger.warn('Unknown policy type', { policyType: policy.type });
      }
      
      // If we get here, the policy allowed the operation
      return { allowed: true, policyId };
    } catch (error) {
      logger.error('Error evaluating policy', { policyId, error });
      
      // Default to allowing if there's an error evaluating the policy
      return {
        allowed: true,
        policyId,
        reason: 'Error evaluating policy'
      };
    }
  }

  /**
   * Get a field value from the context
   * @param field Field path
   * @param context Operation context
   * @returns Field value
   */
  private getFieldValueFromContext(field: string, context: any): any {
    // Simple implementation - in a real app, this would handle nested paths
    const parts = field.split('.');
    let value = context;
    
    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[part];
    }
    
    return value;
  }
} 