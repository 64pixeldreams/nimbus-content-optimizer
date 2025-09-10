# 🎨 Framework Design Specification

## 🎯 **Core Framework Pages - Reusable Across All IPs**

### **Design Philosophy**
- **Clean & Professional** - White background, subtle shadows
- **Responsive** - Mobile-first Bootstrap 5
- **Configurable** - Platform name, logo, colors per app
- **Consistent** - Same components across all pages

---

## 🎨 **Visual Design System**

### **Color Scheme**
```css
/* Framework Base Colors */
--framework-primary: #2563eb;     /* Modern blue */
--framework-secondary: #64748b;   /* Slate gray */
--framework-success: #10b981;     /* Emerald green */
--framework-warning: #f59e0b;     /* Amber */
--framework-danger: #ef4444;      /* Red */

/* Background & Layout */
--framework-bg: #ffffff;          /* Pure white */
--framework-card-bg: #ffffff;     /* Card background */
--framework-border: #e2e8f0;      /* Light border */
--framework-shadow: 0 1px 3px rgba(0,0,0,0.1); /* Subtle shadow */
```

### **Typography**
```css
/* Framework Typography */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--framework-text-primary: #1e293b;
--framework-text-secondary: #64748b;
--framework-text-muted: #94a3b8;
```

### **Components**
```css
/* Login Card */
.login-card {
  max-width: 400px;
  margin: 0 auto;
  border-radius: 12px;
  border: 1px solid var(--framework-border);
  box-shadow: var(--framework-shadow);
}

/* Header Bar */
.framework-header {
  background: var(--framework-primary);
  border-bottom: 1px solid var(--framework-border);
}

/* User Avatar Dropdown */
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--framework-secondary);
}
```

---

## 📄 **Page Specifications**

### **1. Login Page (`/auth/login.html`)**
```
Layout:
├── Full-screen centered layout
├── White background (configurable with background image)
├── Centered login card (400px max-width)
├── Platform logo at top
├── "Sign into your account" heading
├── Email input field
├── Password input field  
├── "Remember on device" checkbox
├── "Sign In" button (primary color)
├── "New to [Platform]? Create account" link
├── Footer with copyright
└── Cookie consent popup
```

### **2. Signup Page (`/auth/signup.html`)**
```
Layout:
├── Same layout as login
├── "Create your account" heading
├── Email input
├── Password input
├── Confirm password input
├── "I agree to Terms & Privacy" checkbox
├── "Create Account" button
├── "Already have an account? Sign in" link
└── Same footer + cookie consent
```

### **3. Dashboard Page (`/app/dashboard.html`)**
```
Layout:
├── Header bar with logo + user dropdown
├── Main content area
├── Welcome message with user name
├── Quick stats cards
├── Recent activity feed
└── Footer
```

---

## ⚙️ **Configuration System**

### **Platform Config (`/assets/js/config.js`)**
```javascript
const platformConfig = {
  // Platform Identity
  name: "NimbusAI",
  logo: "/assets/img/logo.png",
  domain: "nimbus.yourdomain.com",
  
  // API Configuration  
  apiUrl: "https://nimbus-platform.martin-598.workers.dev",
  
  // Branding
  colors: {
    primary: "#2563eb",
    secondary: "#64748b"
  },
  
  // Features
  features: {
    rememberDevice: true,
    cookieConsent: true,
    backgroundImage: null // Optional background
  },
  
  // Legal
  links: {
    privacy: "/legal/privacy.html",
    terms: "/legal/terms.html",
    support: "mailto:support@yourdomain.com"
  }
};
```

---

## 📱 **Responsive Design**

### **Mobile-First Approach**
```css
/* Mobile (default) */
.login-card { width: 90%; max-width: 400px; }

/* Tablet */
@media (min-width: 768px) {
  .login-card { width: 400px; }
}

/* Desktop */
@media (min-width: 992px) {
  .dashboard-sidebar { display: block; }
  .main-content { margin-left: 250px; }
}
```

---

## 🔧 **Implementation Steps**

### **Step 1: Framework CSS (15 minutes)**
- Create `framework.css` with base styles
- Bootstrap 5 customization
- Responsive utilities

### **Step 2: Configuration (10 minutes)**
- Create `config.js` with platform settings
- Logo, colors, API URL configuration

### **Step 3: Login Page (20 minutes)**
- Clean, centered card design
- Form validation
- Client-side authentication using CFramework

### **Step 4: Dashboard (15 minutes)**
- Header with user dropdown
- Basic dashboard layout
- Data loading using Nimbus wrappers

### **Step 5: Legal & Polish (15 minutes)**
- Privacy/Terms placeholder pages
- Cookie consent popup
- 404 error page

### **Step 6: CF Pages Deployment (15 minutes)**
- Deploy to Cloudflare Pages
- Configure custom domain
- Test live deployment

---

## 🎯 **Key Features**

### **✅ Framework Features:**
- **Responsive design** - Works on all devices
- **Clean aesthetics** - Professional appearance
- **Configurable** - Easy to customize per IP
- **Fast loading** - Static pages + client-side data

### **✅ Authentication Flow:**
- **Login** → Dashboard redirect
- **Session persistence** - Stay logged in
- **Auto-logout** - Session expiry handling
- **Password reset** - Complete flow

### **✅ Dashboard Features:**
- **User info** - Name, avatar, dropdown
- **Projects overview** - Cards or list view
- **Activity feed** - Recent audit logs
- **Navigation** - Clean, intuitive

---

## 🚀 **Deployment Strategy**

### **Cloudflare Pages Setup:**
```bash
# 1. Connect GitHub repo
# 2. Build settings: None (static files)
# 3. Custom domain: nimbus.yourdomain.com
# 4. Environment variables: None needed (client-side config)
```

### **File Organization:**
```
Repo: /www/ folder
Deploy: Entire /www/ folder to CF Pages
Domain: Custom domain mapping
SSL: Automatic via CF
```

**This gives you a professional, reusable framework that can be styled per IP and deployed quickly!**

**Ready to start building this clean, polished framework?** 🎯
