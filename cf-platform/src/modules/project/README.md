# Project Module

Manages project operations using the DataModel framework.

## Core Features
- Create, read, update, delete projects
- Project ownership validation
- Configuration management
- Extraction rules management
- Listing with filters and pagination

## Usage

```javascript
import { ProjectManager } from './modules/project/index.js';

// Initialize with user context
const projects = new ProjectManager(env, userId);

// Create project
const result = await projects.create({
  name: 'My Website',
  description: 'Company website',
  domain: 'example.com',
  logo: 'https://example.com/logo.png',
  config: {
    defaultTone: 'professional',
    targetAudience: 'businesses'
  }
});

// Get project
const project = await projects.get(projectId);

// Update project
await projects.update(projectId, {
  name: 'Updated Name',
  status: 'paused'
});

// Update specific configs
await projects.updateConfig(projectId, {
  defaultTone: 'casual'
});

// List user's projects
const list = await projects.list({
  status: 'active',
  includeData: true
});

// Check ownership
const isOwner = await projects.checkOwnership(projectId);

// Delete project (soft delete)
await projects.delete(projectId);
```

## Project Structure

```
project/
├── index.js                # Module exports
├── core/
│   └── project-manager.js  # Business logic
└── README.md
```

## Integration Points

- **DataModel**: Uses DataModel for storage
- **Logs**: Integrated logging via LOGS module
- **Auth**: Respects userId context for ownership

## Notes

- All operations respect user context
- Soft deletes only (data retained)
- Automatic timestamps via DataModel
- D1 metadata sync for querying
- ID generation handled by DataModel (format: `project:mf8y0hsj194812`)
- Field validation defined in model definition
