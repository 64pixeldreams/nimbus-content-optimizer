/**
 * CFramework - Universal CloudFunction Client
 * Standalone, configurable, testable
 */

class CFramework {
  constructor() {
    this.config = null;
    this.session = null;
    this.user = null;
    this.initialized = false;
  }
  
  /**
   * Initialize framework
   * @param {Object} config - Configuration object
   * @param {string} config.serverUrl - CloudFunction server URL
   * @param {string} config.appName - App name for session keys
   * @param {boolean} config.debug - Enable debug logging
   */
  init(config) {
    this.config = {
      serverUrl: config.serverUrl,
      appName: config.appName || 'app',
      debug: config.debug || false,
      sessionKey: `${config.appName || 'app'}_session`,
      userKey: `${config.appName || 'app'}_user`,
      retryAttempts: 3,
      requestTimeout: 30000
    };
    
    // Load existing session
    this.session = localStorage.getItem(this.config.sessionKey);
    this.user = JSON.parse(localStorage.getItem(this.config.userKey) || 'null');
    this.initialized = true;
    
    this._log('CFramework initialized', {
      serverUrl: this.config.serverUrl,
      appName: this.config.appName,
      hasSession: !!this.session,
      hasUser: !!this.user
    });
    
    return this;
  }
  
  /**
   * Check if framework is initialized
   */
  _checkInit() {
    if (!this.initialized) {
      throw new Error('CFramework not initialized. Call cf.init() first.');
    }
  }
  
  /**
   * Authentication
   */
  async login(email, password) {
    this._checkInit();
    
    try {
      const response = await fetch(`${this.config.serverUrl}/auth/login`, {
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
    this._checkInit();
    
    try {
      if (this.session) {
        await fetch(`${this.config.serverUrl}/auth/logout`, {
          method: 'POST',
          headers: { 'Cookie': `nimbus_session=${this.session}` }
        });
      }
    } catch (error) {
      this._log('Logout API failed', error);
    } finally {
      this._clearSession();
    }
  }
  
  /**
   * CloudFunction runner
   */
  async run(action, payload = {}) {
    this._checkInit();
    
    if (!this.session) {
      throw new Error('Not authenticated - call cf.login() first');
    }
    
    try {
      this._log(`Running CloudFunction: ${action}`, { action, payload });
      
      const response = await fetch(`${this.config.serverUrl}/api/function`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `nimbus_session=${this.session}`
        },
        body: JSON.stringify({ action, payload })
      });
      
      const result = await response.json();
      
      // Handle auth errors
      if (result.error?.code === 'AUTHENTICATION_ERROR') {
        this._log('Session expired', { action });
        this._clearSession();
        throw new Error('Session expired - please login again');
      }
      
      this._log(`CloudFunction ${action} completed`, { 
        success: result.success,
        duration: result.duration
      });
      
      return result;
      
    } catch (error) {
      this._log(`CloudFunction ${action} failed`, error);
      throw error;
    }
  }
  
  /**
   * Generic logs (works for any app)
   */
  async getLogs(type, entityId = null, limit = 50) {
    const payload = { type, limit };
    if (entityId) payload.entity_id = entityId;
    
    // Generic log action - each app can implement their own
    const logAction = `${this.config.appName}.logs` || 'logs';
    const result = await this.run(logAction, payload);
    
    // Get business logs from data.logs, not framework logs from result.logs
    return result.data?.logs || result.logs || [];
  }
  
  /**
   * User info
   */
  isAuthenticated() {
    return !!(this.session && this.user);
  }
  
  getUser() {
    return this.user;
  }
  
  getUserName() {
    return this.user?.name || this.user?.email?.split('@')[0] || 'User';
  }
  
  /**
   * Session management
   */
  _clearSession() {
    this.session = null;
    this.user = null;
    if (this.config) {
      localStorage.removeItem(this.config.sessionKey);
      localStorage.removeItem(this.config.userKey);
    }
  }
  
  /**
   * Utilities
   */
  formatDate(dateString) {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  }
  
  formatRelativeTime(dateString) {
    if (!dateString) return 'Never';
    const diff = Date.now() - new Date(dateString);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
  
  formatStatus(status) {
    const statusMap = {
      'pending': { class: 'warning', icon: '⏳', text: 'Pending' },
      'processing': { class: 'info', icon: '⚡', text: 'Processing' },
      'completed': { class: 'success', icon: '✅', text: 'Completed' },
      'failed': { class: 'danger', icon: '❌', text: 'Failed' },
      'active': { class: 'success', icon: '🟢', text: 'Active' }
    };
    
    return statusMap[status] || { class: 'secondary', icon: '❓', text: status };
  }
  
  /**
   * Cookie consent utilities
   */
  showCookieConsent() {
    if (!localStorage.getItem('cookies-accepted')) {
      const consent = document.getElementById('cookie-consent');
      if (consent) consent.classList.add('show');
    }
  }
  
  acceptCookies() {
    localStorage.setItem('cookies-accepted', 'true');
    const consent = document.getElementById('cookie-consent');
    if (consent) consent.classList.remove('show');
  }
  
  rejectCookies() {
    localStorage.setItem('cookies-accepted', 'false');
    const consent = document.getElementById('cookie-consent');
    if (consent) consent.classList.remove('show');
  }
  
  /**
   * Auto-redirect utilities
   */
  autoRedirect() {
    // Redirect to dashboard if logged in and on auth page
    if (this.isAuthenticated() && window.location.pathname.includes('/auth/')) {
      window.location.href = '/app/dashboard.html';
    }
    
    // Redirect to login if not logged in and on app page
    if (!this.isAuthenticated() && window.location.pathname.includes('/app/')) {
      window.location.href = '/auth/login.html';
    }
  }
  
  /**
   * Debug logging
   */
  _log(message, data) {
    if (this.debug) {
      console.log(`[CFramework] ${new Date().toISOString()} ${message}`, data);
    }
  }
}

// Create global instance
window.cf = new CFramework();