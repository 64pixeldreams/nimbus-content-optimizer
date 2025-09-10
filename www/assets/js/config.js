/**
 * Platform Configuration
 * Configurable settings for each IP/platform
 */

const platformConfig = {
  // Platform Identity
  name: "NimbusAI",
  tagline: "AI-Powered Content Optimization",
  logo: "/assets/img/logo.png",
  domain: "dashboard.nimbus.dev", // Will be configured per deployment
  
  // API Configuration  
  apiUrl: "https://nimbus-platform.martin-598.workers.dev",
  
  // Branding Colors
  colors: {
    primary: "#2563eb",
    secondary: "#64748b",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444"
  },
  
  // Features
  features: {
    rememberDevice: true,
    cookieConsent: true,
    backgroundImage: null, // Optional: "/assets/img/auth-bg.jpg"
    showTagline: true
  },
  
  // Legal Pages
  links: {
    privacy: "/legal/privacy.html",
    terms: "/legal/terms.html",
    support: "mailto:support@nimbus.dev",
    mainSite: "https://nimbus.dev"
  },
  
  // Copyright
  copyright: {
    year: new Date().getFullYear(),
    company: "NimbusAI",
    text: "All rights reserved."
  }
};

// Apply platform colors to CSS variables
document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  root.style.setProperty('--framework-primary', platformConfig.colors.primary);
  root.style.setProperty('--framework-secondary', platformConfig.colors.secondary);
  root.style.setProperty('--framework-success', platformConfig.colors.success);
  root.style.setProperty('--framework-warning', platformConfig.colors.warning);
  root.style.setProperty('--framework-danger', platformConfig.colors.danger);
});

// Make config globally available
window.platformConfig = platformConfig;
