# 🏗️ Server-Side Architecture Specification

## 🎯 **Vision**
Convert NimbusAI web app to server-side rendered pages with client-side SPA functionality. Server handles all authentication and initial page rendering. Client handles data loading and UI interactions.

## 🏗️ **Architecture Overview**

### **Server-Side (CF Worker)**
```
CF Worker serves HTML pages with EJS templates
├── Authentication enforcement before page render
├── Session validation via cookies
├── User data injection into templates
└── Clean redirects handled server-side
```

### **Client-Side (SPA Functionality)**
```
Clean JavaScript for business logic only
├── Data fetching (projects, pages, logs)
├── UI interactions (forms, buttons, modals)
├── Dynamic content updates
└── No authentication logic
```

## 📁 **File Structure**

### **CF Worker Templates**
```
cf-platform/templates/
├── layouts/
│   ├── base.ejs                 # Base HTML structure
│   ├── auth.ejs                 # Auth page layout
│   └── app.ejs                  # App page layout (with nav)
├── auth/
│   ├── login.ejs                # Login form
│   ├── signup.ejs               # Registration form
│   └── reset.ejs                # Password reset
├── app/
│   ├── dashboard.ejs            # Main dashboard
│   ├── projects.ejs             # Projects list
│   └── project-detail.ejs       # Project detail page
├── legal/
│   ├── privacy.ejs              # Privacy policy
│   └── terms.ejs                # Terms of service
└── components/
    ├── header.ejs               # Navigation header
    ├── footer.ejs               # Page footer
    └── user-menu.ejs            # User dropdown menu
```

### **Static Assets (CF Pages or CDN)**
```
www/assets/
├── css/
│   ├── framework.css            # Core framework styles
│   └── app.css                  # Application-specific styles
├── js/
│   ├── cframework.js            # Client framework (login/logout only)
│   ├── dashboard.js             # Dashboard SPA functionality
│   ├── projects.js              # Projects SPA functionality
│   └── pages.js                 # Pages SPA functionality
└── img/
    └── logo.png                 # Platform logo
```

## 🔐 **Authentication Flow**

### **Server-Side Session Validation**
```javascript
// Middleware for protected routes
async function requireAuth(request, env, ctx, next) {
  const sessionCookie = request.headers.get('Cookie');
  const sessionToken = extractSessionToken(sessionCookie);
  
  if (!sessionToken) {
    return redirect('/auth/login');
  }
  
  const session = await validateSession(sessionToken, env);
  if (!session || !session.valid) {
    return redirect('/auth/login');
  }
  
  // Add user data to request for template rendering
  request.user = session.user;
  return await next(request, env, ctx);
}
```

### **Route Definitions**
```javascript
// Public routes (no auth required)
router.get('/auth/login', renderLoginPage);
router.get('/auth/signup', renderSignupPage);
router.get('/legal/privacy', renderPrivacyPage);

// Protected routes (auth required)
router.get('/app/dashboard', requireAuth, renderDashboard);
router.get('/app/projects', requireAuth, renderProjects);
router.get('/app/project/:id', requireAuth, renderProjectDetail);

// Auth endpoints (existing)
router.post('/auth/login', processLogin);
router.post('/auth/logout', processLogout);
```

## 🎨 **Template System**

### **Base Layout (`layouts/base.ejs`)**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title %> - NimbusAI</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="/assets/css/framework.css" rel="stylesheet">
</head>
<body>
    <%- body %>
    
    <script src="/assets/js/cframework.js"></script>
    <% if (typeof pageScript !== 'undefined') { %>
        <script src="/assets/js/<%= pageScript %>.js"></script>
    <% } %>
</body>
</html>
```

### **Dashboard Template (`app/dashboard.ejs`)**
```html
<% layout('layouts/base', { title: 'Dashboard', pageScript: 'dashboard' }) %>

<%- include('../components/header', { user: user }) %>

<div class="container mt-4">
    <h1>Welcome back, <%= user.name %>!</h1>
    
    <!-- Stats injected server-side -->
    <div class="row mb-4">
        <div class="col-md-4">
            <div class="card">
                <div class="card-body text-center">
                    <h3><%= stats.projectCount %></h3>
                    <p>Projects</p>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Projects container for SPA updates -->
    <div id="projects-container">
        <!-- Initial projects rendered server-side -->
        <% projects.forEach(project => { %>
            <%- include('../components/project-card', { project: project }) %>
        <% }) %>
    </div>
</div>
```

## 🔄 **Migration Strategy**

### **Phase 1: Template Setup (45 minutes)**
1. Create EJS template structure in CF Worker
2. Add template rendering middleware
3. Convert existing HTML to EJS templates

### **Phase 2: Server Routes (45 minutes)**
1. Add GET routes for all pages
2. Implement session middleware
3. Add template rendering with user data

### **Phase 3: Client Cleanup (30 minutes)**
1. Remove auth logic from client scripts
2. Keep only business functionality
3. Simplify CFramework to login/logout only

### **Phase 4: Testing (30 minutes)**
1. Test complete auth flow
2. Verify SPA functionality
3. Test across all pages

## 💡 **Benefits After Migration:**

### **✅ What We Keep:**
- CFramework login/logout functionality
- All existing API endpoints
- Bootstrap 5 design
- SPA data loading

### **✅ What We Gain:**
- Server-side security enforcement
- No localStorage/session issues
- Cleaner client code
- Professional architecture

### **✅ What We Eliminate:**
- Client-side auth complexity
- CORS issues with auth
- Session storage bugs
- Redirect loops

## 🎯 **Recommendation:**

**Yes, do the migration!** The 2-3 hour investment will:
1. **Fix current auth issues** permanently
2. **Create professional architecture** for all 6 IPs
3. **Simplify future development**
4. **Provide enterprise-grade security**

**Should I start with Phase 1 - creating the server-side template system?** 🚀
