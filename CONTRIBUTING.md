# Contributing to Credential Proxy

Thank you for your interest in contributing to Credential Proxy! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others when contributing.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Git

### Setting Up the Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```
   git clone https://github.com/YOUR-USERNAME/credential-proxy.git
   cd credential-proxy
   ```
3. Add the original repository as a remote:
   ```
   git remote add upstream https://github.com/original-owner/credential-proxy.git
   ```
4. Install dependencies:
   ```
   npm install
   cd frontend && npm install && cd ..
   ```
5. Copy the example environment file:
   ```
   cp .env.example .env
   ```
6. Start the development database and Redis:
   ```
   npm run db:up
   ```
7. Run database migrations:
   ```
   npm run prisma:migrate
   ```
8. Start the development servers:
   ```
   npm run dev
   ```

## Development Workflow

### Branching Strategy

We follow a feature branch workflow:

1. Create a branch for your feature or bugfix:
   ```
   git checkout -b feature/your-feature-name
   ```
   or
   ```
   git checkout -b fix/your-bugfix-name
   ```

2. Keep your branch up to date with the main branch:
   ```
   git fetch upstream
   git rebase upstream/main
   ```

### Coding Standards

We use ESLint and TypeScript to enforce coding standards. Please ensure your code passes linting before submitting:

```
npm run lint
```

Key guidelines:
- Use TypeScript for all new code
- Follow functional programming principles where appropriate
- Write unit tests for new functionality
- Include comments for complex logic
- Use descriptive variable and function names

### Commit Messages

We follow conventional commits for commit messages:

- Format: `type(scope): brief description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Example: `feat(policies): add IP restriction policy type`

### Testing

All new features and bugfixes should include tests. We use Jest for testing.

To run tests:
```
npm test
```

To run tests in watch mode:
```
npm run test:watch
```

### Documentation

Update documentation when adding or changing features:
- Update README.md for user-facing changes
- Update DEVELOPER.md for developer-facing changes
- Update API documentation for API changes
- Add JSDoc comments to functions and classes

## Pull Request Process

1. Ensure your code passes all tests and linting
2. Update documentation as needed
3. Add your changes to the CHANGELOG.md under the Unreleased section
4. Create a pull request to the `main` branch
5. Fill out the pull request template with details about your changes
6. Wait for a review from a maintainer

## Feature Requests and Bug Reports

Please use GitHub Issues to report bugs or request features.

For bugs, please include:
- A clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment details (OS, Node.js version, etc.)

For feature requests, please include:
- A clear description of the feature
- Rationale for the feature
- Potential implementation details (if you have ideas)

## Plugin Development

If you're developing a new credential plugin, please follow these guidelines:

1. Create a directory for your plugin in `src/plugins/credentials/`
2. Implement the `CredentialPlugin` interface
3. Include comprehensive tests for your plugin
4. Update the plugin documentation
5. Create an example usage document

## Security Considerations

Security is a top priority for Credential Proxy. Please consider these guidelines:

- Never expose sensitive credentials in logs or error messages
- Validate and sanitize all user input
- Use parameterized queries for database access
- Follow the principle of least privilege
- Use strong encryption for sensitive data
- Consider the security implications of new features

If you discover a security vulnerability, please report it privately to the maintainers rather than creating a public issue.

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT License. 