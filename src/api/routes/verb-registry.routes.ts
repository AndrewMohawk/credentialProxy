/**
 * Verb Registry Routes
 * 
 * API routes for the verb registry service that manages available verbs
 * for policies in the system.
 */

import express, { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import verbRegistryService, { Verb, VerbScope } from '../../services/verbRegistryService';
import { getVerbsForCredential } from '../../services/credentialVerbDiscovery';
import { getVerbsForPlugin } from '../../services/pluginVerbDiscovery';
import { authenticateJWT } from '../../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * GET /api/verb-registry
 * Retrieve all registered verbs
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const verbs = verbRegistryService.getVerbs();
    return res.json(verbs);
  } catch (error) {
    logger.error(`Error getting all verbs: ${error}`);
    return res.status(500).json({ error: 'Failed to get verbs' });
  }
});

/**
 * GET /api/verb-registry/global
 * Retrieve all global verbs
 */
router.get('/global', async (req: Request, res: Response) => {
  try {
    const verbs = verbRegistryService.getVerbs({ scope: VerbScope.GLOBAL });
    return res.json(verbs);
  } catch (error) {
    logger.error(`Error getting global verbs: ${error}`);
    return res.status(500).json({ error: 'Failed to get global verbs' });
  }
});

/**
 * GET /api/verb-registry/credential/:credentialId
 * Retrieve verbs specific to a credential
 */
router.get('/credential/:credentialId', async (req: Request, res: Response) => {
  try {
    const { credentialId } = req.params;
    
    if (!credentialId) {
      return res.status(400).json({ error: 'Credential ID is required' });
    }
    
    const verbs = await getVerbsForCredential(credentialId);
    return res.json(verbs);
  } catch (error) {
    logger.error(`Error getting verbs for credential: ${error}`);
    return res.status(500).json({ error: 'Failed to get verbs for credential' });
  }
});

/**
 * GET /api/verb-registry/plugin/:pluginId
 * Retrieve verbs specific to a plugin
 */
router.get('/plugin/:pluginId', async (req: Request, res: Response) => {
  try {
    const { pluginId } = req.params;
    
    if (!pluginId) {
      return res.status(400).json({ error: 'Plugin ID is required' });
    }
    
    const verbs = await getVerbsForPlugin(pluginId);
    return res.json(verbs);
  } catch (error) {
    logger.error(`Error getting verbs for plugin: ${error}`);
    return res.status(500).json({ error: 'Failed to get verbs for plugin' });
  }
});

/**
 * POST /api/verb-registry
 * Register a new verb
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const verb = req.body as Verb;
    
    if (!verb || !verb.id || !verb.name || !verb.operation) {
      return res.status(400).json({ error: 'Invalid verb data' });
    }
    
    const result = verbRegistryService.registerVerb(verb);
    return res.status(201).json(result);
  } catch (error) {
    logger.error(`Error registering verb: ${error}`);
    return res.status(500).json({ error: 'Failed to register verb' });
  }
});

/**
 * DELETE /api/verb-registry/:verbId
 * Unregister a verb
 */
router.delete('/:verbId', async (req: Request, res: Response) => {
  try {
    const { verbId } = req.params;
    
    if (!verbId) {
      return res.status(400).json({ error: 'Verb ID is required' });
    }
    
    const success = verbRegistryService.unregisterVerb(verbId);
    
    if (!success) {
      return res.status(404).json({ error: 'Verb not found' });
    }
    
    return res.status(204).send();
  } catch (error) {
    logger.error(`Error unregistering verb: ${error}`);
    return res.status(500).json({ error: 'Failed to unregister verb' });
  }
});

export const verbRegistryRoutes = router; 