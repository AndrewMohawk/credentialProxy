import { Queue, Worker } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { config } from '../config';
import { container } from './container';
import { decryptCredential } from '../core/credentials/credentialManager';
import { executeOperation } from './operationExecutor';
import { ServerError } from '../utils/errors';

// Use the queue from the service container
export const proxyQueue = container.get<Queue>('proxyQueue');

// Get prisma client from container
const prisma = container.get<PrismaClient>('db');

// Process proxy requests
export const initProxyQueueProcessor = () => {
  const worker = new Worker(
    'proxy-requests',
    async (job) => {
      const { requestId, applicationId, credentialId, operation, parameters } = job.data;
      
      logger.info(`Processing proxy request ${requestId} for application ${applicationId}`);
      
      try {
        // Get the credential from the database
        const credential = await prisma.credential.findUnique({
          where: { id: credentialId },
        });
        
        if (!credential) {
          throw new Error(`Credential ${credentialId} not found`);
        }
        
        // Get decrypted credential data
        const decryptedData = decryptCredential(credential.data as string);
        
        // Execute the requested operation using the plugin system
        const result = await executeOperation(
          credential,
          operation,
          decryptedData,
          parameters
        );
        
        // Update the audit event with the result
        await prisma.auditEvent.update({
          where: { id: requestId },
          data: {
            requestStatus: 'COMPLETED',
            responseData: JSON.stringify(result),
          },
        });
        
        logger.info(`Successfully processed request ${requestId}`);
        return { success: true, result };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Error processing request ${requestId}: ${errorMessage}`);
        
        // Update the audit event with the error
        await prisma.auditEvent.update({
          where: { id: requestId },
          data: {
            requestStatus: 'ERROR',
            responseData: JSON.stringify({ error: errorMessage }),
          },
        });
        
        return { success: false, error: errorMessage };
      }
    },
    { connection: config.redis.connection }
  );
  
  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed successfully`);
  });
  
  worker.on('failed', (job, error) => {
    logger.error(`Job ${job?.id} failed with error: ${error.message}`);
  });
  
  logger.info('Proxy queue processor initialized');
  return worker;
};

// Add a request to the queue
export const queueProxyRequest = async (
  requestId: string,
  applicationId: string,
  credentialId: string,
  operation: string,
  parameters: Record<string, any>
) => {
  try {
    // Create an audit event for this request
    await prisma.auditEvent.create({
      data: {
        id: requestId,
        type: 'proxy_request',
        details: {
          operation,
          parameters,
          timestamp: new Date().toISOString()
        },
        applicationId,
        credentialId,
        requestStatus: 'PENDING',
        requestData: JSON.stringify({
          operation,
          parameters
        }),
        createdAt: new Date()
      }
    });

    await proxyQueue.add(
      'proxy-request',
      {
        requestId,
        applicationId,
        credentialId,
        operation,
        parameters,
      },
      {
        jobId: requestId,
        attempts: config.queue.attempts,
        backoff: config.queue.backoff,
      }
    );
    
    logger.info(`Added request ${requestId} to proxy queue`);
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to queue request ${requestId}: ${errorMessage}`);
    throw new ServerError(`Failed to queue request: ${errorMessage}`);
  }
}; 