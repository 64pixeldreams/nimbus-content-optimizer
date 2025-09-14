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
    
    // Load existing session and user from localStorage
    this.session = localStorage.getItem(this.config.sessionKey);
    this.user = JSON.parse(localStorage.getItem(this.config.userKey) || 'null');
    this.initialized = true;
    
    // Debug session loading
    console.log('CFramework init - Loading session:', {
      sessionKey: this.config.sessionKey,
      userKey: this.config.userKey,
      sessionFromStorage: this.session,
      userFromStorage: this.user,
      localStorageKeys: Object.keys(localStorage),
      localStorageLength: localStorage.length
    });
    
    // Check each localStorage item
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      console.log(`localStorage[${key}] = ${localStorage.getItem(key)?.substring(0, 50)}...`);
    }
    
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
        // Store session manually for cross-domain requests
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
        return result;
      } else {
        // Login failed
        const errorMessage = result.error?.message || 'Login failed';
        this._log('Login failed', { error: errorMessage });
        throw new Error(errorMessage);
      }
      
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
      
      
      // Hybrid approach: Try cookie first, fallback to manual header
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add session token as custom header (browsers allow custom headers)
      if (this.session && this.session !== 'browser-cookie') {
        headers['X-Session-Token'] = this.session;
      }
      
      const response = await fetch(`${this.config.serverUrl}/api/function`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action, payload })
        // Remove credentials: 'include' for manual cookie handling
      });
      
      
      const result = await response.json();
      
      // Handle auth errors (DON'T clear session automatically)
      if (result.error?.code === 'AUTHENTICATION_ERROR') {
        this._log('Authentication failed', { action });
        throw new Error('Authentication failed: ' + (result.error?.message || 'Session invalid'));
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
    
    // Use page.logs action (standard across apps)
    const result = await this.run('page.logs', payload);
    
    // Get business logs from data.logs, not framework logs from result.logs
    return result.data?.logs || result.logs || [];
  }
  
  /**
   * User info
   */
  isAuthenticated() {
    const hasSession = !!this.session;
    const hasUser = !!this.user;
    return hasSession && hasUser;
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
  
  /**
   * Smart Notification System with Caching
   */
  
  /**
   * Analytics API - Universal chart rendering and metrics
   */
  renderAnalyticsChart = async (containerId, functionName, params = {}, chartOptions = {}) => {
    try {
      console.log(`📊 Loading chart data: ${functionName}`, params);
      
      // Call CloudFunction to get data
      const response = await cf.call(functionName, params);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load chart data');
      }

      // Render chart using ChartFramework
      if (window.ChartFramework) {
        const chart = await window.ChartFramework.renderChart(
          containerId, 
          response.data, 
          chartOptions
        );
        
        console.log(`✅ Chart rendered: ${containerId}`);
        return chart;
      } else {
        console.error('ChartFramework not loaded');
        return null;
      }
      
    } catch (error) {
      console.error(`❌ Chart render failed: ${containerId}`, error);
      
      // Show error in container
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = `
          <div class="text-center text-muted p-2">
            <i class="fas fa-exclamation-triangle"></i>
            <br><small>Chart failed to load</small>
          </div>
        `;
      }
      return null;
    }
  };

  renderAnalyticsSparkline = async (containerId, functionName, params = {}, color = '#007bff') => {
    try {
      console.log(`✨ Loading sparkline data: ${functionName}`, params);
      
      const response = await cf.call(functionName, params);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load sparkline data');
      }

      // Extract simple data array from chart data
      const data = response.data?.datasets?.[0]?.data || [];
      
      if (window.ChartFramework) {
        return await window.ChartFramework.renderSparkline(containerId, data, color);
      } else {
        console.error('ChartFramework not loaded');
        return null;
      }
      
    } catch (error) {
      console.error(`❌ Sparkline render failed: ${containerId}`, error);
      return null;
    }
  };

  getAnalyticsSummary = async (category, filters = {}, timeRange = '24h') => {
    try {
      const response = await cf.call('analytics.summary', {
        category,
        ...filters,
        timeRange
      });
      
      return response.success ? response.data : { total: 0, by_status: {} };
    } catch (error) {
      console.error('Analytics summary failed', error);
      return { total: 0, by_status: {} };
    }
  };

  // Smart Notification Cache with Intent System
  _notificationCache = {
    data: null,
    lastFetch: 0,
    storageKey: null,
    
    // Default intervals
    defaultInterval: 5 * 60 * 1000,  // 5 minutes default
    fastInterval: 30 * 1000,         // 30 seconds when expecting notifications
    
    // Intent management
    intents: new Map(),              // Active intents: Map<intentName, intentConfig>
    intentStorageKey: null,          // localStorage key for intents
    intentCheckTimer: null,          // Timer for checking notifications during intents
    
    // Current effective interval (calculated from active intents)
    currentInterval: 5 * 60 * 1000
  };
  
  _initNotificationCache() {
    if (!this._notificationCache.storageKey) {
      this._notificationCache.storageKey = `${this.config.appName}_notifications`;
      this._notificationCache.intentStorageKey = `${this.config.appName}_notification_intents`;
    }
    
    // Load notification cache from localStorage
    try {
      const cached = localStorage.getItem(this._notificationCache.storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && (Date.now() - parsed.timestamp) < this._notificationCache.defaultInterval) {
          this._notificationCache.data = parsed.data;
          this._notificationCache.lastFetch = parsed.timestamp;
          this._log('Loaded notifications from cache', { count: parsed.data?.length || 0 });
        }
      }
    } catch (error) {
      this._log('Failed to load notification cache', { error: error.message });
    }
    
    // Load and restore active intents from localStorage
    this._loadIntentsFromStorage();
    
    // Calculate current interval based on active intents
    this._updateCurrentInterval();
    
    // Start intent checking if we have active intents
    if (this._notificationCache.intents.size > 0) {
      this._startIntentChecking();
    }
  }
  
  async listNotifications(limit = 20, forceRefresh = false) {
    // Initialize cache if needed
    if (!this._notificationCache.storageKey) {
      this._initNotificationCache();
    }
    
    const now = Date.now();
    const timeSinceLastFetch = now - this._notificationCache.lastFetch;
    const shouldRefresh = forceRefresh || 
                         !this._notificationCache.data || 
                         timeSinceLastFetch > this._notificationCache.currentInterval;
    
    if (!shouldRefresh) {
      this._log('Using cached notifications', { 
        age: Math.round(timeSinceLastFetch / 1000) + 's',
        count: this._notificationCache.data?.length || 0 
      });
      return {
        success: true,
        data: {
          notifications: this._notificationCache.data || [],
          count: this._notificationCache.data?.length || 0,
          fromCache: true
        }
      };
    }
    
    // Fetch fresh data
    this._log('Fetching fresh notifications', { 
      reason: forceRefresh ? 'forced' : 'expired',
      age: Math.round(timeSinceLastFetch / 1000) + 's'
    });
    
    try {
      const result = await this.run('notification.list', { limit });
      
      if (result.success && result.data) {
        // Update cache
        this._notificationCache.data = result.data.notifications || [];
        this._notificationCache.lastFetch = now;
        
        // Save to localStorage
        try {
          localStorage.setItem(this._notificationCache.storageKey, JSON.stringify({
            data: this._notificationCache.data,
            timestamp: now
          }));
        } catch (error) {
          this._log('Failed to save notification cache', { error: error.message });
        }
        
        this._log('Notification cache updated', { 
          count: this._notificationCache.data.length,
          fresh: true 
        });
      }
      
      return result;
    } catch (error) {
      // Return cached data if available, even if stale
      if (this._notificationCache.data) {
        this._log('API failed, using stale cache', { error: error.message });
        return {
          success: true,
          data: {
            notifications: this._notificationCache.data,
            count: this._notificationCache.data.length,
            fromCache: true,
            stale: true
          }
        };
      }
      throw error;
    }
  }
  
  async markNotificationSeen(notificationId) {
    try {
      const result = await this.run('notification.mark_seen', { notification_id: notificationId });
      
      if (result.success) {
        // Update cache immediately - remove the seen notification
        if (this._notificationCache.data) {
          this._notificationCache.data = this._notificationCache.data.filter(
            n => n.notification_id !== notificationId
          );
          
          // Update localStorage
          try {
            localStorage.setItem(this._notificationCache.storageKey, JSON.stringify({
              data: this._notificationCache.data,
              timestamp: this._notificationCache.lastFetch
            }));
          } catch (error) {
            this._log('Failed to update notification cache after mark seen', { error: error.message });
          }
          
          this._log('Notification marked as seen and removed from cache', { 
            notificationId,
            remaining: this._notificationCache.data.length 
          });
          
          // Check if this notification fulfills any intents and clear them
          this._checkIntentFulfillment(notificationId);
        }
      }
      
      return result;
    } catch (error) {
      this._log('Failed to mark notification as seen', { notificationId, error: error.message });
      throw error;
    }
  }
  
  async createNotification(data) {
    const result = await this.run('notification.create', data);
    
    // Invalidate cache when new notification is created
    if (result.success) {
      this._notificationCache.data = null;
      this._notificationCache.lastFetch = 0;
      try {
        localStorage.removeItem(this._notificationCache.storageKey);
        this._log('Notification cache cleared from localStorage');
      } catch (error) {
        this._log('Failed to clear notification cache', { error: error.message });
      }
      this._log('Notification cache invalidated after creation');
    }
    
    return result;
  }
  
  /**
   * Simple notification helper - creates a basic notification for current user
   * @param {string} message - Notification message
   * @param {string} title - Optional title (defaults to "Notification")
   * @param {string} type - Optional type (defaults to "info")
   */
  async notify(message, title = "Notification", type = "info") {
    return await this.createNotification({
      type: type,
      title: title,
      message: message,
      action_url: window.location.pathname || '/app/dashboard.html',
      metadata: {
        source: 'cf.notify',
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // Utility method to force refresh notifications
  async refreshNotifications(limit = 10) {
    return await this.listNotifications(limit, true);
  }

  // Centralized notification rendering methods
  renderNotifications(notifications, containerId = 'notifications-list') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Update header first
    this.updateNotificationHeader(notifications);
    
    if (notifications.length === 0) {
      container.innerHTML = `
        <div class="list-group-item text-center py-3">
          <div class="text-muted">No notifications yet</div>
          <small class="text-muted">You'll see updates here when things happen</small>
        </div>
      `;
      return;
    }

    // Limit dropdown to 5 notifications, but show total count
    const displayNotifications = notifications.slice(0, 5);
    const totalCount = notifications.length;
    
    container.innerHTML = displayNotifications.map(notification => {
      const timeAgo = this.formatTimeAgo(notification.created_at);
      const iconClass = this.getNotificationIcon(notification.type);
      const isUnread = !notification.seen;
      
      return `
        <div class="list-group-item ${isUnread ? 'bg-light' : ''}" style="cursor: pointer;" onclick="cf.markNotificationSeen('${notification.notification_id}')">
          <div class="row g-0 align-items-center">
            <div class="col-2">
              <i class="${iconClass}" data-feather="bell"></i>
            </div>
            <div class="col-10">
              <div class="text-dark fw-bold">${notification.title || 'Notification'}</div>
              <div class="text-muted small mt-1">${notification.message}</div>
              <div class="text-muted small">${timeAgo}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Re-initialize feather icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }

  updateNotificationCount(notifications, countElementId = 'notification-count') {
    const countElement = document.getElementById(countElementId);
    if (!countElement) return;
    
    const unreadCount = notifications.filter(n => !n.seen).length;
    
    if (unreadCount > 0) {
      countElement.textContent = unreadCount;
      countElement.style.display = 'block';
    } else {
      countElement.style.display = 'none';
    }
  }

  updateNotificationHeader(notifications, headerId = 'notifications-header') {
    const header = document.getElementById(headerId);
    if (!header) return;
    
    const unreadCount = notifications.filter(n => !n.seen).length;
    const totalCount = notifications.length;
    
    if (unreadCount > 0) {
      header.innerHTML = `${unreadCount} New Notification${unreadCount === 1 ? '' : 's'} (${totalCount} total)`;
    } else {
      header.innerHTML = `No new notifications (${totalCount} total)`;
    }
  }

  showNotificationError(containerId = 'notifications-list', headerId = 'notifications-header') {
    const header = document.getElementById(headerId);
    const container = document.getElementById(containerId);
    
    if (header) header.innerHTML = 'Error loading notifications';
    if (container) {
      container.innerHTML = `
        <div class="list-group-item text-center py-3">
          <div class="text-danger">Failed to load notifications</div>
          <small class="text-muted">Please try refreshing the page</small>
        </div>
      `;
    }
  }

  formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  getNotificationIcon(type) {
    const icons = {
      success: 'text-success',
      error: 'text-danger',
      warning: 'text-warning',
      info: 'text-info'
    };
    return icons[type] || 'text-primary';
  }
  
  // Get cached notification count without API call
  getCachedNotificationCount() {
    return this._notificationCache.data?.length || 0;
  }

  // Simple method for pages to load and render notifications
  async loadAndRenderNotifications(forceRefresh = false) {
    try {
      const result = await this.listNotifications(20, forceRefresh);
      
      if (result.success && result.data) {
        const notifications = result.data.notifications || [];
        this.renderNotifications(notifications);
        this.updateNotificationCount(notifications);
        return { success: true, notifications };
      } else {
        this.showNotificationError();
        return { success: false, error: result.error };
      }
    } catch (error) {
      this.showNotificationError();
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Intent-Based Notification Management
   * Allows apps to set expectations for notifications, adjusting check frequency
   */
  
  /**
   * Set a notification intent - tells the system to check more frequently
   * @param {string} intentName - Unique name for this intent (e.g., 'file_upload', 'batch_process')
   * @param {number} duration - How long to maintain this intent (milliseconds)
   * @param {number} checkInterval - How often to check during this intent (milliseconds, optional)
   */
  setNotificationIntent(intentName, duration, checkInterval = null) {
    if (!intentName || !duration) {
      throw new Error('Intent name and duration are required');
    }
    
    // Initialize cache if needed
    if (!this._notificationCache.storageKey) {
      this._initNotificationCache();
    }
    
    const now = Date.now();
    const intent = {
      name: intentName,
      createdAt: now,
      expiresAt: now + duration,
      checkInterval: checkInterval || this._notificationCache.fastInterval,
      duration: duration
    };
    
    // Store intent
    this._notificationCache.intents.set(intentName, intent);
    
    // Save to localStorage
    this._saveIntentsToStorage();
    
    // Update current interval
    this._updateCurrentInterval();
    
    // Start or restart intent checking
    this._startIntentChecking();
    
    this._log('Notification intent set', { 
      intent: intentName, 
      duration: Math.round(duration / 1000) + 's',
      checkInterval: Math.round(intent.checkInterval / 1000) + 's',
      activeIntents: this._notificationCache.intents.size,
      currentInterval: Math.round(this._notificationCache.currentInterval / 1000) + 's'
    });
  }
  
  /**
   * Clear a specific notification intent
   * @param {string} intentName - Name of intent to clear
   */
  clearNotificationIntent(intentName) {
    if (this._notificationCache.intents.has(intentName)) {
      this._notificationCache.intents.delete(intentName);
      this._saveIntentsToStorage();
      this._updateCurrentInterval();
      
      this._log('Notification intent cleared', { 
        intent: intentName,
        remainingIntents: this._notificationCache.intents.size
      });
      
      // Stop checking if no more intents
      if (this._notificationCache.intents.size === 0) {
        this._stopIntentChecking();
      }
    }
  }
  
  /**
   * Clear all notification intents
   */
  clearAllNotificationIntents() {
    const count = this._notificationCache.intents.size;
    this._notificationCache.intents.clear();
    this._saveIntentsToStorage();
    this._updateCurrentInterval();
    this._stopIntentChecking();
    
    this._log('All notification intents cleared', { clearedCount: count });
  }
  
  /**
   * Get currently active intents
   * @returns {Array} Array of active intent objects
   */
  getActiveIntents() {
    const now = Date.now();
    const active = [];
    
    for (const [name, intent] of this._notificationCache.intents) {
      if (intent.expiresAt > now) {
        active.push({
          name: intent.name,
          timeRemaining: intent.expiresAt - now,
          checkInterval: intent.checkInterval,
          createdAt: intent.createdAt
        });
      }
    }
    
    return active;
  }
  
  /**
   * Internal Intent Management Methods
   */
  
  _loadIntentsFromStorage() {
    try {
      const stored = localStorage.getItem(this._notificationCache.intentStorageKey);
      if (stored) {
        const intents = JSON.parse(stored);
        const now = Date.now();
        let loadedCount = 0;
        
        // Restore non-expired intents
        for (const [name, intent] of Object.entries(intents)) {
          if (intent.expiresAt > now) {
            this._notificationCache.intents.set(name, intent);
            loadedCount++;
          }
        }
        
        if (loadedCount > 0) {
          this._log('Loaded notification intents from storage', { count: loadedCount });
        }
      }
    } catch (error) {
      this._log('Failed to load notification intents from storage', { error: error.message });
    }
  }
  
  _saveIntentsToStorage() {
    try {
      const intentsObj = {};
      for (const [name, intent] of this._notificationCache.intents) {
        intentsObj[name] = intent;
      }
      localStorage.setItem(this._notificationCache.intentStorageKey, JSON.stringify(intentsObj));
    } catch (error) {
      this._log('Failed to save notification intents to storage', { error: error.message });
    }
  }
  
  _updateCurrentInterval() {
    const now = Date.now();
    let fastestInterval = this._notificationCache.defaultInterval;
    
    // Find the fastest check interval from active intents
    for (const [name, intent] of this._notificationCache.intents) {
      if (intent.expiresAt > now && intent.checkInterval < fastestInterval) {
        fastestInterval = intent.checkInterval;
      }
    }
    
    this._notificationCache.currentInterval = fastestInterval;
    
    this._log('Updated notification check interval', { 
      interval: Math.round(fastestInterval / 1000) + 's',
      activeIntents: this._notificationCache.intents.size
    });
  }
  
  _startIntentChecking() {
    // Clear existing timer
    this._stopIntentChecking();
    
    // Start new timer with current interval (use actual interval, not capped at 60s)
    this._notificationCache.intentCheckTimer = setInterval(() => {
      this._checkIntentExpiration();
    }, this._notificationCache.currentInterval);
    
    this._log('Started intent-based notification checking', { 
      interval: Math.round(this._notificationCache.currentInterval / 1000) + 's'
    });
  }
  
  _stopIntentChecking() {
    if (this._notificationCache.intentCheckTimer) {
      clearInterval(this._notificationCache.intentCheckTimer);
      this._notificationCache.intentCheckTimer = null;
      this._log('Stopped intent-based notification checking');
    }
  }
  
  _checkIntentExpiration() {
    const now = Date.now();
    let expiredCount = 0;
    
    this._log('Intent check triggered', { 
      activeIntents: this._notificationCache.intents.size,
      timestamp: new Date().toISOString()
    });
    
    // Remove expired intents
    for (const [name, intent] of this._notificationCache.intents) {
      if (intent.expiresAt <= now) {
        this._notificationCache.intents.delete(name);
        expiredCount++;
        this._log('Notification intent expired', { intent: name });
      }
    }
    
    if (expiredCount > 0) {
      this._saveIntentsToStorage();
      this._updateCurrentInterval();
      
      // Stop checking if no more intents
      if (this._notificationCache.intents.size === 0) {
        this._stopIntentChecking();
        this._log('All intents expired, returning to normal checking');
      }
    }
    
    // Trigger notification check if we have active intents
    if (this._notificationCache.intents.size > 0) {
      this._log('Triggering intent-based notification check');
      this.listNotifications(20, true).catch(error => {
        this._log('Intent-based notification check failed - clearing cache', { error: error.message });
        // Clear cache on failure so next reload will fetch fresh data
        this._notificationCache.data = null;
        this._notificationCache.lastFetch = 0;
        if (this._notificationCache.storageKey) {
          localStorage.removeItem(this._notificationCache.storageKey);
        }
      });
    }
  }
  
  _checkIntentFulfillment(notificationId) {
    // This is where apps can customize intent clearing logic
    // For now, we'll implement basic type-based clearing
    
    // Get the notification that was just seen
    const seenNotification = this._notificationCache.data?.find(n => n.notification_id === notificationId);
    if (!seenNotification) return;
    
    const notificationType = seenNotification.type;
    let clearedIntents = [];
    
    // Basic intent clearing based on notification type
    // Apps can override this logic by calling clearNotificationIntent() manually
    for (const [intentName, intent] of this._notificationCache.intents) {
      let shouldClear = false;
      
      // Simple matching: if notification type contains intent name or vice versa
      if (notificationType.includes(intentName) || intentName.includes(notificationType)) {
        shouldClear = true;
      }
      
      // Common patterns
      if (notificationType === 'batch_upload_complete' && intentName.includes('upload')) {
        shouldClear = true;
      }
      if (notificationType === 'processing_complete' && intentName.includes('process')) {
        shouldClear = true;
      }
      
      if (shouldClear) {
        clearedIntents.push(intentName);
      }
    }
    
    // Clear matched intents
    clearedIntents.forEach(intentName => {
      this.clearNotificationIntent(intentName);
    });
    
    if (clearedIntents.length > 0) {
      this._log('Intents cleared due to notification fulfillment', { 
        notificationType,
        clearedIntents 
      });
    }
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