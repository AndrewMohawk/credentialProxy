# Policy Wizard

The Policy Wizard is a comprehensive framework for creating, managing, and monitoring credential access policies. It provides multiple creation modes to accommodate users of different technical levels.

## Features

- **Multiple Policy Types**: Support for Allow Lists, Deny Lists, Time-Based, Count-Based, and Manual Approval policies
- **Multiple Creation Modes**:
  - **Template Mode**: Select from pre-built templates
  - **Visual Builder**: Create policies using a drag-and-drop interface
  - **JSON Editor**: Directly edit the policy JSON for maximum flexibility
- **Policy Simulation**: Test policies before saving to ensure they behave as expected
- **Analytics Dashboard**: Monitor policy effectiveness and optimize access control

## Getting Started

### Installation

The Policy Wizard is included in the Credential Proxy system. To install:

```bash
# Clone the repository
git clone https://github.com/your-org/credential-proxy.git
cd credential-proxy

# Install dependencies
npm install

# Build the application
npm run build

# Start the server
npm start
```

### Usage

1. **Accessing the Policy Wizard**:
   - Navigate to `/policies/new` to create a new policy
   - Provide a `credentialId` query parameter to associate the policy with a specific credential

2. **Creating a Policy**:
   - **Step 1**: Choose a creation mode (Template, Visual, JSON)
   - **Step 2**: Configure the policy using the selected mode
   - **Step 3**: Test the policy using the simulator
   - **Step 4**: Review and save the policy

3. **Viewing Analytics**:
   - Navigate to `/policies` to view policy effectiveness metrics
   - Filter by credential ID or time range

## Policy Types

### Allow List Policy
Allows access only if the specified field matches one of the allowed values.

### Deny List Policy
Denies access if the specified field matches one of the denied values.

### Time-Based Policy
Allows access only during specified days and hours.

### Count-Based Policy
Limits the number of requests within a specified time window.

### Manual Approval Policy
Requires manual approval from designated approvers before allowing access.

## Development

### Front-end Architecture

The Policy Wizard has been migrated to use Next.js for its UI components. The components are located in the `frontend/components/policies` directory.

The frontend uses:
- Next.js App Router
- React Server Components where possible
- Shadcn UI components for consistent design
- Tailwind CSS for styling

### Directory Structure

```
frontend/
├── app/
│   └── policies/           # Policy-related pages
│       ├── page.tsx        # Policy list page
│       ├── new/            # Policy creation page
│       │   └── page.tsx
│       └── simulator/      # Policy simulator
│           └── page.tsx
├── components/
│   └── policies/           # Policy components
│       ├── policy-wizard.tsx
│       ├── policies-table.tsx
│       ├── policy-analytics.tsx
│       ├── policy-json-editor.tsx
│       ├── policy-flow-visualization.tsx
│       └── policy-view-dialog.tsx
└── lib/                    # Utility functions and types
    └── api/
        └── policies.ts     # API client for policy operations

src/
├── core/
│   └── policies/           # Core policy engine
│       ├── policyEngine.ts
│       ├── policyValidation.ts
│       └── policyTemplates.ts
├── services/               # Business logic services
│   └── policyService.ts
└── api/                    # Backend API routes
    └── policies/           # Policy API endpoints
```

### Styling

The Policy Wizard uses Tailwind CSS for styling within the Next.js frontend. Custom components and styles are defined using Tailwind's utility classes and the shadcn/ui component library.

## Contributing

Contributions to the Policy Wizard are welcome! Here are some ideas for future enhancements:

1. Adding more policy templates
2. Enhancing the visual policy builder with more options
3. Improving the analytics dashboard with more metrics
4. Adding user documentation and tooltips
5. Creating a mobile-friendly version

## License

MIT 