import { setupSwagger } from './swagger-ui';
import swaggerDefinition from './swagger';

// Import documentation files (these files only contain JSDoc comments)
import './proxy.docs';
import './auth.docs';
import './credentials.docs';
import './applications.docs';
import './policies.docs';
import './plugins.docs';

export {
  setupSwagger,
  swaggerDefinition
}; 