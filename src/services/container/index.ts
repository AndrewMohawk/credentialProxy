import { ServiceContainer } from './ServiceContainer';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { Queue, Worker } from 'bullmq';
import { logger } from '../../utils/logger';
import { config } from '../../config';

// Create the singleton container instance
export const container = new ServiceContainer();

// Register database service
container.registerFactory('db', () => {
  logger.info('Initializing PrismaClient');
  const prisma = new PrismaClient({
    log: config.app.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
  return prisma;
});

// Register Redis client
container.registerFactory('redis', () => {
  logger.info('Initializing Redis client');
  return createClient({
    url: `redis://${config.redis.host}:${config.redis.port}`,
    password: config.redis.password || undefined,
  });
});

// Register BullMQ queue
container.registerFactory('proxyQueue', () => {
  logger.info('Initializing proxy queue');
  return new Queue('proxy-requests', {
    connection: config.redis.connection,
  });
});

// Export the type so services can be easily typed
export type Container = ServiceContainer;

// Export a function to get a service with the correct type
export function getService<T>(name: string): T {
  return container.get<T>(name);
} 