import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Define the extended client type that includes Plugin
declare global {
  var prisma: PrismaClient | undefined;
}

// Create a singleton instance of PrismaClient
const prisma = global.prisma || new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Re-export types from Prisma
export * from '@prisma/client';

// Define Prisma event types
interface PrismaQueryEvent {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
}

interface PrismaErrorEvent {
  message: string;
  target: string;
}

// Log queries in development
if (process.env.NODE_ENV !== 'production') {
  // @ts-ignore - Prisma events are not properly typed
  prisma.$on('query', (e: PrismaQueryEvent) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}

// @ts-ignore - Prisma events are not properly typed
prisma.$on('error', (e: PrismaErrorEvent) => {
  logger.error(`Prisma Error: ${e.message}`);
});

// Add to global in development to prevent multiple instances during hot reloading
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export { prisma }; 