import axios from 'axios';
import { getPluginManager } from '../plugins';
import { logger } from '../utils/logger';

/**
 * Example of using the cookie plugin to add cookies to a request
 */
async function cookieExample() {
  try {
    // Get the plugin manager
    const pluginManager = getPluginManager();
    
    // Get the cookie plugin
    const cookiePlugin = pluginManager.getPlugin('cookie-plugin');
    
    if (!cookiePlugin) {
      logger.error('Cookie plugin not found');
      return;
    }
    
    // Example cookie data
    const cookieData = {
      cookies: [
        {
          name: 'session',
          value: 'abc123',
          domain: 'example.com',
          path: '/',
          secure: true,
          httpOnly: true
        },
        {
          name: 'preferences',
          value: 'theme=dark',
          domain: 'example.com',
          path: '/'
        }
      ]
    };
    
    // Validate the cookie data
    const validationResult = await cookiePlugin.validateCredential(cookieData);
    
    if (validationResult) {
      logger.error(`Cookie validation failed: ${validationResult}`);
      return;
    }
    
    logger.info('Cookie data is valid');
    
    // Example request parameters
    const requestParams = {
      headers: {
        'User-Agent': 'Credential Proxy Example'
      },
      domain: 'example.com',
      path: '/'
    };
    
    // Execute the operation to add cookies to the request
    const result = await pluginManager.executeOperation(
      'cookie-plugin',
      'add_cookies_to_request',
      cookieData,
      requestParams
    );
    
    if (!result.success) {
      logger.error(`Operation failed: ${result.error}`);
      return;
    }
    
    logger.info('Cookies added to request headers:', result.data.headers);
    
    // Make a request with the cookies
    try {
      // This is just an example - in a real scenario, you would use the actual URL
      // const response = await axios.get('https://example.com', {
      //   headers: result.data.headers
      // });
      
      // For demonstration, we'll just log the headers
      logger.info('Request would be made with headers:', result.data.headers);
    } catch (error: any) {
      logger.error(`Request failed: ${error.message}`);
    }
  } catch (error: any) {
    logger.error(`Error in cookie example: ${error.message}`);
  }
}

// Run the example
cookieExample().catch(error => {
  logger.error(`Unhandled error in cookie example: ${error.message}`);
}); 