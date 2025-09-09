# 📋 Project Initialization Specification

## 🎯 **Purpose**

Enable authenticated users to create and manage projects with unique IDs and configurations that persist in Cloudflare.

## 📊 **Data Structures**

### **Local Project Config**
```json
// .nimbus/project-config.json
{
  "project_id": "proj_a1b2c3d4e5f6",
  "name": "repairsbypost.com",
  "created": "2024-09-02T13:45:00Z",
  "cloudflare": {
    "account_id": "cf_account_123",
    "worker_url": "https://nimbus.example.workers.dev"
  },
  "metadata": {
    "tone": "premium",
    "industry": "watch-repair",
    "default_batch_size": 100,
    "domain": "repairsbypost.com"
  }
}
```

### **Cloudflare KV Storage**
```json
// KV: project:{project_id}
{
  "project_id": "proj_a1b2c3d4e5f6",
  "user_id": "user_xyz789abc",
  "name": "repairsbypost.com",
  "created": "2024-09-02T13:45:00Z",
  "settings": {
    "tone": "premium",
    "max_pages_per_batch": 1000,
    "default_concurrency": 5,
    "domain": "repairsbypost.com"
  },
  "usage": {
    "total_pages": 0,
    "total_batches": 0,
    "last_activity": null
  }
}
```

## 🔧 **Implementation**

### **CLI Command**
```bash
# Initialize new project (requires authentication)
gulp nimbus:project:init \
  --name="repairsbypost.com" \
  --tone="premium" \
  --domain="repairsbypost.com"

# Use existing project
gulp nimbus:project:use --id=proj_a1b2c3d4e5f6

# List projects (uses current auth)
gulp nimbus:project:list
```

### **Module Structure**
```javascript
// gulp/tasks/cloudflare/project-init.js
const { requireAuth } = require('./auth-middleware');
const { hashApiKey } = require('./api-key-manager');

module.exports = {
  // Generate unique project ID
  generateProjectId() {
    return `proj_${crypto.randomBytes(6).toString('hex')}`;
  },

  // Initialize project with authentication
  async initProject(options) {
    // Require valid authentication
    const auth = await requireAuth(options);
    
    const projectId = this.generateProjectId();
    
    const config = {
      project_id: projectId,
      name: options.name,
      created: new Date().toISOString(),
      metadata: {
        tone: options.tone || 'professional',
        industry: options.industry || 'general',
        domain: options.domain || options.name
      }
    };

    // Save locally
    await fs.ensureDir('.nimbus');
    await fs.writeJson('.nimbus/project-config.json', config, { spaces: 2 });
    
    // Upload to Cloudflare with auth info
    await this.uploadToCloudflare(config, auth);
    
    console.log(chalk.green(`✅ Project created: ${projectId}`));
    console.log(chalk.gray(`📁 Config saved to: .nimbus/project-config.json`));
    
    return config;
  },

  // Upload project to Cloudflare
  async uploadToCloudflare(config, auth) {
    // Store project data with user reference
    await cfClient.put(`project:${config.project_id}`, {
      ...config,
      user_id: auth.user_id,
      settings: {
        tone: config.metadata.tone,
        max_pages_per_batch: 1000,
        default_concurrency: 5,
        domain: config.metadata.domain
      },
      usage: {
        total_pages: 0,
        total_batches: 0,
        last_activity: null
      }
    });

    // Update user's project list
    const projects = await cfClient.get(`projects:${auth.user_id}`, 'json') || [];
    projects.push(config.project_id);
    await cfClient.put(`projects:${auth.user_id}`, JSON.stringify(projects));
  },

  // List projects for current auth
  async listProjects(options) {
    const auth = await requireAuth(options);
    
    // Get user's project list
    const projectIds = await cfClient.get(`projects:${auth.user_id}`, 'json') || [];
    if (!projectIds.length) {
      console.log(chalk.yellow('No projects found'));
      return [];
    }
    
    // Load project details
    const projects = [];
    for (const projectId of projectIds) {
      const project = await cfClient.get(`project:${projectId}`, 'json');
      if (project) {
        projects.push(project);
      }
    }
    
    // Display projects
    console.log(chalk.blue('\n📋 Your Projects:'));
    console.log(chalk.gray('─'.repeat(50)));
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${chalk.cyan(project.project_id)} - "${project.name}"`);
      console.log(`   Created: ${new Date(project.created).toLocaleDateString()}`);
      console.log(`   Domain: ${project.settings.domain}`);
      console.log(`   Pages: ${project.usage.total_pages}`);
    });
    
    return projects;
  }
};
```

## 🔐 **Security Considerations**

1. **Project ID Format**
   - Prefix with `proj_` for clarity
   - 12 character hex string
   - Globally unique

2. **Project Isolation**
   - Projects tied to API key that created them
   - Cannot access projects from other API keys
   - Owner email tracked for audit trail

3. **Authentication Required**
   - All project operations require valid auth
   - API key + email validation on every request
   - Projects inherit auth context

## 📝 **Example Usage**

### **First Time Setup**
```bash
# First, create API key (one time)
$ gulp nimbus:auth:create --email="john@example.com"
✅ API Key created successfully!
🔑 API Key: sk_live_abcdef123456789
📧 Email: john@example.com
📁 Saved to: /Users/john/.nimbus/auth.json

# Create new project (auto-uses saved auth)
$ gulp nimbus:project:init --name="repairsbypost.com" --domain="repairsbypost.com"
✅ Using authentication: john@example.com
✅ Project created: proj_a1b2c3d4e5f6
📁 Config saved to: .nimbus/project-config.json

# Start using
$ gulp nimbus:scan:map --folder dist/local
✅ Using project: proj_a1b2c3d4e5f6
```

### **Returning User**
```bash
# List available projects (auto-uses saved auth)
$ gulp nimbus:project:list
✅ Using authentication: john@example.com

📋 Your Projects:
──────────────────────────────────────────────────
1. proj_a1b2c3d4e5f6 - "repairsbypost.com"
   Created: 9/2/2024
   Domain: repairsbypost.com
   Pages: 127

2. proj_b2c3d4e5f6g7 - "another-site.com"
   Created: 9/1/2024
   Domain: another-site.com
   Pages: 45

# Use specific project
$ gulp nimbus:project:use --id=proj_a1b2c3d4e5f6
✅ Switched to project: repairsbypost.com
```

## ✅ **Success Criteria**

- [ ] Generate cryptographically secure project IDs
- [ ] Require authentication for all project operations
- [ ] Store project config locally in `.nimbus/`
- [ ] Upload project data to Cloudflare KV
- [ ] Link projects to API key that created them
- [ ] Support multiple projects per API key
- [ ] Track owner email for audit trail
