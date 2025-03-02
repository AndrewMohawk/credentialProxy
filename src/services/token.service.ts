import { createClient } from 'redis';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// Redis client for token blocklist
const redisClient = createClient({
  url: `redis://${config.redis.host}:${config.redis.port}`,
  password: config.redis.password || undefined,
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    logger.info('Redis client connected for token service');
  } catch (error: any) {
    logger.error(`Error connecting to Redis for token service: ${error.message}`);
  }
})();

// Token blocklist prefix
const TOKEN_BLOCKLIST_PREFIX = 'token:blocklist:';

/**
 * Add a token to the blocklist
 * @param token JWT token to blocklist
 * @param userId User ID (for logging)
 * @returns Promise<void>
 */
export async function blocklistToken(token: string, userId: string): Promise<void> {
  try {
    // Decode token to get expiration time
    const decoded = jwt.decode(token) as { exp?: number };
    if (!decoded || !decoded.exp) {
      logger.error(`Invalid token provided for blocklisting, user: ${userId}`);
      return;
    }

    // Calculate expiration time in seconds from now
    const now = Math.floor(Date.now() / 1000);
    const expiry = decoded.exp - now;
    
    // If token is already expired, no need to blocklist
    if (expiry <= 0) {
      logger.debug(`Token for user ${userId} is already expired, not blocklisting`);
      return;
    }

    // Add to blocklist with expiry
    const tokenHash = hashToken(token);
    await redisClient.set(`${TOKEN_BLOCKLIST_PREFIX}${tokenHash}`, userId, { EX: expiry });
    logger.debug(`Token for user ${userId} blocklisted for ${expiry} seconds`);
  } catch (error: any) {
    logger.error(`Error blocklisting token: ${error.message}`);
    throw error;
  }
}

/**
 * Check if a token is blocklisted
 * @param token JWT token to check
 * @returns true if token is blocklisted, false otherwise
 */
export async function isTokenBlocklisted(token: string): Promise<boolean> {
  try {
    const tokenHash = hashToken(token);
    const result = await redisClient.get(`${TOKEN_BLOCKLIST_PREFIX}${tokenHash}`);
    return !!result;
  } catch (error: any) {
    logger.error(`Error checking token blocklist: ${error.message}`);
    // In case of error, assume token is not blocklisted to prevent lockout
    return false;
  }
}

/**
 * Create a hash of the token for storage
 * @param token JWT token
 * @returns hashed token
 */
function hashToken(token: string): string {
  // For simplicity, we'll just use the last 32 chars of the token as a unique identifier
  // In production, you might want to use a proper hashing function
  return token.slice(-32);
}

/**
 * Redis automatically handles expiration of blocklisted tokens based on their JWT expiry time.
 * When a token is added to the blocklist, we set its Redis expiration (EX) to match the remaining
 * time until the JWT token expires. This ensures that tokens are automatically removed from
 * the blocklist when they expire, preventing the blocklist from growing indefinitely.
 * 
 * No manual cleanup is needed as Redis handles this automatically.
 */ 