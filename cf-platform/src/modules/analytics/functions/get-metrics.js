/**
 * Get Metrics CloudFunction
 * Returns chart-ready data for dashboard visualizations
 */

import { AnalyticsEngine } from '../core/analytics-engine.js';

export async function getMetrics(requestContext) {
  const { env, logger, payload, auth } = requestContext;
  
  try {
    const {
      category,
      project_id,
      user_id, 
      status,
      action,
      timeRange = '24h'
    } = payload;

    if (!category) {
      return {
        success: false,
        error: 'Category is required'
      };
    }

    const analytics = new AnalyticsEngine(env, logger);
    
    // Build filters
    const filters = {};
    if (project_id) filters.project_id = project_id;
    if (user_id) filters.user_id = user_id;
    if (status) filters.status = status;
    if (action) filters.action = action;

    // Get chart data
    const chartData = await analytics.getMetrics(category, filters, timeRange);
    
    logger.log('Analytics metrics retrieved', {
      category,
      filters: Object.keys(filters),
      timeRange,
      datasetCount: chartData.datasets?.length || 0
    });

    return {
      success: true,
      data: chartData
    };

  } catch (error) {
    logger.error('Get metrics failed', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export const getMetricsConfig = {
  auth: true,
  validation: {
    category: { type: 'string', required: true },
    project_id: { type: 'string' },
    user_id: { type: 'string' },
    status: { type: 'string' },
    action: { type: 'string' },
    timeRange: { type: 'string', default: '24h' }
  }
};
