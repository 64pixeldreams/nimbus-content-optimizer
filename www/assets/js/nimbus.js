/**
 * Nimbus - Simple Business Wrappers for NimbusAI
 * Lightweight wrappers using CFramework
 */

const nimbus = {
  // ============================================================================
  // PROJECT OPERATIONS (Simple wrappers)
  // ============================================================================
  
  projects: {
    async list() {
      const result = await cf.run('project.list');
      return result.data?.projects || result.projects || [];
    },
    
    async get(projectId) {
      const result = await cf.run('project.get', { project_id: projectId });
      return result.data?.project || result.project;
    },
    
    async create(projectData) {
      const result = await cf.run('project.create', projectData);
      return result.data?.project || result.project;
    }
  },
  
  // ============================================================================
  // PAGE OPERATIONS (Simple wrappers)
  // ============================================================================
  
  pages: {
    async list(projectId) {
      const result = await cf.run('page.list', { project_id: projectId });
      return result.data?.pages || result.pages || [];
    },
    
    async get(pageId) {
      const result = await cf.run('page.get', { page_id: pageId });
      return result.data?.page || result.page;
    },
    
    async create(projectId, pageData) {
      const result = await cf.run('page.create', { 
        project_id: projectId, 
        ...pageData 
      });
      return result.data?.page || result.page;
    },
    
    async updateStatus(pageId, status) {
      const result = await cf.run('page.update', { 
        page_id: pageId, 
        status 
      });
      return result.data?.page || result.page;
    }
  },
  
  // ============================================================================
  // LOGS (Using generic cf.getLogs)
  // ============================================================================
  
  logs: {
    async user(limit = 50) {
      return await cf.getLogs('user', null, limit);
    },
    
    async project(projectId, limit = 50) {
      return await cf.getLogs('project', projectId, limit);
    },
    
    async page(pageId, limit = 50) {
      return await cf.getLogs('page', pageId, limit);
    }
  },
  
  // ============================================================================
  // DASHBOARD HELPERS (Simple data loading)
  // ============================================================================
  
  async loadDashboard() {
    const [projects, recentLogs] = await Promise.all([
      this.projects.list(),
      this.logs.user(10)
    ]);
    
    return {
      user: cf.getUser(),
      projects,
      recentActivity: recentLogs,
      stats: {
        projectCount: projects.length
      }
    };
  },
  
  async loadProject(projectId) {
    const [project, pages, logs] = await Promise.all([
      this.projects.get(projectId),
      this.pages.list(projectId),
      this.logs.project(projectId, 20)
    ]);
    
    return {
      project,
      pages,
      activity: logs,
      stats: {
        pageCount: pages.length,
        pendingCount: pages.filter(p => p.status === 'pending').length,
        processingCount: pages.filter(p => p.status === 'processing').length,
        completedCount: pages.filter(p => p.status === 'completed').length
      }
    };
  }
};

// Make nimbus global
window.nimbus = nimbus;