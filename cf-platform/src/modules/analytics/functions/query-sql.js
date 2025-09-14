/**
 * Analytics Engine SQL Query CloudFunction
 * Wrapper around Cloudflare's external Analytics Engine SQL API
 */

export async function querySql(requestContext) {
  const { env, logger, payload, auth } = requestContext;
  
  try {
    const { sql_query } = payload;
    if (!sql_query) {
      return { success: false, error: 'SQL query is required' };
    }

    logger.log('AnalyticsEngine.executeSql via function', { queryLength: sql_query.length });

    const { AnalyticsEngine } = await import('../core/analytics-engine.js');
    const engine = new AnalyticsEngine(env, logger);
    const result = await engine.executeSql(sql_query);

    return { success: true, data: { data: result.data, meta: result.meta } };

  } catch (error) {
    logger.error('analytics.sql failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

export const querySqlConfig = {
  auth: true,
  validation: {
    sql_query: { type: 'string', required: true },
    format: { type: 'string', default: 'json' }
  }
};
