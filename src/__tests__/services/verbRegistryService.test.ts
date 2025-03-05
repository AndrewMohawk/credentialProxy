import verbRegistryService, { 
  Verb, 
  VerbScope, 
  registerVerb, 
  unregisterVerb, 
  getVerbs, 
  getVerbById,
  registerPluginVerbs,
  registerCredentialVerbs,
  initVerbRegistry
} from '../../services/verbRegistryService';

describe('Verb Registry Service', () => {
  // Clear the registry before each test
  beforeEach(async () => {
    // Get all verbs and unregister them
    const verbs = getVerbs();
    verbs.forEach(verb => unregisterVerb(verb.id));
  });
  
  describe('initVerbRegistry', () => {
    it('should initialize the registry with default verbs', async () => {
      await initVerbRegistry();
      const verbs = getVerbs();
      expect(verbs.length).toBeGreaterThan(0);
      
      // Check for expected default verbs
      const accessVerb = getVerbById('access_application');
      expect(accessVerb).toBeDefined();
      expect(accessVerb?.scope).toBe(VerbScope.GLOBAL);
      
      const readVerb = getVerbById('read_credential');
      expect(readVerb).toBeDefined();
      expect(readVerb?.scope).toBe(VerbScope.CREDENTIAL);
    });
  });
  
  describe('registerVerb', () => {
    it('should register a new verb', () => {
      const verb: Verb = {
        id: 'test_verb',
        name: 'Test Verb',
        description: 'A test verb',
        scope: VerbScope.GLOBAL,
        operation: 'test',
        isDefault: false
      };
      
      const result = registerVerb(verb);
      expect(result).toEqual(verb);
      
      const retrievedVerb = getVerbById('test_verb');
      expect(retrievedVerb).toEqual(verb);
    });
    
    it('should update an existing verb', () => {
      // Register initial verb
      const verb: Verb = {
        id: 'test_verb',
        name: 'Test Verb',
        description: 'A test verb',
        scope: VerbScope.GLOBAL,
        operation: 'test',
        isDefault: false
      };
      
      registerVerb(verb);
      
      // Update the verb
      const updatedVerb: Verb = {
        ...verb,
        name: 'Updated Test Verb',
        description: 'An updated test verb'
      };
      
      const result = registerVerb(updatedVerb);
      expect(result.name).toBe('Updated Test Verb');
      expect(result.description).toBe('An updated test verb');
      
      // Verify the update
      const retrievedVerb = getVerbById('test_verb');
      expect(retrievedVerb?.name).toBe('Updated Test Verb');
    });
  });
  
  describe('unregisterVerb', () => {
    it('should unregister a verb', () => {
      // Register a verb
      const verb: Verb = {
        id: 'test_verb',
        name: 'Test Verb',
        description: 'A test verb',
        scope: VerbScope.GLOBAL,
        operation: 'test',
        isDefault: false
      };
      
      registerVerb(verb);
      
      // Verify it exists
      expect(getVerbById('test_verb')).toBeDefined();
      
      // Unregister it
      const result = unregisterVerb('test_verb');
      expect(result).toBe(true);
      
      // Verify it's gone
      expect(getVerbById('test_verb')).toBeUndefined();
    });
    
    it('should return false when unregistering a non-existent verb', () => {
      const result = unregisterVerb('non_existent_verb');
      expect(result).toBe(false);
    });
  });
  
  describe('getVerbs', () => {
    beforeEach(() => {
      // Register some test verbs
      registerVerb({
        id: 'global_verb',
        name: 'Global Verb',
        description: 'A global verb',
        scope: VerbScope.GLOBAL,
        operation: 'global',
        tags: ['test', 'global']
      });
      
      registerVerb({
        id: 'plugin_verb',
        name: 'Plugin Verb',
        description: 'A plugin verb',
        scope: VerbScope.PLUGIN,
        operation: 'plugin',
        pluginType: 'test-plugin',
        tags: ['test', 'plugin']
      });
      
      registerVerb({
        id: 'credential_verb',
        name: 'Credential Verb',
        description: 'A credential verb',
        scope: VerbScope.CREDENTIAL,
        operation: 'credential',
        credentialType: 'test-credential',
        tags: ['test', 'credential']
      });
    });
    
    it('should return all verbs when no filters are provided', () => {
      const verbs = getVerbs();
      expect(verbs.length).toBe(3);
    });
    
    it('should filter verbs by scope', () => {
      const globalVerbs = getVerbs({ scope: VerbScope.GLOBAL });
      expect(globalVerbs.length).toBe(1);
      expect(globalVerbs[0].id).toBe('global_verb');
      
      const pluginVerbs = getVerbs({ scope: VerbScope.PLUGIN });
      expect(pluginVerbs.length).toBe(1);
      expect(pluginVerbs[0].id).toBe('plugin_verb');
      
      const credentialVerbs = getVerbs({ scope: VerbScope.CREDENTIAL });
      expect(credentialVerbs.length).toBe(1);
      expect(credentialVerbs[0].id).toBe('credential_verb');
    });
    
    it('should filter verbs by plugin type', () => {
      const verbs = getVerbs({ pluginType: 'test-plugin' });
      expect(verbs.length).toBe(1);
      expect(verbs[0].id).toBe('plugin_verb');
    });
    
    it('should filter verbs by credential type', () => {
      const verbs = getVerbs({ credentialType: 'test-credential' });
      expect(verbs.length).toBe(1);
      expect(verbs[0].id).toBe('credential_verb');
    });
    
    it('should filter verbs by search term', () => {
      const verbs = getVerbs({ search: 'global' });
      expect(verbs.length).toBe(1);
      expect(verbs[0].id).toBe('global_verb');
    });
    
    it('should filter verbs by tags', () => {
      const verbs = getVerbs({ tags: ['global'] });
      expect(verbs.length).toBe(1);
      expect(verbs[0].id).toBe('global_verb');
      
      const testVerbs = getVerbs({ tags: ['test'] });
      expect(testVerbs.length).toBe(3);
    });
    
    it('should combine multiple filters', () => {
      const verbs = getVerbs({
        scope: VerbScope.PLUGIN,
        tags: ['test']
      });
      
      expect(verbs.length).toBe(1);
      expect(verbs[0].id).toBe('plugin_verb');
    });
  });
  
  describe('registerPluginVerbs', () => {
    it('should register multiple plugin verbs', () => {
      const pluginType = 'test-plugin';
      const verbs = [
        {
          id: 'plugin_verb_1',
          name: 'Plugin Verb 1',
          description: 'A plugin verb',
          operation: 'plugin1'
        },
        {
          id: 'plugin_verb_2',
          name: 'Plugin Verb 2',
          description: 'Another plugin verb',
          operation: 'plugin2'
        }
      ];
      
      const result = registerPluginVerbs(pluginType, verbs);
      expect(result.length).toBe(2);
      
      // Verify the verbs were registered with the correct scope and plugin type
      const registeredVerbs = getVerbs({ pluginType });
      expect(registeredVerbs.length).toBe(2);
      
      registeredVerbs.forEach(verb => {
        expect(verb.scope).toBe(VerbScope.PLUGIN);
        expect(verb.pluginType).toBe(pluginType);
      });
    });
  });
  
  describe('registerCredentialVerbs', () => {
    it('should register multiple credential verbs', () => {
      const credentialType = 'test-credential';
      const verbs = [
        {
          id: 'credential_verb_1',
          name: 'Credential Verb 1',
          description: 'A credential verb',
          operation: 'credential1'
        },
        {
          id: 'credential_verb_2',
          name: 'Credential Verb 2',
          description: 'Another credential verb',
          operation: 'credential2'
        }
      ];
      
      const result = registerCredentialVerbs(credentialType, verbs);
      expect(result.length).toBe(2);
      
      // Verify the verbs were registered with the correct scope and credential type
      const registeredVerbs = getVerbs({ credentialType });
      expect(registeredVerbs.length).toBe(2);
      
      registeredVerbs.forEach(verb => {
        expect(verb.scope).toBe(VerbScope.CREDENTIAL);
        expect(verb.credentialType).toBe(credentialType);
      });
    });
  });
}); 