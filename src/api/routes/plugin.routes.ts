import { Router } from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { 
  getAllPlugins, 
  getPluginById, 
  getEnabledPlugins,
  enablePlugin,
  disablePlugin,
  getMockPlugins,
  getPluginTypes
} from '../controllers/plugin.controller';

const router = Router();

// All plugin routes require authentication
router.use(authenticateJWT);

// Get all plugins
router.get('/', getAllPlugins);

// Get mock plugins (for development)
router.get('/mock', getMockPlugins);

// Get all enabled plugins
router.get('/enabled', getEnabledPlugins);

// Get available plugin types
router.get('/types', getPluginTypes);

// Get specific plugin by ID
router.get('/:id', getPluginById);

// Enable a plugin
router.post('/:id/enable', enablePlugin);

// Disable a plugin
router.post('/:id/disable', disablePlugin);

export default router; 