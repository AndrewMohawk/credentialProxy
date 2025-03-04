# Developer Documentation

This document provides detailed information for developers working on the Credential Proxy project.

## Project Architecture

The Credential Proxy follows a modular architecture organized by feature domains:

- **API Layer**: Express.js REST API for handling HTTP requests
- **Core Business Logic**: Domain-specific logic separated from delivery mechanisms
- **Database Layer**: Prisma ORM for data access
- **Frontend Layer**: Next.js application for the admin interface
- **Service Layer**: Background processing and integration with external systems

### Core Principles

- **Separation of Concerns**: Logic is separated by responsibility
- **Dependency Injection**: Services are composed rather than tightly coupled
- **Domain-Driven Design**: Code organization follows business domain concepts
- **Plugin Architecture**: Credential types are implemented as plugins

## Directory Structure

### Backend Structure

```
src/
├── api/               # API routes and controllers
├── app/               # Express app setup
├── config/            # Configuration management
├── core/              # Core business logic
│   ├── audit/         # Audit logging system
│   ├── auth/          # Authentication logic
│   ├── credentials/   # Credential management
│   ├── policies/      # Policy engine
│   └── applications/  # Application management
├── db/                # Database connection and utilities
├── docs/              # API documentation
├── middleware/        # Express middleware
├── monitoring/        # Metrics and monitoring
├── plugins/           # Credential plugins
│   └── credentials/   # Credential type implementations
├── services/          # Services (queue, etc.)
├── types/             # TypeScript types
├── utils/             # Utility functions
└── views/             # Server-side views
```

### Frontend Structure

```
frontend/
├── app/              # Next.js app directory
│   ├── api/          # API route handlers
│   ├── auth/         # Authentication pages
│   ├── dashboard/    # Dashboard pages
│   └── ... other routes
├── components/       # React components
│   ├── auth/         # Authentication components
│   ├── credentials/  # Credential management components
│   ├── layout/       # Layout components
│   ├── policies/     # Policy management components
│   └── ui/           # UI components
├── hooks/            # React hooks
├── lib/              # Utility functions
├── public/           # Static assets
└── styles/           # CSS styles
```

## Development Workflow

### Setting Up the Development Environment

1. Clone the repository
2. Install dependencies: `npm install` and `cd frontend && npm install && cd ..`
3. Set up environment variables: Copy `.env.example` to `.env` and update the values
4. Start the database and Redis: `npm run db:up`
5. Run database migrations: `npm run prisma:migrate`
6. Start development servers: `npm run dev`

### Development Scripts

We have several npm scripts to help with development:

- `npm run dev`: Starts both backend and frontend in development mode
- `npm run dev:backend`: Starts only the backend in development mode
- `npm run dev:frontend`: Starts only the frontend in development mode
- `npm run db:up`: Starts PostgreSQL and Redis in Docker containers
- `npm run db:down`: Stops the database containers
- `npm run prisma:generate`: Generates Prisma client
- `npm run prisma:migrate`: Runs database migrations
- `npm run prisma:studio`: Opens Prisma Studio for database management
- `npm run test`: Runs tests
- `npm run test:watch`: Runs tests in watch mode
- `npm run test:coverage`: Runs tests with coverage report

### Git Workflow

1. Create a feature branch from `main`: `git checkout -b feature/your-feature-name`
2. Make changes and commit them
3. Push to the remote branch: `git push origin feature/your-feature-name`
4. Create a pull request to merge into `main`
5. Address any review comments
6. Merge into `main` when approved

## Testing

The project uses Jest for testing. Test files are located in the `src/__tests__` directory, organized by feature domain.

### Test Structure

- Unit tests: Test individual functions and components
- Integration tests: Test the interaction between components
- API tests: Test API endpoints
- E2E tests: Test full user workflows

### Running Tests

- Run all tests: `npm test`
- Run tests in watch mode: `npm run test:watch`
- Run tests with coverage: `npm run test:coverage`

### Testing Guidelines

- Create unit tests for all business logic
- Use mocks for external dependencies
- Aim for high code coverage, especially for critical paths
- Test both happy path and error scenarios

## Policy System

The policy system is a core feature that controls what operations applications can perform with credentials.

### New Policy Types

The following policy types have been added:

1. **Rate Limiting** (`RATE_LIMITING`): Limits the frequency of requests within a time window.
2. **IP Restriction** (`IP_RESTRICTION`): Controls access based on IP addresses or CIDR ranges.
3. **Usage Threshold** (`USAGE_THRESHOLD`): Sets limits on various usage metrics like request count, API calls, or data transferred.
4. **Context-Aware** (`CONTEXT_AWARE`): Evaluates policies based on request context and conditions.
5. **Approval Chain** (`APPROVAL_CHAIN`): Implements multi-step approval workflows.

### Policy Templates

A new template system has been implemented to make policy creation easier and more consistent:

- Templates are predefined policy configurations that can be applied to credentials
- Templates are organized by category (Access Control, Usage Limits, etc.)
- Templates can be customized when applied
- Recommended templates are available for each credential type

#### Template Structure

Templates are defined in `src/core/policies/policyTemplates.ts` and include:

```typescript
interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  type: PolicyType;
  category: TemplateCategory;
  credentialTypes: string[];
  configTemplate: Record<string, any>;
  scope: PolicyScope;
  priority: number;
  isRecommended: boolean;
}
```

#### Template Service

The `PolicyTemplateService` provides methods for working with templates:

- `applyTemplate(templateId, credentialId, applicationId?, customization?)`: Applies a template to a credential
- `applyRecommendedTemplates(credentialId)`: Applies all recommended templates for a credential
- `hasAnyPolicies(credentialId)`: Checks if a credential has any policies
- `applyDefaultPolicies(credentialId)`: Applies default policies if none exist

### Policy Evaluator

The policy evaluator has been enhanced to support all policy types:

- Each policy type has a dedicated evaluation function
- Policies are evaluated in priority order
- Manual approval policies are checked first
- The evaluator returns detailed results including status and reason

#### Evaluation Process

1. Request is received and passed to the policy evaluator
2. Policies are sorted by priority
3. Manual approval policies are checked first
4. Each policy is evaluated based on its type
5. The first policy that denies access stops the evaluation
6. If all policies pass, the request is approved

### API Endpoints

New API endpoints have been added for working with policy templates:

- `GET /api/v1/policies/templates/all`: Get all available templates
- `GET /api/v1/policies/templates/type/:credentialType`: Get templates for a specific credential type
- `GET /api/v1/policies/templates/:id`: Get a specific template by ID
- `GET /api/v1/policies/templates/credential/:credentialId`: Get templates for a specific credential
- `POST /api/v1/policies/templates/credential/:credentialId/apply`: Apply a template to a credential
- `POST /api/v1/policies/templates/credential/:credentialId/apply-recommended`: Apply recommended templates

## Plugin System

The plugin system allows for easy extension with new credential types and operations.

### Creating a New Plugin

1. Create a directory for your plugin: `src/plugins/credentials/{plugin-id}`
2. Create an `index.ts` file that exports a class extending `BaseCredentialPlugin`
3. Implement the required methods and properties:
   - `id`: Unique identifier for the plugin
   - `name`: Display name for the plugin
   - `description`: Description of what the plugin does
   - `version`: Plugin version
   - `credentialSchema`: Schema for the credential data
   - `supportedOperations`: Operations the plugin supports
   - `supportedPolicies`: Policy types the plugin supports
   - `executeOperation`: Method to execute operations

### Plugin Interfaces

The plugin system is built on a set of interfaces defined in `src/plugins/CredentialPlugin.ts`:

```typescript
export interface CredentialPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  credentialSchema: Record<string, SchemaField>;
  supportedOperations: OperationMetadata[];
  supportedPolicies: PolicyConfig[];
  
  validateCredentialData(data: Record<string, any>): string | null;
  validateOperationParameters(operation: string, parameters: Record<string, any>): string | null;
  executeOperation(operation: string, credentialData: Record<string, any>, parameters: Record<string, any>): Promise<any>;
}
```

### Plugin Discovery

Plugins are automatically discovered and loaded at application startup:

1. The `PluginRegistry` scans the `src/plugins/credentials` directory
2. It loads each plugin and registers it in the registry
3. Plugins can be looked up by ID for credential operations

## Authentication System

The Credential Proxy supports multiple authentication methods:

### Traditional Authentication

- Username/password login with bcrypt password hashing
- JWT tokens for session management
- API key authentication for backend API access

### WebAuthn/Passkey Authentication

The system supports WebAuthn/passkey authentication for enhanced security:

1. **Registration**:
   - The server generates a challenge
   - The user's browser creates a new credential using their authenticator (TouchID, FaceID, etc.)
   - The public key is stored in the database

2. **Authentication**:
   - The server sends a challenge to the client
   - The user's browser uses their authenticator to sign the challenge
   - The server verifies the signature using the stored public key

### Implementation:

The WebAuthn authentication is implemented in the `src/core/auth/webAuthnService.ts` file:

```typescript
// Example methods
async generateRegistrationOptions(user: User): Promise<GenerateRegistrationOptionsOpts>
async verifyRegistration(credential: RegistrationCredentialJSON, userId: string): Promise<boolean>
async generateAuthenticationOptions(username: string): Promise<GenerateAuthenticationOptionsOpts>
async verifyAuthentication(credential: AuthenticationCredentialJSON, username: string): Promise<boolean>
```

## Usage Metrics Service

A new service has been added for tracking and retrieving usage metrics:

- `getUsageMetrics(credentialId, metricType, from, to)`: Get usage metrics for a credential
- `getRequestCount(credentialId, operations, from, to)`: Get request count for a credential
- `getApiCallCount(credentialId, from, to)`: Get API call count for a credential
- `getEthereumValue(credentialId, from, to)`: Get Ethereum value for a credential
- `getDataTransferred(credentialId, from, to)`: Get data transferred for a credential

## IP Utilities

New utilities have been added for IP address validation:

- `isIpInCidr(ip, cidr)`: Check if an IP address is within a CIDR range
- `ipToLong(ip)`: Convert an IP address to its numeric representation

## Database Schema

The database schema is defined using Prisma and includes the following main models:

- **User**: Admin users with authentication information
- **Passkey**: WebAuthn credentials for users
- **Credential**: Stored credentials with encrypted data
- **Policy**: Access control policies for credentials
- **Application**: Third-party applications using the system
- **AuditEvent**: Log of all credential access and operations
- **PendingRequest**: Requests awaiting approval
- **PreApprovedPublicKey**: Public keys pre-approved for application registration

## Monitoring and Logging

### Prometheus Metrics

The application exposes metrics via Prometheus for monitoring:

- Request counts and durations
- Queue metrics
- Error rates
- Resource usage

### Logging

The application uses a structured logging system:

- Different log levels (debug, info, warn, error)
- Structured JSON output
- Log rotation and retention
- Audit logging for security events

## Frontend Integration

The backend changes are designed to support a user-friendly frontend for policy management:

- Templates can be browsed by category
- Recommended templates are highlighted
- Templates can be customized before applying
- Default policies can be applied automatically

## API Authentication

API requests from third-party applications are authenticated using request signatures:

1. The application creates a message containing the request parameters and timestamp
2. The application signs the message using its private key
3. The signature is verified using the application's stored public key
4. The timestamp is checked to prevent replay attacks

## Next Steps

1. Implement frontend components for the template system
2. Add more templates for specific credential types
3. Enhance the usage metrics service with more metrics
4. Add more tests for edge cases
5. Create documentation for end users 