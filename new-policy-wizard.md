# New Policy Wizard Implementation Plan

## Progress Update: June 5, 2023

We have completed the implementation of the plugin and credential verb discovery services, which are critical components for the natural language policy builder. These services enable dynamic discovery of available actions based on the specific plugins and credentials in the system. Key accomplishments include:

1. **Credential Verb Discovery Service**: Created a service that identifies and registers verbs specific to different credential types (AWS, databases, API keys, etc.).

2. **Plugin Verb Discovery Service**: Implemented a service that allows plugins to register their own verbs and provides methods for discovering verbs applicable to specific plugins.

3. **API Endpoints**: Added RESTful endpoints to expose credential and plugin-specific verbs to the frontend.

4. **Frontend Integration**: Updated the API client and hooks to fetch verbs for specific credentials and plugins.

5. **Server Initialization**: Added initialization code to ensure verb discovery services are properly started with the server.

These components provide the foundation for context-aware verb selection in the policy builder, enhancing the user experience by showing only relevant actions based on the selected credential or plugin.

## Progress Update: May 28, 2023

We have made significant progress on the natural language policy builder. The core components have been developed and integrated with the policies page. The following is a summary of our progress and next steps.

## Overview

We're redesigning the policy creation experience to use a natural language interface, making it more intuitive and accessible for users. The new approach will allow users to create policies using sentence-based patterns like:

> "If **[application]** wants to do **[action]** then **[allow/block]**"

This document outlines the implementation plan for this new wizard.

## Core Concepts

- **Natural Language Interface**: Policy creation using human-readable sentences
- **Dynamic Verbs**: Context-aware actions based on selected entity
- **Progressive Disclosure**: Start simple, allow complexity when needed
- **Multiple Creation Paths**: Simple builder, templates, and advanced JSON mode
- **Visual Feedback**: Real-time visualization of policy behavior

## Implementation Phases

### Phase 1: Core Components & Data Structure ✅

- [x] Define verb schema and registry
- [x] Design policy translation logic (sentence ↔ JSON)
- [x] Build basic sentence builder component
- [x] Create policy visualization component
- [x] Implement wizard container with tabs

### Phase 2: Advanced Features 🔄

- [ ] Build template gallery component
- [x] Implement advanced JSON editor with autocomplete
- [ ] Add conditional complexity options (AND/OR logic)
- [x] Create time-based and rate-limiting options
- [x] Implement policy simulation/testing interface

### Phase 3: Integration & Polish 🔄

- [x] Connect with existing policy management system
- [x] Implement plugin/credential verb registration
- [ ] Add animations and transitions
- [ ] Improve accessibility
- [ ] Optimize responsive design
- [ ] Add comprehensive documentation

## Detailed Tasks

### 1. Data Structure Design ✅

- [x] **Verb Schema**
  - [x] Define verb properties (id, name, description, category, parameters)
  - [x] Create schema for verb registration by plugins/credentials
  - [x] Design verb categorization (global, plugin-specific, credential-specific)

- [x] **Policy Translation**
  - [x] Create mapping between sentence components and policy JSON
  - [x] Implement bidirectional translation (sentence ↔ JSON)
  - [x] Handle complex conditions and parameters

- [ ] **Template System**
  - [ ] Design template schema
  - [ ] Create template discovery and registration mechanism
  - [ ] Implement template categorization

### 2. UI Components 🔄

#### PolicyWizardDialog Component ✅

- [x] **Component Structure**
  - [x] Create container component with tabbed interface
  - [x] Implement dialog sizing and layout
  - [ ] Add breadcrumbs for multi-step process

- [x] **Tab Management**
  - [x] Basic builder tab
  - [x] Templates tab (placeholder)
  - [x] Advanced JSON tab
  - [x] Tab state persistence

#### PolicySentenceBuilder Component ✅

- [x] **Sentence Structure**
  - [x] Entity selection dropdown (applications, "any")
  - [x] Action selection dropdown (context-aware)
  - [x] Target selection (when applicable)
  - [x] Decision toggle (allow/block)

- [x] **Dynamic Options**
  - [x] Filter verbs based on selected entity
  - [x] Show/hide target selection based on verb
  - [x] Add support for additional parameters

- [x] **Advanced Options**
  - [x] Time conditions (time of day, day of week)
  - [x] Rate limiting options (X times per time period)
  - [ ] Additional conditions with AND/OR logic

#### PolicyVisualization Component ✅

- [x] **Visual Representation**
  - [x] Flow diagram showing policy evaluation
  - [x] Icons for entities, actions, and decisions
  - [x] Color coding for allow/deny outcomes

- [x] **Interactive Elements**
  - [x] Highlight affected components on hover
  - [x] Show detailed explanations on click
  - [x] Toggle between simple and detailed views

#### PolicyTemplateGallery Component ⏰

- [ ] **Template Browsing**
  - [ ] Categorized template list
  - [ ] Search and filter options
  - [ ] Preview functionality

- [ ] **Template Selection**
  - [ ] Template details view
  - [ ] Customization options
  - [ ] Apply template to policy

#### PolicyJsonEditor Component ✅

- [x] **Editor Features**
  - [x] Syntax highlighting
  - [x] Schema validation
  - [x] Autocomplete
  - [x] Error highlighting

- [ ] **Advanced Options**
  - [ ] Format document
  - [ ] Peek definition
  - [ ] Documentation tooltips

### 3. Integration ✅

- [x] **Hook into Existing System**
  - [x] Replace current PolicyCreateDialog with new wizard
  - [x] Update policy creation workflow
  - [x] Ensure compatibility with existing policies

- [x] **Plugin System Integration**
  - [x] API for plugins to register verbs
  - [ ] API for plugins to register templates
  - [x] Discovery mechanism for plugin capabilities

- [x] **Credential Integration**
  - [x] API for credentials to register verbs
  - [ ] API for credentials to register templates
  - [x] Context-aware credential actions

### 4. Polish & Quality ⏰

- [ ] **Animations**
  - [ ] Smooth transitions between wizard steps
  - [ ] Micro-interactions for selection and feedback
  - [ ] Loading states and indicators

- [ ] **Accessibility**
  - [ ] Keyboard navigation
  - [ ] Screen reader support
  - [ ] Focus management
  - [ ] High contrast mode support

- [ ] **Responsive Design**
  - [ ] Mobile-friendly layout
  - [ ] Touch interactions
  - [ ] Adapting to different screen sizes

- [ ] **Error Handling**
  - [ ] Validation feedback
  - [ ] Error recovery
  - [ ] Helpful error messages

## Technical Specifications

### Verb Registry

```typescript
interface Verb {
  id: string;
  name: string;
  description: string;
  category: 'global' | 'plugin' | 'credential';
  requiresTarget: boolean;
  parameters?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'select';
    required: boolean;
    options?: string[]; // For select type
    default?: any;
  }>;
  compatibleWith?: {
    plugins?: string[];
    credentials?: string[];
  };
}
```

### Policy Structure

```typescript
interface PolicyDefinition {
  name: string;
  description?: string;
  type: 'ALLOW_LIST' | 'DENY_LIST' | 'RATE_LIMIT' | 'TIME_BASED' | 'PATTERN_MATCH';
  isActive: boolean;
  scope?: 'GLOBAL' | 'PLUGIN' | 'CREDENTIAL';
  pluginId?: string;
  credentialId?: string;
  priority?: number;
  conditions: Array<{
    entity: string;
    action: string;
    target?: string;
    parameters?: Record<string, any>;
  }>;
  timeRestrictions?: {
    startTime?: string;
    endTime?: string;
    daysOfWeek?: number[];
  };
  rateLimit?: {
    maxCount: number;
    timeWindow: number; // In seconds
    windowType: 'rolling' | 'fixed';
  };
}
```

## UI/UX Guidelines

- **Language**: Use clear, concise, human-readable language throughout
- **Progressive Disclosure**: Start with the simplest interface, reveal complexity as needed
- **Immediate Feedback**: Show users the effects of their choices in real-time
- **Consistent Patterns**: Maintain consistency with the rest of the application
- **Guidance**: Provide helpful tooltips and examples without overwhelming users

## Future Enhancements

- Integration with AI for policy suggestion
- Natural language processing for free-text policy creation
- Policy impact analysis to show potential effects on system
- Advanced conflict detection between policies
- Policy version history and comparison

## Resources

- Design mockups: [To be created]
- API documentation: [To be created]
- Component storybook: [To be created]

## Completed Components

1. ✅ **PolicySentenceBuilder** - Natural language interface for policy creation
2. ✅ **PolicyWizardDialog** - Modal dialog container for the policy wizard
3. ✅ **PolicyJsonEditor** - Advanced JSON editor with syntax highlighting
4. ✅ **PolicySimulator** - Interface for testing policy behavior
5. ✅ **PolicyVisualization** - Visual representation of policy behavior
6. ✅ **Verb Registry API** - Documentation for the verb registry API
7. ✅ **Credential Verb Discovery** - Service for discovering credential-specific verbs
8. ✅ **Plugin Verb Discovery** - Service for discovering plugin-specific verbs
9. ✅ **Verb Registry API Endpoints** - RESTful endpoints for verb management

## Next Steps

### 1. Real Data Integration (Next Priority)

- [✅] **Create a Verb Registry Service**
  - [✅] Design a verb registry data structure in the backend
  - [✅] Create API endpoints for verb registration and discovery
  - [✅] Implement verb categorization and filtering

- [✅] **Connect to Backend APIs**
  - [✅] Replace mock data with API calls
  - [✅] Add loading states for async data fetching
  - [✅] Implement error handling and fallbacks

- [🔄] **Plugin/Credential Integration**
  - [✅] Create an API for plugins to register verbs
  - [🔄] Design credential-specific verb discovery
  - [🔄] Implement dynamic target selection based on verb type

### 2. Template System (Second Priority)

- [ ] **Template Data Structure**
  - [ ] Design template schema with metadata
  - [ ] Create storage strategy for templates
  - [ ] Implement template versioning

- [ ] **Template Gallery Component**
  - [ ] Build template browsing interface
  - [ ] Implement template filtering and search
  - [ ] Create template preview functionality

- [ ] **Template Management**
  - [ ] Add ability to save custom templates
  - [ ] Implement template sharing
  - [ ] Create template update mechanism

### 3. Polish and Accessibility (Third Priority)

- [ ] **Animation and Transitions**
  - [ ] Add tab transition animations
  - [ ] Implement micro-interactions for feedback
  - [ ] Create loading and success animations

- [ ] **Accessibility Improvements**
  - [ ] Ensure keyboard navigation works properly
  - [ ] Add proper ARIA attributes
  - [ ] Test with screen readers
  - [ ] Implement focus management

- [ ] **Responsive Design**
  - [ ] Optimize mobile layout
  - [ ] Implement touch-friendly interactions
  - [ ] Test on various screen sizes

## Implementation Timeline

| Phase | Component | Estimated Completion |
|-------|-----------|----------------------|
| ✅ Phase 1 | Core Components | Completed |
| 🔄 Phase 2 | Real Data Integration | 1-2 weeks |
| ⏳ Phase 3 | Template System | 2-3 weeks |
| ⏳ Phase 4 | Polish & Accessibility | 1-2 weeks |

## Resources and Documentation

- [✅] Create technical documentation for the verb registry API
- [ ] Write developer docs for extending the policy system
- [ ] Create user documentation with examples
- [ ] Record demo videos for complex workflows 