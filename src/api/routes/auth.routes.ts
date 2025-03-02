import express from 'express';
import {
  registerUser,
  login,
  logout,
  getPasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  getPasskeyAuthOptions,
  verifyPasskeyAuth
} from '../controllers/auth.controller';
import { authenticateJWT } from '../../middleware/auth';
import { validateRegistration, validateLogin } from '../validators/auth.validators';

const router = express.Router();

// Create a middleware wrapper for authenticateJWT
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  authenticateJWT(req, res, next);
};

// Public routes
router.post('/register', validateRegistration, registerUser);
router.post('/login', validateLogin, login);
router.post('/passkey-auth-options', getPasskeyAuthOptions);
router.post('/passkey-auth-verify', verifyPasskeyAuth);

// Protected routes - require authentication
router.use(authMiddleware);
router.post('/logout', logout);
router.get('/passkey-registration-options', getPasskeyRegistrationOptions);
router.post('/passkey-registration-verify', verifyPasskeyRegistration);

export const authRoutes = router; 