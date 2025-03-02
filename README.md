# Credential Proxy

A secure credential management system that allows third-party applications to perform operations using credentials without ever seeing the actual credentials.

## Overview

The Credential Proxy acts as a secure intermediary between third-party applications and various APIs or services. It securely stores and manages credentials (API keys, OAuth tokens, Ethereum private keys, etc.) and allows authorized applications to perform operations using these credentials without ever having direct access to them.

Key features:
- Secure credential storage with encryption at rest
- Policy-based access control for fine-grained permissions
- Request signing for secure third-party application authentication
- Comprehensive audit logging of all credential usage
- Support for various credential types (API keys, OAuth tokens, Ethereum keys, etc.)
- Queue-based asynchronous processing for reliability
- Self-registration for third-party applications
- Credential revocation capabilities for applications

## Architecture

The Credential Proxy is built with the following components:

- **API Layer**: Express.js REST API for third-party applications and admin interface
- **Policy Engine**: Evaluates access requests against defined policies
- **Credential Manager**: Securely stores and retrieves encrypted credentials
- **Queue System**: BullMQ with Redis for reliable asynchronous processing
- **Database**: PostgreSQL with Prisma ORM for data storage
- **Monitoring**: Prometheus and Grafana for metrics and monitoring

## Application Registration

Third-party applications can be registered in two ways:

### 1. Admin Registration

Administrators can register applications through the admin interface or API. This is the default method and provides immediate access to the system.

### 2. Self-Registration

Applications can self-register through the API if this feature is enabled. Self-registration can be configured to:

- Require admin approval before activation (default)
- Automatically activate applications upon registration

To enable self-registration, set the following environment variables:

```
ALLOW_AUTO_REGISTRATION=true
AUTO_REGISTRATION_DEFAULT_STATUS=pending  # or 'active' to skip approval
```

#### Self-Registration Process

1. The application makes a POST request to `/api/v1/applications/register-self` with:
   ```json
   {
     "name": "My Application",
     "publicKey": "-----BEGIN PUBLIC KEY-----\n...",
     "description": "Application description",
     "callbackUrl": "https://myapp.example.com/callback"
   }
   ```

2. The Credential Proxy returns:
   ```json
   {
     "success": true,
     "data": {
       "id": "app_123456789",
       "name": "My Application",
       "publicKey": "-----BEGIN PUBLIC KEY-----\n...",
       "status": "PENDING",
       "secret": "abcdef123456789" 
     },
     "message": "Application registered successfully and is pending approval"
   }
   ```

3. The application must securely store the returned `secret`, as it will only be provided once and is required for credential revocation.

4. If approval is required, an administrator must approve the application through the admin interface or API before it can be used.

### Credential Revocation

Applications can revoke their access to specific credentials if they no longer need them or suspect a security issue:

```javascript
axios.post('https://credential-proxy.example.com/api/v1/applications/revoke-credential', {
  applicationId: 'app_123456789',
  credentialId: 'cred_987654321',
  secret: 'abcdef123456789',
  reason: 'No longer needed'
})
.then(response => {
  console.log('Credential revoked successfully');
})
.catch(error => {
  console.error('Error:', error.response?.data || error.message);
});
```

### Application Self-Revocation

If an application suspects it has been compromised, it can completely revoke its own access:

```javascript
axios.post('https://credential-proxy.example.com/api/v1/applications/revoke-self', {
  applicationId: 'app_123456789',
  secret: 'abcdef123456789',
  reason: 'Application compromised'
})
.then(response => {
  console.log('Application revoked successfully');
})
.catch(error => {
  console.error('Error:', error.response?.data || error.message);
});
```

## Example Usage

Here's how a third-party application would use the Credential Proxy:

1. The application is registered in the Credential Proxy system and receives an application ID and key pair.
2. The application wants to make an API request using a credential stored in the Credential Proxy.
3. The application creates a signed request to the Credential Proxy:

```javascript
// Example of creating a signed request
const crypto = require('crypto');
const axios = require('axios');

// Application credentials (stored securely)
const applicationId = 'app_123456789';
const privateKey = '-----BEGIN PRIVATE KEY-----\n...'; // Your private key

// Request details
const credentialId = 'cred_987654321';
const operation = 'GET';
const parameters = {
  url: 'https://api.example.com/data',
  headers: {
    'Accept': 'application/json'
  }
};
const timestamp = Date.now();

// Create the message to sign
const message = JSON.stringify({
  applicationId,
  credentialId,
  operation,
  parameters,
  timestamp
});

// Sign the message
const sign = crypto.createSign('SHA256');
sign.update(message);
const signature = sign.sign(privateKey, 'base64');

// Send the request to the Credential Proxy
axios.post('https://credential-proxy.example.com/api/v1/proxy', {
  applicationId,
  credentialId,
  operation,
  parameters,
  timestamp,
  signature
})
.then(response => {
  // Handle the response
  if (response.data.status === 'PROCESSING') {
    // Request is being processed asynchronously
    const requestId = response.data.requestId;
    
    // Check the status later
    checkRequestStatus(requestId);
  } else if (response.data.status === 'PENDING') {
    // Request requires manual approval
    console.log('Request is pending approval');
  } else if (response.data.status === 'DENIED') {
    // Request was denied by policy
    console.log('Request denied:', response.data.message);
  }
})
.catch(error => {
  console.error('Error:', error.response?.data || error.message);
});

// Function to check request status
function checkRequestStatus(requestId) {
  axios.get(`https://credential-proxy.example.com/api/v1/proxy/status/${requestId}`)
    .then(response => {
      if (response.data.status === 'COMPLETED') {
        // Request completed successfully
        console.log('Response:', response.data.response);
      } else if (response.data.status === 'FAILED') {
        // Request failed
        console.error('Request failed:', response.data.response.error);
      } else {
        // Request still processing
        console.log('Request still processing...');
        // Check again later
        setTimeout(() => checkRequestStatus(requestId), 5000);
      }
    })
    .catch(error => {
      console.error('Error checking status:', error.response?.data || error.message);
    });
}
```

4. The Credential Proxy verifies the signature, evaluates policies, and if approved, performs the operation using the stored credential.
5. The third-party application receives the result without ever seeing the actual credential.

## Setup and Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/credential-proxy.git
   cd credential-proxy
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Run database migrations:
   ```
   npx prisma migrate dev
   ```

5. Start the application:
   ```
   npm run dev
   ```

### Docker Setup

You can also run the application using Docker:

```
docker-compose up -d
```

This will start the following services:
- Credential Proxy API
- PostgreSQL database
- Redis
- Prometheus
- Grafana

## Development

### Project Structure

```
credential-proxy/
├── prisma/              # Database schema and migrations
├── src/
│   ├── api/             # API routes and controllers
│   │   ├── credentials/ # Credential management
│   │   ├── policies/    # Policy engine
│   │   ├── db/          # Database connection
│   │   ├── middleware/  # Express middleware
│   │   ├── services/    # Services (queue, etc.)
│   │   ├── utils/       # Utility functions
│   │   └── server.ts    # Main application entry point
│   ├── tests/           # Test files
│   └── docker-compose.yml # Docker configuration
```

### Running Tests

```
npm test
```

## API Documentation

The Credential Proxy provides interactive API documentation using Swagger UI. After starting the application, you can access the documentation at:

```
http://localhost:<PORT>/api-docs
```

The API documentation includes:

- Authentication endpoints
- Credential management
- Application management
- Policy management 
- Proxy request endpoints
- Admin endpoints

You can:
- Explore available endpoints
- See request/response schemas
- Test API endpoints directly from the UI
- View required parameters and authentication methods

In production environments, Swagger UI can be disabled by setting the `DISABLE_SWAGGER_IN_PRODUCTION` environment variable to `true`.

## Security

The Credential Proxy implements several security measures:

- All credentials are encrypted at rest using AES-256-GCM
- All requests from third-party applications must be signed using their private key
- Requests include a timestamp to prevent replay attacks
- Comprehensive policy engine for fine-grained access control
- Audit logging of all credential access attempts

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Plugin System

The Credential Proxy uses a plugin system for credential types, which allows for easy extension with new credential types and operations. Each plugin defines:

- The credential schema (required fields)
- Supported operations
- Compatible policy types
- Validation logic
- Operation execution logic

### Available Plugins

The system comes with these built-in plugins:

1. **API Key** (`api-key`): For API key authentication
2. **OAuth** (`oauth`): For OAuth 1.0 and 2.0 flows
3. **Ethereum** (`ethereum`): For Ethereum private key operations
4. **Database** (`database`): For database credential operations

### Creating Custom Plugins

You can create custom plugins by following these steps:

1. Create a new directory under `src/plugins/credentials/{plugin-id}`
2. Create an `index.ts` file that exports a class extending `BaseCredentialPlugin`
3. Implement the required methods and properties

Here's a minimal example:

```typescript
import { BaseCredentialPlugin } from '../../BaseCredentialPlugin';
import { OperationMetadata, PolicyConfig } from '../../CredentialPlugin';
import { PolicyType } from '../../../core/policies/policyEngine';

export default class MyCustomPlugin extends BaseCredentialPlugin {
  id = 'my-custom-plugin';
  name = 'My Custom Plugin';
  description = 'A custom credential plugin';
  version = '1.0.0';
  
  // Define credential schema
  credentialSchema = {
    apiKey: {
      type: 'string',
      required: true,
      description: 'API key',
    },
    // Add more fields as needed
  };
  
  // Define supported operations
  supportedOperations: OperationMetadata[] = [
    {
      name: 'OPERATION_NAME',
      description: 'Description of the operation',
      requiredParams: ['param1'],
      optionalParams: ['param2'],
    },
  ];
  
  // Define supported policies
  supportedPolicies: PolicyConfig[] = [
    {
      type: PolicyType.ALLOW_LIST,
      description: 'Allow specific operations',
    },
    // Add more policies as needed
  ];
  
  // Implement operation execution
  async executeOperation(
    operation: string,
    credentialData: Record<string, any>,
    parameters: Record<string, any>
  ): Promise<any> {
    // Validate parameters
    const paramValidation = this.validateOperationParameters(operation, parameters);
    if (paramValidation) {
      throw new Error(paramValidation);
    }
    
    // Execute the operation
    switch (operation) {
      case 'OPERATION_NAME':
        // Implement your operation logic
        return { result: 'Success' };
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }
}
```

The plugin system automatically discovers and loads all plugins in the `src/plugins/credentials` directory.

### Plugin API

The Credential Proxy exposes a REST API for plugin discovery:

- `GET /api/v1/admin/plugins`: List all available plugins
- `GET /api/v1/admin/plugins/:id`: Get details for a specific plugin

These endpoints require authentication and are intended for admin use.