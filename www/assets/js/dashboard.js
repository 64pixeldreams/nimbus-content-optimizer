/**
 * Dashboard Page Script
 * Main dashboard functionality
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize CFramework
  cf.init({
    serverUrl: 'https://nimbus-platform.martin-598.workers.dev',
    appName: 'nimbus'
  });
  
  // Check authentication
  if (!cf.isAuthenticated()) {
    window.location.href = '/auth/login.html';
    return;
  }
  
  // Load dashboard data
  await loadDashboard();
});

async function loadDashboard() {
  try {
    // Update user info in header
    const user = cf.getUser();
    document.getElementById('user-name').textContent = cf.getUserName();
    document.getElementById('welcome-name').textContent = cf.getUserName();
    document.getElementById('user-avatar').textContent = cf.getUserName().charAt(0).toUpperCase();
    
    // Load dashboard data using nimbus
    const data = await nimbus.loadDashboard();
    
    // Update stats
    document.getElementById('projects-count').textContent = data.stats.projectCount;
    document.getElementById('pages-count').textContent = 
      data.projects.reduce((sum, p) => sum + (p.page_count || 0), 0);
    document.getElementById('processing-count').textContent = '0'; // TODO: Calculate processing
    
    // Render projects
    renderProjects(data.projects);
    
    // Render activity feed
    renderActivity(data.recentActivity);
    
  } catch (error) {
    console.error('Failed to load dashboard:', error);
    showError('Failed to load dashboard data');
  }
}

function renderProjects(projects) {
  const container = document.getElementById('projects-container');
  
  if (projects.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <p class="text-muted">No projects yet</p>
        <button class="btn btn-primary" onclick="createProject()">Create Your First Project</button>
      </div>
    `;
    return;
  }
  
  const projectsHtml = projects.map(project => `
    <div class="border-bottom pb-3 mb-3">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h5 class="mb-1">
            <a href="/app/project.html?id=${project.project_id}" class="text-decoration-none">
              ${project.name}
            </a>
          </h5>
          <p class="text-muted mb-1">${project.domain}</p>
          <small class="text-muted">Created ${cf.formatRelativeTime(project.created_at)}</small>
        </div>
        <div class="text-end">
          <span class="badge bg-${cf.formatStatus(project.status).class}">
            ${cf.formatStatus(project.status).icon} ${cf.formatStatus(project.status).text}
          </span>
          <div class="mt-1">
            <small class="text-muted">${project.page_count || 0} pages</small>
          </div>
        </div>
      </div>
    </div>
  `).join('');
  
  container.innerHTML = projectsHtml;
}

function renderActivity(logs) {
  const container = document.getElementById('activity-container');
  
  if (logs.length === 0) {
    container.innerHTML = '<p class="text-muted">No recent activity</p>';
    return;
  }
  
  const activityHtml = logs.slice(0, 10).map(log => `
    <div class="d-flex align-items-start mb-3">
      <div class="flex-shrink-0 me-2">
        <span class="badge bg-light text-dark">${getActivityIcon(log.action)}</span>
      </div>
      <div class="flex-grow-1">
        <p class="mb-1 small">${log.message}</p>
        <small class="text-muted">${cf.formatRelativeTime(log.timestamp)}</small>
      </div>
    </div>
  `).join('');
  
  container.innerHTML = activityHtml;
}

function getActivityIcon(action) {
  const icons = {
    'user_login': '🔐',
    'page_created': '📄',
    'page_status_processing': '⚡',
    'page_status_completed': '✅',
    'project_created': '📁'
  };
  return icons[action] || '📋';
}

function createProject() {
  // TODO: Implement project creation modal or redirect
  alert('Project creation coming soon!');
}

async function handleLogout() {
  try {
    await cf.logout();
    window.location.href = '/auth/login.html';
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

function showError(message) {
  // Simple error display
  const container = document.querySelector('.container');
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-danger alert-dismissible fade show';
  errorDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  container.insertBefore(errorDiv, container.firstChild);
}

// Global functions for HTML
window.handleLogout = handleLogout;
window.createProject = createProject;
window.acceptCookies = cf.acceptCookies.bind(cf);
window.rejectCookies = cf.rejectCookies.bind(cf);
