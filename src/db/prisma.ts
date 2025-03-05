import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Define the extended client type that includes Plugin
declare global {
  // eslint-disable-next-line no-var
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
  // @ts-expect-error - Prisma event system uses internal types not exposed in public API
  prisma.$on('query', (e: PrismaQueryEvent) => {
    logger.debug(`Query: ${e.query} (${e.duration}ms)`);
  });
}

// @ts-expect-error - Prisma event system uses internal types not exposed in public API
prisma.$on('error', (e: PrismaErrorEvent) => {
  logger.error(`Prisma Error: ${e.message}`);
});

// Add to global in development to prevent multiple instances during hot reloading
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export { prisma }; 