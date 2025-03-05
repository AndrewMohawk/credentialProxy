/**
 * Service for tracking and retrieving usage metrics
 */

import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { redis } from '../core/queue';

/**
 * Time windows for usage metrics
 */
export type TimeWindow = 'hourly' | 'daily' | 'weekly' | 'monthly';

/**
 * Get current usage metrics for a credential
 * @param credentialId The credential ID to check
 * @param metricType The type of metric to retrieve
 * @param timeWindow The time window to consider
 * @returns The current usage value
 */
export async function getUsageMetrics(
  credentialId: string,
  metricType: string,
  timeWindow: TimeWindow
): Promise<number> {
  try {
    const key = `usage:${metricType}:${credentialId}:${timeWindow}`;
    
    // First try to get from Redis
    const cachedValue = await redis.get(key);
    if (cachedValue !== null) {
      return parseFloat(cachedValue);
    }
    
    // If not in cache, query the database
    const startDate = new Date();
    
    switch (timeWindow) {
    case 'hourly':
      startDate.setHours(startDate.getHours() - 1);
      break;
    case 'daily':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'weekly':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'monthly':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    }
    
    let usage = 0;
    
    // Different handling based on metric type
    switch (metricType) {
    case 'request_count':
      usage = await getRequestCount(credentialId, startDate);
      break;
    case 'api_calls':
      usage = await getAPICallCount(credentialId, startDate);
      break;
    case 'eth_value':
      usage = await getEthereumValue(credentialId, startDate);
      break;
    case 'data_transferred':
      usage = await getDataTransferred(credentialId, startDate);
      break;
    default:
      logger.warn(`Unknown metric type: ${metricType}`);
      return 0;
    }
    
    // Cache the result
    const ttl = getTimeWindowTTL(timeWindow);
    await redis.set(key, usage.toString(), { EX: ttl });
    
    return usage;
  } catch (error) {
    logger.error(`Error getting usage metrics: ${error}`);
    return 0;
  }
}

/**
 * Record usage for a credential
 * @param credentialId The credential ID
 * @param metricType The type of metric
 * @param value The value to record
 */
export async function recordUsage(
  credentialId: string,
  metricType: string,
  value: number
): Promise<void> {
  try {
    // Insert a usage record
    await prisma.auditEvent.create({
      data: {
        type: 'USAGE_METRIC',
        details: {
          metricType,
          value,
        },
        credentialId,
      }
    });
    
    // Update Redis counters
    const timeWindows: TimeWindow[] = ['hourly', 'daily', 'weekly', 'monthly'];
    
    for (const timeWindow of timeWindows) {
      const key = `usage:${metricType}:${credentialId}:${timeWindow}`;
      
      // Get current value
      let current = 0;
      const cachedValue = await redis.get(key);
      
      if (cachedValue !== null) {
        current = parseFloat(cachedValue);
      }
      
      // Update with new value
      const newValue = current + value;
      
      // Set with appropriate TTL
      const ttl = getTimeWindowTTL(timeWindow);
      await redis.set(key, newValue.toString(), { EX: ttl });
    }
  } catch (error) {
    logger.error(`Error recording usage: ${error}`);
  }
}

/**
 * Get TTL for Redis cache based on time window
 */
function getTimeWindowTTL(timeWindow: TimeWindow): number {
  switch (timeWindow) {
  case 'hourly':
    return 3600; // 1 hour
  case 'daily':
    return 86400; // 24 hours
  case 'weekly':
    return 604800; // 7 days
  case 'monthly':
    return 2592000; // 30 days
  default:
    return 3600; // Default to 1 hour
  }
}

/**
 * Get request count for a credential
 */
async function getRequestCount(credentialId: string, startDate: Date): Promise<number> {
  const count = await prisma.auditEvent.count({
    where: {
      credentialId,
      type: 'CREDENTIAL_ACCESS',
      createdAt: {
        gte: startDate
      }
    }
  });
  
  return count;
}

/**
 * Get API call count for a credential
 */
async function getAPICallCount(credentialId: string, startDate: Date): Promise<number> {
  const count = await prisma.auditEvent.count({
    where: {
      credentialId,
      type: 'API_CALL',
      createdAt: {
        gte: startDate
      }
    }
  });
  
  return count;
}

/**
 * Get total Ethereum value transferred through a credential
 */
async function getEthereumValue(credentialId: string, startDate: Date): Promise<number> {
  const events = await prisma.auditEvent.findMany({
    where: {
      credentialId,
      type: 'ETH_TRANSACTION',
      createdAt: {
        gte: startDate
      }
    },
    select: {
      details: true
    }
  });
  
  let totalValue = 0;
  
  for (const event of events) {
    if (event.details && typeof event.details === 'object' && 'value' in event.details) {
      const value = (event.details as any).value;
      if (typeof value === 'number') {
        totalValue += value;
      }
    }
  }
  
  return totalValue;
}

/**
 * Get total data transferred through a credential
 */
async function getDataTransferred(credentialId: string, startDate: Date): Promise<number> {
  const events = await prisma.auditEvent.findMany({
    where: {
      credentialId,
      type: 'DATA_TRANSFER',
      createdAt: {
        gte: startDate
      }
    },
    select: {
      details: true
    }
  });
  
  let totalBytes = 0;
  
  for (const event of events) {
    if (event.details && typeof event.details === 'object' && 'bytes' in event.details) {
      const bytes = (event.details as any).bytes;
      if (typeof bytes === 'number') {
        totalBytes += bytes;
      }
    }
  }
  
  return totalBytes;
} 