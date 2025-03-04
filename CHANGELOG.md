# Change Log

## [Unreleased]

### Added
- Enhanced policy system with new policy types:
  - Rate Limiting: Limit request frequency
  - IP Restriction: Control access by IP address/range
  - Usage Threshold: Set limits on usage metrics
  - Context-Aware: Policies based on request context
  - Approval Chain: Multi-step approval workflows
- Policy templates system for easy policy creation
  - Predefined templates for common security patterns
  - Templates organized by category (Access Control, Usage Limits, etc.)
  - Ability to customize templates when applying
- Policy evaluation engine with support for all policy types
- API endpoints for managing policy templates
- Utility services for IP address validation and usage metrics tracking
- Configurable port settings for both frontend and backend services
  - Added FRONTEND_PORT environment variable
  - Updated configuration to use environment variables consistently
  - Removed hardcoded port values throughout the codebase
- Configurable host settings for both frontend and backend services
  - Added HOST environment variable for backend host
  - Added FRONTEND_HOST environment variable for frontend host
  - Updated URL construction to use configurable hosts
  - Improved deployment flexibility for different environments
- Environment variables for configurable hosts:
  - `HOST` for backend service (defaults to 'localhost')
  - `FRONTEND_HOST` for frontend service (defaults to 'localhost')
  - `BACKEND_HOST` for frontend to reference backend (defaults to 'localhost')
  - `REDIS_HOST` for Redis connection (defaults to 'localhost')

### Changed
- Refactored policy evaluation logic for better extensibility
- Updated Redis client implementation for better error handling
- Enhanced policy testing with comprehensive test coverage
- Updated Ethereum plugin to be compatible with latest Viem library types
- Updated all services to use environment variables for host configuration
- Removed hardcoded 'localhost' references throughout the codebase
- Updated documentation to reflect configurable host settings
- Modified Docker configuration to support configurable hosts
- Enhanced frontend components to use environment variables for API URLs

### Fixed
- Improved error handling in policy evaluation
- Fixed Redis connection management
- Fixed API tests for credential routes to handle cases without applicationId
- Fixed admin routes tests by updating expected plugin structure
- Fixed pre-approved keys routes tests by adjusting date comparison
- Fixed TypeScript errors in Ethereum plugin related to transaction parameters
- Fixed policy template service tests to properly handle mock data in test environment
- Redis connection in queue system now uses configurable host
- Swagger documentation now uses the configured host instead of hardcoded value
- Frontend credential hooks now properly use environment variables for backend host 

## [1.0.0] - 2023-12-15

### Added
- Initial release of Credential Proxy
- Basic policy types: Allow List, Deny List, Time-Based, Count-Based, Manual Approval, Pattern Match
- Credential management system
- Plugin architecture for credential types
- Request signing for authentication
- Basic web interface 