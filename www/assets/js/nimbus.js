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
    try {
      // Load projects first
      const projects = await this.projects.list();
      
      // Load all pages for the user (across all projects)
      let allPages = [];
      let totalPages = 0;
      let processingPages = 0;
      
      try {
        // Get all pages for each project
        for (const project of projects) {
          try {
            const pages = await this.pages.list(project.project_id);
            project.page_count = pages.length;
            project.pages = pages;
            allPages = allPages.concat(pages);
          } catch (pageError) {
            console.warn(`Could not load pages for project ${project.project_id}:`, pageError.message);
            project.page_count = 0;
            project.pages = [];
          }
        }
        
        totalPages = allPages.length;
        processingPages = allPages.filter(p => p.status === 'processing').length;
        
      } catch (pageError) {
        console.warn('Could not load pages:', pageError.message);
        // Set default counts
        projects.forEach(project => {
          project.page_count = 0;
          project.pages = [];
        });
      }
      
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