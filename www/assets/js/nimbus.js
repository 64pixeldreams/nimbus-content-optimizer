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
      return result.data?.data || result.data?.page || result.page;
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
    try {
      // Load projects with stats (single API call!)
      const projects = await this.projects.list();
      
      // Calculate totals from project stats (no additional API calls!)
      let totalPages = 0;
      let processingPages = 0;
      
      projects.forEach(project => {
        // Parse stats field (comes as JSON string from D1)
        let stats = { total_pages: 0, processing_pages: 0, completed_pages: 0 };
        if (project.stats) {
          if (typeof project.stats === 'string') {
            try {
              stats = JSON.parse(project.stats);
            } catch (e) {
              console.warn('Failed to parse project stats:', e);
            }
          } else if (typeof project.stats === 'object') {
            stats = project.stats;
          }
        }
        
        project.page_count = stats.total_pages;
        totalPages += stats.total_pages;
        processingPages += stats.processing_pages;
        
        // For backward compatibility, set pages array to empty
        // Individual project pages will load pages when needed
        project.pages = [];
      });
      
      // Try to load logs, but don't fail if it doesn't work
      let recentLogs = [];
      try {
        recentLogs = await this.logs.user(10);
      } catch (logError) {
        console.warn('Could not load logs:', logError.message);
        recentLogs = []; // Empty logs if fails
      }
      
      return {
        user: cf.getUser(),
        projects,
        recentActivity: recentLogs,
        stats: {
          projectCount: projects.length,
          pageCount: totalPages,
          processingCount: processingPages
        }
      };
    } catch (error) {
      console.error('Dashboard load failed:', error);
      throw error;
    }
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