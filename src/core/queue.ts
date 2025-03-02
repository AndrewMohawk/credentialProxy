import { Queue, Worker, QueueEvents } from 'bullmq';
import { createClient } from 'redis';
import { logger } from '../utils/logger';

// Redis connection options
const redisOptions = {
  url: process.env.REDIS_URL || 'redis://localhost:6380',
};

// Create Redis client for direct use
export const createRedisClient = () => {
  const client = createClient({
    url: redisOptions.url,
  });
  client.on('error', (err) => logger.error('Redis Client Error', err));
  return client;
};

// Singleton Redis client for application-wide use
export const redis = createRedisClient();

// Queue definitions
export const requestQueue = new Queue('requestProcessing', { connection: redisOptions });
export const notificationQueue = new Queue('notifications', { connection: redisOptions });

// Process request queue
const requestWorker = new Worker('requestProcessing', async (job) => {
  logger.info(`Processing request job ${job.id}`);
  try {
    // TODO: Implement request processing logic based on job.data
    return { success: true };
  } catch (error) {
    logger.error(`Error processing request job ${job.id}: ${error}`);
    throw error;
  }
}, { connection: redisOptions });

// Process notification queue
const notificationWorker = new Worker('notifications', async (job) => {
  logger.info(`Processing notification job ${job.id}`);
  try {
    // TODO: Implement notification logic based on job.data
    return { success: true };
  } catch (error) {
    logger.error(`Error processing notification job ${job.id}: ${error}`);
    throw error;
  }
}, { connection: redisOptions });

// Set up queue event handlers
requestWorker.on('completed', job => {
  logger.info(`Request job ${job.id} completed`);
});

requestWorker.on('failed', (job, err) => {
  logger.error(`Request job ${job?.id} failed: ${err}`);
});

notificationWorker.on('completed', job => {
  logger.info(`Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
  logger.error(`Notification job ${job?.id} failed: ${err}`);
});

export const setupQueues = async (): Promise<void> => {
  logger.info('Setting up job queues');
  
  try {
    // Connect the Redis client
    await redis.connect();
    logger.info('Redis client connected successfully');
  } catch (error) {
    logger.error(`Error connecting to Redis: ${error}`);
  }
};

// Graceful shutdown
export const closeQueues = async (): Promise<void> => {
  logger.info('Closing job queues');
  
  try {
    await requestWorker.close();
    await notificationWorker.close();
    await requestQueue.close();
    await notificationQueue.close();
    await redis.disconnect();
  } catch (error) {
    logger.error(`Error closing queues: ${error}`);
  }
}; 