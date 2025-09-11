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
    console.error('Dashboard: User not authenticated!');
    document.getElementById('content').innerHTML = `
      <div class="alert alert-danger">
        <h4>Authentication Error</h4>
        <p>User not authenticated. Please log in.</p>
        <a href="/auth/login.html" class="btn btn-primary">Go to Login</a>
      </div>
    `;
    return;
  }
  
  // Load dashboard data
  await loadDashboard();
});

async function loadDashboard() {
  try {
    // Update user info in header and account title
    const user = cf.getUser();
    const userName = cf.getUserName();
    const userEmail = user?.email || 'user@example.com';
    
    // Truncate long names for top bar display
    const displayName = userName.length > 12 ? userName.substring(0, 12) + '...' : userName;
    
    document.getElementById('user-name').textContent = displayName;
    document.getElementById('account-title').textContent = `${userEmail}'s account:`;
    
    // Load dashboard data using nimbus
    const data = await nimbus.loadDashboard();
    
    // Update stats
    document.getElementById('projects-count').textContent = data.stats.projectCount;
    document.getElementById('pages-count').textContent = data.stats.pageCount;
    document.getElementById('processing-count').textContent = data.stats.processingCount;
    
    // Render projects table (Cloudflare style)
    renderProjects(data.projects);
    
  } catch (error) {
    console.error('Failed to load dashboard:', error);
    
    // Show specific error message
    const errorMessage = error.message.includes('nimbus') ? 
      'Nimbus wrapper error: ' + error.message :
      'Failed to load dashboard data: ' + error.message;
      
    showError(errorMessage);
  }
}

function renderProjects(projects) {
  const container = document.getElementById('projects-container');
  
  if (projects.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <h5>No projects yet</h5>
        <p class="text-muted">Create your first project to get started</p>
        <button class="btn btn-primary" onclick="createProject()">
          <i data-feather="plus"></i> Create Project
        </button>
      </div>
    `;
    return;
  }
  
  // Create Cloudflare-style table
  const tableRows = projects.map(project => {
    const lastActivity = project.updated_at ? 
      cf.formatRelativeTime(project.updated_at) : 
      'Never';
    
    return `
      <tr class="project-row" onclick="viewProject('${project.project_id}')" style="cursor: pointer;">
        <td>
          <strong>${project.name}</strong>
        </td>
        <td>${project.domain}</td>
        <td>
          <span class="badge bg-${project.status === 'active' ? 'success' : 'secondary'}">
            ${project.status}
          </span>
        </td>
        <td>${project.page_count || 0}</td>
        <td>${lastActivity}</td>
      </tr>
    `;
  }).join('');
  
  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Name</th>
            <th>Domain</th>
            <th>Status</th>
            <th>Pages</th>
            <th>Last Activity</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;
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

function reloadDashboard() {
  // Get reload link
  const reloadLink = document.querySelector('[onclick*="reloadDashboard"]');
  
  // Disable reload link temporarily
  reloadLink.style.pointerEvents = 'none';
  reloadLink.style.opacity = '0.6';
  
  // Show loading state in projects container
  document.getElementById('projects-container').innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-primary"></div>
      <p class="mt-2">Reloading projects...</p>
    </div>
  `;
  
  // Reload dashboard data
  loadDashboard().then(() => {
    // Re-enable reload link after loading completes
    reloadLink.style.pointerEvents = 'auto';
    reloadLink.style.opacity = '1';
  }).catch(() => {
    // Re-enable reload link even if loading fails
    reloadLink.style.pointerEvents = 'auto';
    reloadLink.style.opacity = '1';
  });
}

function viewProject(projectId) {
  // Navigate to project dashboard using hash (works with any server)
  window.location.href = `/app/project.html#${projectId}`;
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