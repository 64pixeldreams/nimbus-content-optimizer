/**
 * Get Summary CloudFunction  
 * Returns summary statistics for dashboard cards
 */

import { AnalyticsEngine } from '../core/analytics-engine.js';

export async function getSummary(requestContext) {
  const { env, logger, payload, auth } = requestContext;
  
  try {
    const {
      category,
      project_id,
      user_id,
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

    // Get summary stats
    const summary = await analytics.getSummaryStats(category, filters, timeRange);
    
    logger.log('Analytics summary retrieved', {
      category,
      filters: Object.keys(filters),
      timeRange,
      total: summary.total,
      statusCount: Object.keys(summary.by_status).length
    });

    return {
      success: true,
      data: summary
    };

  } catch (error) {
    logger.error('Get summary failed', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export const getSummaryConfig = {
  auth: true,
  validation: {
    category: { type: 'string', required: true },
    project_id: { type: 'string' },
    user_id: { type: 'string' },
    timeRange: { type: 'string', default: '24h' }
  }
};
