/**
 * Credential Manager for handling credential operations
 */

import { prisma } from '../../db';
import { Policy, PolicyType } from '../policies/policyEngine';
import { CredentialType } from '@prisma/client';

/**
 * Credential interface matching Prisma schema
 */
export interface Credential {
  id: string;
  name: string;
  type: CredentialType;
  data: any; // This represents the encrypted credential data
  userId: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  policies?: Policy[];
}

/**
 * Maps a Prisma policy to the application Policy interface
 */
function mapPrismaPolicy(prismaPolicy: any): Policy {
  // Extract policy configuration from the config JSON field
  const config = prismaPolicy.config ? (typeof prismaPolicy.config === 'string' ? JSON.parse(prismaPolicy.config) : prismaPolicy.config) : {};
  
  return {
    id: prismaPolicy.id,
    name: prismaPolicy.name,
    description: prismaPolicy.description || '',
    type: prismaPolicy.type as PolicyType,
    version: prismaPolicy.version,
    isActive: prismaPolicy.enabled, // Map enabled to isActive
    createdAt: prismaPolicy.createdAt.toISOString(),
    updatedAt: prismaPolicy.updatedAt.toISOString(),
    message: config.message,
    
    // Map specific properties based on policy type
    ...(prismaPolicy.type === PolicyType.ALLOW_LIST && {
      targetField: config.targetField,
      allowedValues: config.allowedValues
    }),
    ...(prismaPolicy.type === PolicyType.DENY_LIST && {
      targetField: config.targetField,
      deniedValues: config.deniedValues
    }),
    ...(prismaPolicy.type === PolicyType.TIME_BASED && {
      allowedDays: config.allowedDays,
      allowedHoursStart: config.allowedHoursStart,
      allowedHoursEnd: config.allowedHoursEnd,
      timezone: config.timezone
    }),
    ...(prismaPolicy.type === PolicyType.COUNT_BASED && {
      maxRequests: config.maxRequests,
      timeWindowSeconds: config.timeWindowSeconds
    }),
    ...(prismaPolicy.type === PolicyType.MANUAL_APPROVAL && {
      approvers: config.approvers,
      expirationMinutes: config.expirationMinutes
    })
  };
}

/**
 * Manages credential operations
 */
export class CredentialManager {
  /**
   * Get a credential by ID
   * @param id Credential ID
   * @returns Credential or null if not found
   */
  static async getCredentialById(id: string): Promise<Credential | null> {
    try {
      const credential = await prisma.credential.findUnique({
        where: { id },
        include: {
          policies: true
        }
      });
      
      if (!credential) return null;
      
      // Map Prisma policy objects to application Policy interface
      return {
        ...credential,
        policies: credential.policies?.map(mapPrismaPolicy) || []
      };
    } catch (error) {
      console.error('Error fetching credential:', error);
      return null;
    }
  }

  /**
   * Get a credential by key (via stored data)
   * @param key API key or other identifier
   * @returns Credential or null if not found
   */
  static async getCredentialByKey(key: string): Promise<Credential | null> {
    try {
      // This is a simplified approach - in reality, we'd need to decrypt the data field 
      // and check if it contains the key. For now, we're doing a simple search.
      const credentials = await prisma.credential.findMany({
        include: {
          policies: true
        }
      });
      
      // Find credential with matching key in data
      // This is inefficient and should be replaced with a proper query
      // that uses encryption/decryption or a separate indexed field
      for (const credential of credentials) {
        if (credential.data && typeof credential.data === 'object') {
          const data = credential.data as any;
          if (data.key === key) {
            // Map Prisma policy objects to application Policy interface
            return {
              ...credential,
              policies: credential.policies?.map(mapPrismaPolicy) || []
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching credential by key:', error);
      return null;
    }
  }

  /**
   * Create a new credential
   * @param data Credential data
   * @returns Created credential
   */
  static async createCredential(data: {
    name: string;
    type: CredentialType;
    data: any;
    userId: string;
    isEnabled?: boolean;
  }): Promise<Credential> {
    const credential = await prisma.credential.create({
      data: {
        name: data.name,
        type: data.type,
        data: data.data,
        userId: data.userId,
        isEnabled: data.isEnabled ?? true
      }
    });
    
    return {
      ...credential,
      policies: []
    };
  }

  /**
   * Update an existing credential
   * @param id Credential ID
   * @param data Data to update
   * @returns Updated credential
   */
  static async updateCredential(
    id: string, 
    data: Partial<{
      name: string;
      type: CredentialType;
      data: any;
      userId: string;
      isEnabled: boolean;
    }>
  ): Promise<Credential> {
    const credential = await prisma.credential.update({
      where: { id },
      data,
      include: {
        policies: true
      }
    });
    
    return {
      ...credential,
      policies: credential.policies?.map(mapPrismaPolicy) || []
    };
  }

  /**
   * Delete a credential
   * @param id Credential ID
   * @returns Deleted credential
   */
  static async deleteCredential(id: string): Promise<Credential> {
    const credential = await prisma.credential.delete({
      where: { id },
      include: {
        policies: true
      }
    });
    
    return {
      ...credential,
      policies: credential.policies?.map(mapPrismaPolicy) || []
    };
  }
} 