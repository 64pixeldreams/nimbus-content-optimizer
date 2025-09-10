# 🌐 NimbusAI Web App Framework - Complete Design Specification

## 🎯 **Vision**
Build a **reusable web app framework** for NimbusAI that can be deployed and adapted across all 6 IP properties. Clean, modern, Bootstrap 5-based dashboard with full authentication and project management.

## 🏗️ **Framework Architecture**

### **Directory Structure**
```
www/
├── auth/                           # 🔐 Authentication Pages
│   ├── login.html                 # Login form
│   ├── signup.html                # User registration
│   ├── reset-password.html        # Password reset request
│   ├── reset-confirm.html         # Password reset confirmation
│   └── verify-email.html          # Email verification
├── app/                           # 📱 Main Application
│   ├── dashboard.html             # Main dashboard (projects overview)
│   ├── project/                   # 📁 Project Management
│   │   ├── list.html             # Projects list
│   │   ├── detail.html           # Project detail view
│   │   ├── create.html           # Create new project
│   │   └── settings.html         # Project settings
│   ├── pages/                     # 📄 Page Management
│   │   ├── list.html             # Pages list (within project)
│   │   ├── detail.html           # Page detail view
│   │   ├── upload.html           # Batch upload interface
│   │   └── logs.html             # Page audit logs
│   ├── user/                      # 👤 User Management
│   │   ├── profile.html          # User profile
│   │   ├── settings.html         # User settings
│   │   └── api-keys.html         # API key management
│   └── admin/                     # ⚙️ Admin Panel (future)
│       ├── users.html            # User management
│       └── system.html           # System monitoring
├── assets/                        # 🎨 Static Assets
│   ├── css/                      
│   │   ├── framework.css         # Core framework styles
│   │   ├── auth.css              # Authentication styles
│   │   └── dashboard.css         # Dashboard styles
│   ├── js/
│   │   ├── framework.js          # Core framework JS
│   │   ├── auth.js               # Authentication logic
│   │   ├── api.js                # API communication
│   │   └── dashboard.js          # Dashboard functionality
│   └── img/
│       └── logo.png              # NimbusAI logo
├── components/                    # 🧩 Reusable Components
│   ├── header.html               # Navigation header
│   ├── sidebar.html              # Dashboard sidebar
│   ├── footer.html               # Page footer
│   ├── page-card.html            # Page display component
│   ├── project-card.html         # Project display component
│   └── log-entry.html            # Audit log entry component
├── index.html                     # 🏠 Landing page (redirects to dashboard)
├── 404.html                      # Error page
└── deployment.md                 # Deployment instructions
```

## 🔐 **Authentication Flow**

### **Login Process**
```
1. User visits /auth/login.html
2. Form submits to: POST /auth/login
3. Success → Redirect to /app/dashboard.html
4. Failure → Show error message
5. Session persists across pages
```

### **Session Management**
```javascript
// Check authentication on every app page
if (!isAuthenticated()) {
  window.location.href = '/auth/login.html';
}

// Auto-logout on session expiry
setInterval(checkSession, 60000); // Check every minute
```

## 📱 **Dashboard Design**

### **Main Dashboard (`/app/dashboard.html`)**
```html
<div class="container-fluid">
  <div class="row">
    <div class="col-md-3">
      <!-- Sidebar Navigation -->
      <nav class="sidebar">
        <ul>
          <li><a href="dashboard.html">📊 Dashboard</a></li>
          <li><a href="project/list.html">📁 Projects</a></li>
          <li><a href="user/profile.html">👤 Profile</a></li>
          <li><a href="user/api-keys.html">🔑 API Keys</a></li>
        </ul>
      </nav>
    </div>
    <div class="col-md-9">
      <!-- Main Content -->
      <div class="dashboard-content">
        <h1>📊 Dashboard</h1>
        <div class="row">
          <div class="col-md-4">
            <div class="card project-summary">
              <h3>📁 Projects</h3>
              <p class="stat">3 Active</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card pages-summary">
              <h3>📄 Pages</h3>
              <p class="stat">127 Total</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card status-summary">
              <h3>⚡ Processing</h3>
              <p class="stat">5 In Progress</p>
            </div>
          </div>
        </div>
        
        <div class="recent-activity">
          <h2>🕒 Recent Activity</h2>
          <div class="activity-feed">
            <!-- Dynamic audit logs loaded via API -->
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

## 📁 **Project Management**

### **Projects List (`/app/project/list.html`)**
```html
<div class="projects-container">
  <div class="d-flex justify-content-between align-items-center mb-4">
    <h1>📁 My Projects</h1>
    <button class="btn btn-primary" onclick="createProject()">
      ➕ New Project
    </button>
  </div>
  
  <div class="row" id="projects-grid">
    <!-- Dynamic project cards loaded via project.list API -->
  </div>
</div>
```

### **Project Detail (`/app/project/detail.html?id=project:xyz`)**
```html
<div class="project-detail">
  <div class="project-header">
    <h1 id="project-name">Loading...</h1>
    <span class="badge badge-success" id="project-status">Active</span>
  </div>
  
  <div class="row">
    <div class="col-md-8">
      <div class="card">
        <h3>📄 Pages</h3>
        <div class="pages-list" id="pages-container">
          <!-- Dynamic pages loaded via page.list API -->
        </div>
      </div>
    </div>
    <div class="col-md-4">
      <div class="card">
        <h3>📋 Activity Log</h3>
        <div class="activity-log" id="activity-container">
          <!-- Dynamic audit logs via page.logs API -->
        </div>
      </div>
    </div>
  </div>
</div>
```

## 🔧 **Framework JavaScript API**

### **Core API Client (`/assets/js/api.js`)**
```javascript
class NimbusAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.sessionToken = localStorage.getItem('nimbus_session');
  }
  
  // Authentication
  async login(email, password) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    
    if (result.success) {
      this.sessionToken = result.session_token;
      localStorage.setItem('nimbus_session', result.session_token);
    }
    
    return result;
  }
  
  // CloudFunction wrapper
  async call(action, payload = {}) {
    const response = await fetch(`${this.baseUrl}/api/function`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': `nimbus_session=${this.sessionToken}`
      },
      body: JSON.stringify({ action, payload })
    });
    
    return await response.json();
  }
  
  // Convenience methods
  async getProjects() { return await this.call('project.list'); }
  async getPages(projectId) { return await this.call('page.list', { project_id: projectId }); }
  async getLogs(type, entityId) { return await this.call('page.logs', { type, entity_id: entityId }); }
}
```

## 🎨 **Design System**

### **Color Scheme**
```css
:root {
  --primary: #007bff;      /* Bootstrap blue */
  --secondary: #6c757d;    /* Bootstrap gray */
  --success: #28a745;      /* Green for success */
  --warning: #ffc107;      /* Yellow for pending */
  --danger: #dc3545;       /* Red for errors */
  --info: #17a2b8;         /* Cyan for info */
  
  /* NimbusAI Brand Colors */
  --nimbus-primary: #2563eb;   /* Modern blue */
  --nimbus-secondary: #64748b; /* Slate gray */
  --nimbus-accent: #10b981;    /* Emerald green */
}
```

### **Component Library**
```html
<!-- Project Card Component -->
<div class="card project-card">
  <div class="card-body">
    <h5 class="card-title">🏠 Project Name</h5>
    <p class="card-text">Domain: example.com</p>
    <div class="d-flex justify-content-between">
      <span class="badge badge-success">Active</span>
      <small class="text-muted">127 pages</small>
    </div>
  </div>
</div>

<!-- Page Card Component -->
<div class="card page-card">
  <div class="card-body">
    <h6 class="card-title">📄 Page Title</h6>
    <p class="card-text">/page-url.html</p>
    <div class="d-flex justify-content-between">
      <span class="badge badge-warning">Processing</span>
      <small class="text-muted">2 min ago</small>
    </div>
  </div>
</div>

<!-- Activity Log Entry -->
<div class="activity-entry">
  <div class="d-flex align-items-start">
    <div class="activity-icon">📄</div>
    <div class="activity-content">
      <p class="activity-message">Martin uploaded page: Test Page</p>
      <small class="text-muted">2 minutes ago</small>
    </div>
  </div>
</div>
```

## 🚀 **Deployment Strategy**

### **Option 1: Cloudflare Pages (Recommended)**
```bash
# Deploy static files to Cloudflare Pages
# Connects to existing CF Worker backend
# Custom domain support
# Automatic HTTPS
```

### **Option 2: CF Worker with Static Assets**
```bash
# Serve HTML/CSS/JS from CF Worker
# Single deployment point
# Integrated with backend
```

### **Option 3: Local Development Server**
```bash
# Simple HTTP server for development
# Proxy API calls to CF Worker
# Hot reload for development
```

## 📋 **Page Specifications**

### **1. Authentication Pages**

#### **Login Page (`/auth/login.html`)**
```
Features:
- Bootstrap 5 form design
- Email + password fields
- "Remember me" checkbox
- "Forgot password?" link
- Error message display
- Auto-redirect to dashboard on success
```

#### **Signup Page (`/auth/signup.html`)**
```
Features:
- Email + password + confirm password
- Auto-generate name from email
- Terms & conditions checkbox
- Email verification flow
- Success message with next steps
```

### **2. Dashboard Pages**

#### **Main Dashboard (`/app/dashboard.html`)**
```
Features:
- Project summary cards
- Recent activity feed
- Quick stats (pages, processing status)
- Navigation sidebar
- User menu (profile, logout)
```

#### **Projects List (`/app/project/list.html`)**
```
Features:
- Grid view of project cards
- Search/filter functionality
- Create new project button
- Project status indicators
- Quick actions (view, edit, delete)
```

#### **Project Detail (`/app/project/detail.html`)**
```
Features:
- Project information header
- Pages list with status
- Audit log sidebar
- Bulk actions (upload, process)
- Project settings access
```

### **3. Page Management**

#### **Pages List (`/app/pages/list.html`)**
```
Features:
- Table view with sorting
- Status filters (pending, processing, completed)
- Bulk selection and actions
- Upload new pages button
- Processing progress indicators
```

#### **Page Detail (`/app/pages/detail.html`)**
```
Features:
- Page content preview
- Processing history
- Before/after comparison
- Download optimized content
- Reprocess button
```

## 🔧 **Framework Components**

### **1. Authentication Component (`auth.js`)**
```javascript
class AuthManager {
  static async login(email, password) { /* ... */ }
  static async logout() { /* ... */ }
  static isAuthenticated() { /* ... */ }
  static getUserInfo() { /* ... */ }
  static redirectIfNotAuth() { /* ... */ }
}
```

### **2. API Component (`api.js`)**
```javascript
class NimbusAPI {
  async getProjects() { /* ... */ }
  async getPages(projectId) { /* ... */ }
  async getLogs(type, entityId) { /* ... */ }
  async uploadPages(files) { /* ... */ }
}
```

### **3. UI Components (`components/`)**
```html
<!-- Reusable HTML components -->
- header.html (navigation)
- sidebar.html (dashboard nav)
- project-card.html (project display)
- page-card.html (page display)
- activity-log.html (audit log display)
```

## 🎨 **Design System**

### **Bootstrap 5 Theme**
```css
/* Custom NimbusAI theme extending Bootstrap 5 */
.nimbus-theme {
  --bs-primary: #2563eb;
  --bs-secondary: #64748b;
  --bs-success: #10b981;
  --bs-warning: #f59e0b;
  --bs-danger: #ef4444;
}

/* Component styles */
.project-card { /* ... */ }
.page-card { /* ... */ }
.activity-feed { /* ... */ }
.status-badge { /* ... */ }
```

### **Responsive Design**
```css
/* Mobile-first approach */
@media (max-width: 768px) {
  .sidebar { display: none; }
  .mobile-menu { display: block; }
}

@media (min-width: 992px) {
  .sidebar { position: fixed; }
  .main-content { margin-left: 250px; }
}
```

## 🚀 **Development Phases**

### **Phase 1: Foundation (2 hours)**
1. **Setup structure** - Create all directories
2. **Bootstrap 5 integration** - CDN + custom theme
3. **Authentication pages** - Login, signup, password reset
4. **Core framework JS** - API client, auth manager

### **Phase 2: Dashboard (1 hour)**
1. **Main dashboard** - Projects overview + activity feed
2. **Projects list** - Grid view with cards
3. **Navigation** - Sidebar + header components

### **Phase 3: Project Management (1 hour)**
1. **Project detail** - Pages list + audit logs
2. **Page management** - List, detail, upload
3. **Audit log display** - Activity feeds

### **Phase 4: Polish (30 minutes)**
1. **Error handling** - 404, network errors
2. **Loading states** - Spinners, skeleton screens
3. **Mobile optimization** - Responsive design

## 🌐 **Deployment Options**

### **Option A: Cloudflare Pages (Recommended)**
```bash
# Static site deployment
# Automatic builds from git
# Custom domain support
# Integrates with CF Worker backend
```

### **Option B: CF Worker Static Assets**
```javascript
// Serve static files from Worker
// Single deployment point
// Dynamic content possible
```

### **Option C: Development Server**
```bash
# Local development
# Live reload
# Proxy to CF Worker backend
```

## 🎯 **API Integration Points**

### **Authentication APIs**
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### **CloudFunction APIs**
- `project.list` - Get user's projects
- `project.get` - Get project details
- `project.create` - Create new project
- `page.list` - Get project pages
- `page.create` - Create new page
- `page.logs` - Get audit logs

## 💡 **Framework Benefits**

### **Reusable Across 6 IPs**
```
NimbusAI → Content optimization dashboard
IP #2 → Adapt components for different business
IP #3 → Same auth, different project types
IP #4 → Reuse entire framework
IP #5 → Custom theme, same structure
IP #6 → White-label version
```

### **Scalable Architecture**
- **Component-based** - Reusable HTML/CSS/JS
- **API-driven** - Clean separation of concerns
- **Theme-able** - Easy customization per IP
- **Mobile-ready** - Responsive design

## 🎯 **Success Criteria**

### **MVP Goals**
1. ✅ **User can login** and stay logged in
2. ✅ **User can see projects** from their account
3. ✅ **User can see pages** within a project
4. ✅ **User can see audit logs** for activities
5. ✅ **Clean, professional design** ready for clients

### **Framework Goals**
1. ✅ **Reusable components** for other IPs
2. ✅ **Consistent design system** 
3. ✅ **Mobile-responsive** layout
4. ✅ **Easy deployment** process

---

## 🚀 **Ready to Build?**

This framework will give you:
- **Professional dashboard** for NimbusAI
- **Reusable foundation** for 6 IPs
- **Visual debugging** for AI tasks
- **Client presentation** capability

**The design leverages your existing APIs perfectly and follows your "done right, done once" philosophy!**
