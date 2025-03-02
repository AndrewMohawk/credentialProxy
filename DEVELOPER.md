# Developer Documentation: Policy System Enhancements

## Overview

The Credential Proxy policy system has been enhanced with new policy types, a template system, and improved evaluation logic. This document provides an overview of the changes and how to work with the new features.

## New Policy Types

The following new policy types have been added:

1. **Rate Limiting** (`RATE_LIMITING`): Limits the frequency of requests within a time window.
2. **IP Restriction** (`IP_RESTRICTION`): Controls access based on IP addresses or CIDR ranges.
3. **Usage Threshold** (`USAGE_THRESHOLD`): Sets limits on various usage metrics like request count, API calls, or data transferred.
4. **Context-Aware** (`CONTEXT_AWARE`): Evaluates policies based on request context and conditions.
5. **Approval Chain** (`APPROVAL_CHAIN`): Implements multi-step approval workflows.

## Policy Templates

A new template system has been implemented to make policy creation easier and more consistent:

- Templates are predefined policy configurations that can be applied to credentials
- Templates are organized by category (Access Control, Usage Limits, etc.)
- Templates can be customized when applied
- Recommended templates are available for each credential type

### Template Structure

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

### Template Service

The `PolicyTemplateService` provides methods for working with templates:

- `applyTemplate(templateId, credentialId, applicationId?, customization?)`: Applies a template to a credential
- `applyRecommendedTemplates(credentialId)`: Applies all recommended templates for a credential
- `hasAnyPolicies(credentialId)`: Checks if a credential has any policies
- `applyDefaultPolicies(credentialId)`: Applies default policies if none exist

## Policy Evaluator

The policy evaluator has been enhanced to support all policy types:

- Each policy type has a dedicated evaluation function
- Policies are evaluated in priority order
- Manual approval policies are checked first
- The evaluator returns detailed results including status and reason

### Evaluation Process

1. Request is received and passed to the policy evaluator
2. Policies are sorted by priority
3. Manual approval policies are checked first
4. Each policy is evaluated based on its type
5. The first policy that denies access stops the evaluation
6. If all policies pass, the request is approved

## API Endpoints

New API endpoints have been added for working with policy templates:

- `GET /api/v1/policies/templates/all`: Get all available templates
- `GET /api/v1/policies/templates/type/:credentialType`: Get templates for a specific credential type
- `GET /api/v1/policies/templates/:id`: Get a specific template by ID
- `GET /api/v1/policies/templates/credential/:credentialId`: Get templates for a specific credential
- `POST /api/v1/policies/templates/credential/:credentialId/apply`: Apply a template to a credential
- `POST /api/v1/policies/templates/credential/:credentialId/apply-recommended`: Apply recommended templates

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

## Testing

Comprehensive tests have been added for the new policy types and template system:

- `policyEvaluator.test.ts`: Tests for all policy types
- `policyTemplateService.test.ts`: Tests for the template service

## Frontend Integration

The backend changes are designed to support a user-friendly frontend for policy management:

- Templates can be browsed by category
- Recommended templates are highlighted
- Templates can be customized before applying
- Default policies can be applied automatically

## Next Steps

1. Implement frontend components for the template system
2. Add more templates for specific credential types
3. Enhance the usage metrics service with more metrics
4. Add more tests for edge cases
5. Create documentation for end users 