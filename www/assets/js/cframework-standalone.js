/**
 * CFramework - Standalone Universal CloudFunction Client
 * Version: 1.0.0
 * 
 * Usage:
 *   <script src="/cdn/cframework.js"></script>
 *   <script>
 *     cf.init({
 *       apiUrl: 'https://nimbus-platform.martin-598.workers.dev',
 *       appName: 'nimbus'
 *     });
 *   </script>
 */

(function(global) {
  'use strict';
  
  class CFramework {
    constructor() {
      this.config = null;
      this.session = null;
      this.user = null;
      this.debug = false;
    }
    
    /**
     * Initialize framework with configuration
     */
    init(config) {
      this.config = {
        apiUrl: config.apiUrl || window.location.origin,
        appName: config.appName || 'app',
        sessionKey: config.sessionKey || `${config.appName || 'app'}_session`,
        userKey: config.userKey || `${config.appName || 'app'}_user`,
        debug: config.debug || false,
        retryAttempts: config.retryAttempts || 3,
        requestTimeout: config.requestTimeout || 30000
      };
      
      this.debug = this.config.debug;
      
      // Load existing session
      this.session = localStorage.getItem(this.config.sessionKey);
      this.user = JSON.parse(localStorage.getItem(this.config.userKey) || 'null');
      
      this._log('CFramework initialized', {
        apiUrl: this.config.apiUrl,
        appName: this.config.appName,
        hasSession: !!this.session
      });
      
      return this;
    }
    
    /**
     * Authentication methods
     */
    async login(email, password) {
      try {
        const response = await fetch(`${this.config.apiUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
          this.session = result.session_token;
          this.user = {
            user_id: result.userId,
            email: result.email,
            name: result.name || email.split('@')[0],
            expires: result.expires
          };
          
          localStorage.setItem(this.config.sessionKey, this.session);
          localStorage.setItem(this.config.userKey, JSON.stringify(this.user));
          
          this._log('Login successful', { email, userId: result.userId });
        }
        
        return result;
        
      } catch (error) {
        this._log('Login failed', error);
        throw error;
      }
    }
    
    async logout() {
      try {
        if (this.session) {
          await fetch(`${this.config.apiUrl}/auth/logout`, {
            method: 'POST',
            headers: { 'Cookie': `nimbus_session=${this.session}` }
          });
        }
      } catch (error) {
        this._log('Logout API failed', error);
      } finally {
        this.session = null;
        this.user = null;
        localStorage.removeItem(this.config.sessionKey);
        localStorage.removeItem(this.config.userKey);
      }
    }
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
      return !!(this.session && this.user);
    }
    
    /**
     * Get current user info
     */
    getUser() {
      return this.user;
    }
    
    /**
     * Run CloudFunction
     */
    async run(action, payload = {}) {
      if (!this.session) {
        throw new Error('Not authenticated');
      }
      
      let lastError;
      for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
        try {
          this._log(`CloudFunction ${action} - Attempt ${attempt}`, { action, attempt });
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout);
          
          const response = await fetch(`${this.config.apiUrl}/api/function`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': `nimbus_session=${this.session}`
            },
            body: JSON.stringify({ action, payload }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          
          // Handle auth errors
          if (result.error?.code === 'AUTHENTICATION_ERROR') {
            this._log('Session expired', { action });
            this.session = null;
            this.user = null;
            localStorage.removeItem(this.config.sessionKey);
            localStorage.removeItem(this.config.userKey);
            throw new Error('Session expired');
          }
          
          this._log(`CloudFunction ${action} - Success`, { success: result.success });
          return result;
          
        } catch (error) {
          lastError = error;
          this._log(`CloudFunction ${action} - Attempt ${attempt} failed`, { error: error.message });
          
          if (error.message.includes('Session expired') || attempt === this.config.retryAttempts) {
            break;
          }
          
          await this._sleep(1000 * attempt); // Simple backoff
        }
      }
      
      throw lastError;
    }
    
    /**
     * Convenience methods
     */
    async getProjects() {
      const result = await this.run('project.list');
      return result.data?.projects || result.projects || [];
    }
    
    async getPages(projectId) {
      const result = await this.run('page.list', { project_id: projectId });
      return result.data?.pages || result.pages || [];
    }
    
    async getLogs(type, entityId, limit = 50) {
      const payload = { type, limit };
      if (entityId) payload.entity_id = entityId;
      
      const result = await this.run('page.logs', payload);
      return result.logs || [];
    }
    
    async createPage(projectId, pageData) {
      const result = await this.run('page.create', { project_id: projectId, ...pageData });
      return result.data?.page || result.page;
    }
    
    /**
     * UI Helpers
     */
    showError(message) {
      console.error('[CFramework Error]', message);
      // Could show toast notification here
    }
    
    showSuccess(message) {
      console.log('[CFramework Success]', message);
      // Could show toast notification here
    }
    
    /**
     * Internal utilities
     */
    _sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    _log(message, data) {
      if (this.debug) {
        console.log(`[CFramework] ${message}`, data);
      }
    }
  }
  
  // Create global instance
  global.cf = new CFramework();
  
  // Auto-redirect helper
  global.requireAuth = function(redirectUrl = '/auth/login.html') {
    if (!cf.isAuthenticated()) {
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  };
  
})(window);

// Auto-redirect on page load
document.addEventListener('DOMContentLoaded', () => {
  // Only run if cf is initialized
  if (window.cf && window.cf.config) {
    // Auto-redirect to dashboard if logged in and on auth page
    if (cf.isAuthenticated() && window.location.pathname.includes('/auth/')) {
      window.location.href = '/app/dashboard.html';
    }
    
    // Auto-redirect to login if not logged in and on app page
    if (!cf.isAuthenticated() && window.location.pathname.includes('/app/')) {
      window.location.href = '/auth/login.html';
    }
  }
});
