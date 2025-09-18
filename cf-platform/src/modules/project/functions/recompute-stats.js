import { ProjectStats } from '../../stats/project-stats.js';

export async function recomputeStats(requestContext) {
  const { env, logger, payload } = requestContext;
  const { project_id } = payload || {};
  if (!project_id) return { success: false, error: 'project_id is required' };
  try {
    const stats = new ProjectStats(env, logger);
    const totals = await stats.recomputeSnapshot(project_id);
    return { success: true, data: { project_id, stats: totals } };
  } catch (error) {
    logger?.error('project.stats.recompute failed', error);
    return { success: false, error: error.message };
  }
}

export const recomputeStatsConfig = {
  auth: true,
  validation: {
    project_id: { type: 'string', required: true }
  }
};


