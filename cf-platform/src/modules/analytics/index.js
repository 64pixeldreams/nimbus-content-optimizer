/**
 * Analytics Module
 * Universal metrics tracking and visualization framework
 */

export { AnalyticsEngine } from './core/analytics-engine.js';
export { getMetrics, getMetricsConfig } from './functions/get-metrics.js';
export { getSummary, getSummaryConfig } from './functions/get-summary.js';

/**
 * Quick helper to track events from anywhere in the codebase
 * @param {object} context - Request context with env and logger
 * @param {string} category - Event category
 * @param {string} action - Action taken  
 * @param {string} entityId - Entity ID
 * @param {object} metadata - Additional metadata
 */
export async function trackEvent(context, category, action, entityId, metadata = {}) {
  try {
    const { env, logger, auth } = context;
    const analytics = new AnalyticsEngine(env, logger);
    
    await analytics.trackEvent(
      category,
      action, 
      entityId,
      auth?.user_id || metadata.user_id || 'system',
      metadata
    );
  } catch (error) {
    // Silent fail - analytics shouldn't break main functionality
    context.logger?.error('Analytics tracking failed', error);
  }
}
