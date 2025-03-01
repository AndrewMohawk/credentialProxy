import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from '../../utils/logger';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

/**
 * Generate a JWT token for a user
 */
function generateToken(user: { id: string; username: string }) {
  // @ts-ignore - Ignoring type issues with jwt.sign
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
}

/**
 * Register a new user
 */
export async function registerUser(req: Request, res: Response) {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword
      }
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token
    });
  } catch (error: any) {
    logger.error(`Error registering user: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}

/**
 * Login a user
 */
export async function login(req: Request, res: Response) {
  const { username, password } = req.body;

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    if (!user.passwordHash) {
      return res.status(400).json({
        success: false,
        error: 'Account requires passkey authentication'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token
    });
  } catch (error: any) {
    logger.error(`Error logging in: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}

// Passkey authentication stubs
export async function getPasskeyRegistrationOptions(req: Request, res: Response) {
  res.status(200).json({
    success: true,
    message: 'Passkey registration options stub'
  });
}

export async function verifyPasskeyRegistration(req: Request, res: Response) {
  res.status(200).json({
    success: true,
    message: 'Passkey registration verification stub'
  });
}

export async function getPasskeyAuthOptions(req: Request, res: Response) {
  res.status(200).json({
    success: true,
    message: 'Passkey authentication options stub'
  });
}

export async function verifyPasskeyAuth(req: Request, res: Response) {
  res.status(200).json({
    success: true,
    message: 'Passkey authentication verification stub'
  });
} 