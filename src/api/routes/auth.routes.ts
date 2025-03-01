import express from 'express';
import {
  registerUser,
  login,
  getPasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  getPasskeyAuthOptions,
  verifyPasskeyAuth
} from '../controllers/auth.controller';
import { authMiddleware } from '../../middleware/auth';
import { validateRegistration, validateLogin } from '../validators/auth.validators';

const router = express.Router();

// Public routes
router.post('/register', validateRegistration, registerUser);
router.post('/login', validateLogin, login);
router.post('/passkey-auth-options', getPasskeyAuthOptions);
router.post('/passkey-auth-verify', verifyPasskeyAuth);

// Protected routes - require authentication
router.use(authMiddleware);
router.get('/passkey-registration-options', getPasskeyRegistrationOptions);
router.post('/passkey-registration-verify', verifyPasskeyRegistration);

export const authRoutes = router; 