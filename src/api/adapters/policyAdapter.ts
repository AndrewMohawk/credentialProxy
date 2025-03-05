/**
 * Policy Adapter
 * 
 * This module provides utilities to transform between Prisma Policy models and application Policy objects.
 * It handles differences in field naming and structure.
 */

import { Policy as PrismaPolicy } from '@prisma/client';
import { PolicyType } from '../../core/policies/policyEngine';

/**
 * The application Policy interface 
 */
export interface ApplicationPolicy {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  credentialId: string;
  applicationId?: string;
  scope?: string;
  configuration?: any;
  priority?: number;
  credential?: any;
  application?: any;
}

/**
 * Convert a Prisma Policy object to an Application Policy object
 */
export function prismaToApplicationPolicy(
  prismaPolicy: any
): ApplicationPolicy {
  // Extract config from the JSON field
  const configObj = prismaPolicy.config 
    ? (typeof prismaPolicy.config === 'string' ? JSON.parse(prismaPolicy.config) : prismaPolicy.config) 
    : {};
  
  // Determine scope based on available information
  const scope = configObj.scope || 'CREDENTIAL';
  
  // Create the application policy object
  const applicationPolicy: ApplicationPolicy = {
    id: prismaPolicy.id,
    name: prismaPolicy.name,
    description: prismaPolicy.description,
    type: prismaPolicy.type,
    isActive: prismaPolicy.enabled,
    version: prismaPolicy.version,
    createdAt: prismaPolicy.createdAt,
    updatedAt: prismaPolicy.updatedAt,
    credentialId: prismaPolicy.credentialId,
    scope: scope,
    configuration: configObj,
    priority: configObj.priority || 100
  };
  
  // Add applicationId if present in config
  if (configObj.applicationId) {
    applicationPolicy.applicationId = configObj.applicationId;
  }
  
  // Add credential information if available
  if (prismaPolicy.credential) {
    applicationPolicy.credential = prismaPolicy.credential;
  }
  
  // Add application information if available
  if (prismaPolicy.application) {
    applicationPolicy.application = prismaPolicy.application;
  }
  
  return applicationPolicy;
}

/**
 * Convert an Application Policy object to a Prisma Policy data object
 * for create or update operations
 */
export function applicationToPrismaPolicy(applicationPolicy: Partial<ApplicationPolicy>): any {
  // Create config object from various fields
  const config: any = {
    ...(applicationPolicy.configuration || {}),
    scope: applicationPolicy.scope || 'CREDENTIAL',
    priority: applicationPolicy.priority || 100
  };
  
  // Add applicationId to config if present
  if (applicationPolicy.applicationId) {
    config.applicationId = applicationPolicy.applicationId;
  }
  
  // Create the prisma policy data
  const prismaData: any = {
    name: applicationPolicy.name,
    description: applicationPolicy.description,
    type: applicationPolicy.type,
    enabled: applicationPolicy.isActive,
    config: config
  };
  
  // Add credentialId if present
  if (applicationPolicy.credentialId) {
    prismaData.credentialId = applicationPolicy.credentialId;
  }
  
  // Add version if present
  if (applicationPolicy.version) {
    prismaData.version = applicationPolicy.version;
  }
  
  return prismaData;
} 