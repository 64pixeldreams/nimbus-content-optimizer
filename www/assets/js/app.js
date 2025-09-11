/**
 * Universal App Framework
 * Common functionality for all NimbusHQ pages
 */

class NimbusApp {
  constructor() {
    this.initialized = false;
    this.user = null;
  }

  async init() {
    if (this.initialized) return;
    
    console.log('🚀 NIMBUS APP: Initializing...');
    
    // Initialize CFramework
    cf.init({
      serverUrl: 'https://nimbus-platform.martin-598.workers.dev',
      appName: 'nimbus'
    });
    
    // Check authentication
    if (!cf.isAuthenticated()) {
      console.log('❌ NIMBUS APP: Not authenticated, redirecting...');
      window.location.href = '/auth/login.html';
      return;
    }
    
    // Load user data
    this.user = cf.getUser();
    const userName = cf.getUserName();
    const displayName = userName.length > 12 ? userName.substring(0, 12) + '...' : userName;
    
    // Update user name in any page
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      userNameElement.textContent = displayName;
    }
    
    // Update account title if on dashboard
    const accountTitleElement = document.getElementById('account-title');
    if (accountTitleElement) {
      const userEmail = this.user?.email || 'user@example.com';
      accountTitleElement.textContent = `${userEmail}'s account:`;
    }
    
    this.initialized = true;
    console.log('✅ NIMBUS APP: Initialized successfully');
  }

  async loadProject(projectId) {
    console.log('🔍 NIMBUS APP: Loading project:', projectId);
    
    try {
      const project = await nimbus.projects.get(projectId);
      console.log('✅ NIMBUS APP: Project loaded:', project);
      
      if (project) {
        // Update project title
        const projectTitleElement = document.querySelector('h1');
        if (projectTitleElement) {
          projectTitleElement.textContent = `${project.name}'s dashboard:`;
        }
        
        // Update sidebar project name
        const sidebarProjectElement = document.getElementById('sidebar-project-name');
        if (sidebarProjectElement) {
          sidebarProjectElement.textContent = project.name;
        }
        
        // Load pages
        const pages = await nimbus.pages.list(projectId);
        console.log('✅ NIMBUS APP: Pages loaded:', pages.length);
        
        // Update stats
        this.updateProjectStats(pages);
        
        return { project, pages };
      }
      
    } catch (error) {
      console.error('❌ NIMBUS APP: Failed to load project:', error);
      throw error;
    }
  }
  
  updateProjectStats(pages) {
    const totalPages = pages.length;
    const processingPages = pages.filter(p => p.status === 'processing').length;
    const completePages = pages.filter(p => p.status === 'complete' || p.status === 'optimized').length;
    
    const elements = {
      'project-pages-count': totalPages,
      'project-processing-count': processingPages,
      'project-complete-count': completePages
    };
    
    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    });
  }

  async handleLogout() {
    try {
      await cf.logout();
      window.location.href = '/auth/login.html';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}

// Create global app instance
window.nimbusApp = new NimbusApp();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.nimbusApp.init();
});


