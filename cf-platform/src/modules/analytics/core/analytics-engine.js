/**
 * Analytics Engine - Universal metrics tracking and querying
 * 
 * Features:
 * - Generic event tracking for any entity type
 * - Time-series data with automatic bucketing
 * - Chart.js compatible data output
 * - Reusable across NimbusAI, AIVERIE, and future projects
 */

export class AnalyticsEngine {
  constructor(env, logger) {
    this.engine = env.ANALYTICS_DATA;
    this.logger = logger;
    this.env = env;
  }

  /**
   * Execute a SQL query against Cloudflare Analytics Engine HTTP API
   * Returns a normalized object: { data: [...], meta?: {...} }
   */
  async executeSql(query) {
    const accountId = this.env.ACCOUNT_ID;
    const apiToken = this.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      this.logger?.warn('Missing ACCOUNT_ID or CLOUDFLARE_API_TOKEN for Analytics Engine SQL');
      return { data: [] };
    }

    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/text'
      },
      body: query
    });

    const responseText = await response.text();
    let json;
    try {
      json = JSON.parse(responseText);
    } catch (err) {
      this.logger?.error('AnalyticsEngine.executeSql: JSON parse failed', { message: err.message, responsePreview: responseText.substring(0, 200) });
      throw new Error('Failed to parse Analytics Engine response');
    }

    if (json.errors && json.errors.length > 0) {
      const message = json.errors?.[0]?.message || 'Analytics Engine SQL error';
      this.logger?.error('AnalyticsEngine.executeSql: API returned errors', { errors: json.errors, messages: json.messages });
      throw new Error(message);
    }

    const data = json.result?.data || json.data || [];
    const meta = json.result?.meta || json.meta;
    return { data, meta };
  }

  /**
   * Track a generic event
   * @param {string} category - Event category (pages, reports, users, etc.)
   * @param {string} action - Action taken (uploaded, processed, created, etc.)
   * @param {string} entityId - ID of the entity
   * @param {string} userId - User who performed the action
   * @param {object} metadata - Additional data (status, project_id, etc.)
   */
  async trackEvent(category, action, entityId, userId, metadata = {}) {
    try {
      const eventType = `${category}_${action}`;
      
      // Write to Analytics Engine (no await needed - background write)
      this.engine.writeDataPoint({
        // Use blobs for categorical data (strings)
        blobs: [
          eventType,                    // blob1: 'pages_uploaded', 'pages_completed'
          metadata.project_id || '',    // blob2: project/workspace ID
          userId || '',                 // blob3: user ID  
          metadata.status || 'created', // blob4: status (created, processing, completed)
          metadata.type || ''           // blob5: entity type/subtype
        ].filter(Boolean),
        
        // Use doubles for numeric metrics
        doubles: [
          1,                           // double1: event count
          metadata.duration || 0,      // double2: processing time (ms)
          metadata.size || 0           // double3: file size, token count, etc.
        ],
        
        // Use indexes for efficient querying by ID
        indexes: [entityId]
      });

      this.logger?.log('Analytics event tracked to dataset', {
        eventType, 
        category, 
        action, 
        entityId, 
        userId,
        status: metadata.status || 'created',
        project_id: metadata.project_id
      });

    } catch (error) {
      this.logger?.error('Analytics tracking failed', {
        category, action, entityId, error: error.message
      });
      // Don't throw - analytics failures shouldn't break main functionality
    }
  }

  /**
   * Get metrics for charts
   * @param {string} category - Event category to query
   * @param {object} filters - Filtering options
   * @param {string} timeRange - Time range (24h, 7d, 30d)
   * @returns {object} Chart.js compatible data structure
   */
  async getMetrics(category, filters = {}, timeRange = '24h') {
    try {
      this.logger?.log('Analytics metrics requested', {
        category, filters, timeRange
      });
      
      // Build SQL query for Analytics Engine (NEW CLEAN STRUCTURE)
      // blob1 = entity type, blob2 = action, blob3 = project_id, blob4 = status
      let query = `
        SELECT 
          toStartOfInterval(timestamp, INTERVAL '1' HOUR) as time_bucket,
          blob4 as status,
          SUM(_sample_interval * double1) as count
        FROM nimbus_events_tracking 
        WHERE blob1 = '${category}'
          AND timestamp >= NOW() - INTERVAL '1' DAY
      `;

      // Add filters for the new structure
      if (filters.project_id) {
        // Project ID is now clean in blob3 (no prefix)
        const cleanProjectId = filters.project_id.startsWith('project:') 
          ? filters.project_id.substring(8) 
          : filters.project_id;
        query += ` AND blob3 = '${cleanProjectId}'`;
      }
      if (filters.action) {
        // Action filter (uploaded, updated, completed, failed)
        query += ` AND blob2 = '${filters.action}'`;
      }
      if (filters.status) {
        // Status filter (processing, completed, failed)
        query += ` AND blob4 = '${filters.status}'`;
      }

      query += `
        GROUP BY time_bucket, status
        ORDER BY time_bucket
      `;

      this.logger?.log('Analytics Engine SQL query', { query });

      // Execute query using centralized SQL executor
      let result;
      try {
        result = await this.executeSql(query);
        this.logger?.log('Analytics Engine query SUCCESS', {
          rows: result?.data?.length || 0
        });
      } catch (sqlError) {
        this.logger?.error('Analytics Engine SQL failed', {
          error: sqlError.message,
          query: query.substring(0, 200) + '...'
        });
        throw sqlError;
      }

      return this._formatChartData(result?.data || [], timeRange);

    } catch (error) {
      this.logger?.error('Analytics query failed', {
        category, filters, timeRange, error: error.message
      });
      
      // Return zeros as fallback
      const zeroData = Array(24).fill(0);
      
      return {
        labels: Array.from({length: 24}, (_, i) => `${i}:00`),
        datasets: [{
          data: zeroData,
          borderColor: '#007bff'
        }]
      };
    }
  }

  /**
   * Get summary stats for dashboard cards
   * @param {string} category - Event category
   * @param {object} filters - Filtering options
   * @param {string} timeRange - Time range for trends
   * @returns {object} Summary statistics
   */
  async getSummaryStats(category, filters = {}, timeRange = '24h') {
    try {
      const hours = this._parseTimeRange(timeRange);
      
      // NEW CLEAN STRUCTURE: blob1 = entity, blob2 = action, blob3 = project_id, blob4 = status
      let query = `
        SELECT 
          blob2 as action,
          blob4 as status,
          count(*) as total_events,
          sum(double1) as total_count,
          avg(double2) as avg_size
        FROM nimbus_events_tracking 
        WHERE blob1 = '${category}'
          AND timestamp >= now() - interval ${hours} hour
      `;

      // Add filters for new structure
      if (filters.project_id) {
        const cleanProjectId = filters.project_id.startsWith('project:') 
          ? filters.project_id.substring(8) 
          : filters.project_id;
        query += ` AND blob3 = '${cleanProjectId}'`;
      }
      if (filters.action) {
        query += ` AND blob2 = '${filters.action}'`;
      }

      query += ` GROUP BY action, status`;

      const result = await this.executeSql(query);
      return this._formatSummaryStats(result?.data || []);

    } catch (error) {
      this.logger?.error('Analytics summary query failed', {
        category, filters, error: error.message
      });
      
      return { total: 0, by_status: {} };
    }
  }

  // Helper methods
  _parseTimeRange(timeRange) {
    const ranges = {
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30
    };
    return ranges[timeRange] || 24;
  }

  _getTimeInterval(timeRange) {
    const intervals = {
      '24h': 'toStartOfHour(timestamp)',
      '7d': 'toStartOfDay(timestamp)', 
      '30d': 'toStartOfDay(timestamp)'
    };
    return intervals[timeRange] || 'toStartOfHour(timestamp)';
  }

  _formatChartData(results, timeRange) {
    // Handle Analytics Engine response format
    if (!results || !Array.isArray(results)) {
      this.logger?.warn('No Analytics Engine data, returning zeros');
      
      // Return zeros - no confusing random data
      const zeroData = Array(24).fill(0);
      
      return {
        labels: Array.from({length: 24}, (_, i) => `${i}:00`),
        datasets: [{
          data: zeroData,
          borderColor: '#007bff'
        }]
      };
    }

    // Process real Analytics Engine data
    const hourlyData = new Array(24).fill(0);
    
    results.forEach(row => {
      if (row.time_bucket && row.count) {
        const hour = new Date(row.time_bucket).getHours();
        hourlyData[hour] = parseInt(row.count) || 0; // Use actual count, zero if none
      }
    });

    // Use actual data (zeros if no activity)
    const visibleData = hourlyData;

    return {
      labels: Array.from({length: 24}, (_, i) => `${i}:00`),
      datasets: [{
        data: visibleData,
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.1)'
      }]
    };
  }

  _formatSummaryStats(results) {
    const summary = {
      total: 0,
      by_status: {}
    };

    results.forEach(row => {
      const status = row.status || 'unknown';
      const count = parseInt(row.total_count) || 0;
      
      summary.total += count;
      summary.by_status[status] = {
        count,
        avg_duration: parseFloat(row.avg_duration) || 0
      };
    });

    return summary;
  }

  _getStatusColor(status, alpha = 1) {
    const colors = {
      created: `rgba(0, 123, 255, ${alpha})`,      // Blue
      processing: `rgba(255, 193, 7, ${alpha})`,   // Yellow  
      complete: `rgba(40, 167, 69, ${alpha})`,     // Green
      error: `rgba(220, 53, 69, ${alpha})`,        // Red
      unknown: `rgba(108, 117, 125, ${alpha})`     // Gray
    };
    
    return colors[status] || colors.unknown;
  }
}
