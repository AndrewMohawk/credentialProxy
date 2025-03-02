# Changelog

All notable changes to the Credential Proxy project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Application self-registration API endpoint for third-party applications
- Application status tracking (ACTIVE, PENDING, REVOKED)
- Credential revocation endpoint for applications
- Application self-revocation endpoint for compromised applications
- Admin endpoint to approve pending applications
- Centralized configuration module for managing environment variables and settings
- Service Container pattern for dependency injection and better testability
- Enhanced error handling with custom error types and consistent error responses
- Rate limiting middleware for API endpoints with different limits for various endpoints
- API documentation structure (to be implemented)

### Changed
- Refactored server.ts into modular components for better maintainability
- Updated credential management to use centralized configuration
- Updated proxy queue processor to use service container and centralized configuration
- Improved error handling in main proxy request flow
- Enhanced security headers in Helmet configuration

### Fixed
- Consistent error responses across the API
- Improved environment variable validation and defaults

## [1.0.0] - 2023-03-01

### Added
- Initial release
- Secure credential storage with encryption
- Policy-based access control system
- Plugin system for different credential types
- Request signing for secure third-party application authentication
- Audit logging for all credential usage
- Queue-based asynchronous processing 