# 🌐 NimbusAI Web App Framework

**Lightweight, reusable web framework for CloudFunction-based applications**

## 🎯 **Architecture**

### **CFramework (Universal)**
Generic CloudFunction client that works across all IP properties.

### **Nimbus Script (Business Layer)**  
Simple wrappers for NimbusAI-specific functionality.

---

## 🚀 **CFramework - Core Functions**

### **Initialization**
```javascript
cf.init({
  serverUrl: 'https://your-worker.workers.dev',
  appName: 'your-app',
  debug: true
});
```

### **Authentication**
```javascript
// Login
const result = await cf.login(email, password);
if (result.success) {
  console.log('Logged in as:', cf.getUserName());
}

// Check auth state
if (cf.isAuthenticated()) {
  console.log('User:', cf.getUser());
}

// Logout
await cf.logout();
```

### **CloudFunction Calls**
```javascript
// Generic CloudFunction runner
const result = await cf.run('any.action', { data: 'here' });

// Examples:
await cf.run('project.list');
await cf.run('page.create', { title: 'Test Page' });
await cf.run('user.profile');
```

### **Logs**
```javascript
// Get logs (generic - works for any app)
const userLogs = await cf.getLogs('user', null, 50);
const entityLogs = await cf.getLogs('project', 'project:123', 20);
```

### **Utilities**
```javascript
cf.formatDate(dateString)        // "12/09/2025, 3:45:23 PM"
cf.formatRelativeTime(dateString) // "2 hours ago"
cf.formatStatus(status)          // { class: 'success', icon: '✅', text: 'Active' }
```

---

## 🎯 **Nimbus Script - Business Wrappers**

### **Projects**
```javascript
// Simple wrappers using cf.run()
const projects = await nimbus.projects.list();
const project = await nimbus.projects.get(projectId);
const newProject = await nimbus.projects.create({ name: 'Test', domain: 'example.com' });
```

### **Pages**
```javascript
const pages = await nimbus.pages.list(projectId);
const page = await nimbus.pages.get(pageId);
const newPage = await nimbus.pages.create(projectId, {
  url: '/test.html',
  title: 'Test Page',
  content: '<html>...</html>'
});
```

### **Logs**
```javascript
const userLogs = await nimbus.logs.user(50);
const projectLogs = await nimbus.logs.project(projectId, 20);
const pageLogs = await nimbus.logs.page(pageId, 10);
```

### **Dashboard Data**
```javascript
// Load complete dashboard data
const data = await nimbus.loadDashboard();
// Returns: { user, projects, recentActivity, stats }

// Load project page data  
const projectData = await nimbus.loadProject(projectId);
// Returns: { project, pages, activity, stats }
```

---

## 🧪 **Testing**

### **Test CFramework Core**
```bash
node test-clean-framework.js
```

### **Test in Browser**
```bash
node test-cframework-server.js
# Visit: http://localhost:8080
```

---

## 📁 **File Structure**

```
www/
├── assets/js/
│   ├── cframework.js          # Universal CloudFunction client
│   └── nimbus.js              # NimbusAI business wrappers
├── test-cframework.html       # Browser testing page
└── README.md                  # This file
```

---

## 🎨 **Usage in HTML**

```html
<!DOCTYPE html>
<html>
<head>
    <title>NimbusAI Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <!-- Your HTML here -->
    
    <script src="assets/js/cframework.js"></script>
    <script src="assets/js/nimbus.js"></script>
    <script>
        // Initialize
        cf.init({
            serverUrl: 'https://nimbus-platform.martin-598.workers.dev',
            appName: 'nimbus'
        });
        
        // Use business functions
        async function loadDashboard() {
            if (!cf.isAuthenticated()) {
                window.location.href = '/auth/login.html';
                return;
            }
            
            const data = await nimbus.loadDashboard();
            // Render dashboard with data.projects, data.recentActivity, etc.
        }
    </script>
</body>
</html>
```

---

## 🔧 **Framework Benefits**

### **CFramework (Universal)**
- ✅ **Reusable** - Works for all 6 IP properties
- ✅ **Lightweight** - Core functions only
- ✅ **Configurable** - Server URL, app name, debug mode
- ✅ **Tested** - Production ready

### **Nimbus (Business)**
- ✅ **Simple** - Just wrappers around cf.run()
- ✅ **Clean** - No complex abstractions
- ✅ **Focused** - NimbusAI-specific only

### **Together**
- ✅ **Fast development** - Dashboard becomes simple
- ✅ **Easy debugging** - Clear separation of concerns
- ✅ **Scalable** - Copy pattern for other IPs

---

## 🎯 **Next Steps**

1. **Build dashboard** using this framework
2. **Copy CFramework** for other IP properties
3. **Create business wrappers** for each IP
4. **Deploy** via Cloudflare Pages or Worker
