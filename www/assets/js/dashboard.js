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
  
  // Enable debug mode to see intent logs
  cf.debug = true;
  
  
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
    
    // Load notifications
    await loadNotifications();
    
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

// Smart Notification functions with caching
async function loadNotifications(forceRefresh = false) {
  console.log(`🔔 Loading notifications...`);
  
  // Use centralized CFramework method
  const result = await cf.loadAndRenderNotifications(forceRefresh);
  
  if (result.success) {
    console.log(`✅ Notifications loaded: ${result.notifications.length}`);
    
    // Update header with count info
    const header = document.getElementById('notifications-header');
    const unseenCount = result.notifications.filter(n => !n.seen).length;
    const totalCount = result.notifications.length;
    
    if (unseenCount > 0) {
      header.innerHTML = `${unseenCount} New Notification${unseenCount === 1 ? '' : 's'} (${totalCount} total)`;
    } else {
      header.innerHTML = `No new notifications (${totalCount} total)`;
    }
  } else {
    console.error('❌ Failed to load notifications:', result.error);
  }
}

function renderNotifications(notifications) {
  const container = document.getElementById('notifications-list');
  
  if (notifications.length === 0) {
    container.innerHTML = `
      <div class="list-group-item text-center py-3">
        <div class="text-muted">No notifications yet</div>
        <small class="text-muted">You'll see updates here when things happen</small>
      </div>
    `;
    return;
  }
  
  container.innerHTML = notifications.map(notification => {
    const isUnseen = !notification.seen;
    const timeAgo = cf.formatRelativeTime(notification.created_at);
    
    // Get icon based on notification type
    const iconMap = {
      'test_notification': 'check-circle',
      'batch_upload_complete': 'upload',
      'page_processed': 'zap',
      'project_created': 'folder-plus',
      'default': 'bell'
    };
    const icon = iconMap[notification.type] || iconMap.default;
    
    return `
      <a href="${notification.action_url || '#'}" 
         class="list-group-item ${isUnseen ? 'bg-light' : ''}" 
         onclick="markNotificationSeen('${notification.notification_id}')">
        <div class="row g-0 align-items-center">
          <div class="col-2">
            <i class="text-primary" data-feather="${icon}"></i>
          </div>
          <div class="col-10">
            <div class="text-dark">${notification.title}</div>
            <div class="text-muted small mt-1">${notification.message}</div>
            <div class="text-muted small">${timeAgo}</div>
          </div>
        </div>
      </a>
    `;
  }).join('');
  
  // Re-initialize Feather icons for the new content
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
}

function showNotificationError() {
  const header = document.getElementById('notifications-header');
  const container = document.getElementById('notifications-list');
  
  header.innerHTML = 'Error loading notifications';
  container.innerHTML = `
    <div class="list-group-item text-center py-3">
      <div class="text-danger">Failed to load notifications</div>
      <small class="text-muted">Please try refreshing the page</small>
    </div>
  `;
}

async function markNotificationSeen(notificationId) {
  try {
    console.log('🔔 Marking notification as seen:', notificationId);
    
    // Mark as seen using smart CFramework (auto-updates cache)
    await cf.markNotificationSeen(notificationId);
    
    // Reload notifications to update the UI (will use updated cache)
    await loadNotifications();
    
    console.log('✅ Notification marked as seen and UI updated');
  } catch (error) {
    console.error('❌ Failed to mark notification as seen:', error);
  }
}

// Smart notification refresh on dropdown open
async function refreshNotificationsOnOpen() {
  // Only refresh if it's been more than 30 seconds since last check
  const timeSinceLastCheck = Date.now() - (cf._notificationCache?.lastFetch || 0);
  const shouldRefresh = timeSinceLastCheck > 30000; // 30 seconds
  
  if (shouldRefresh) {
    console.log('🔄 Refreshing notifications on dropdown open');
    await loadNotifications(true); // Force refresh
  } else {
    console.log('🔔 Using cached notifications (recent)');
  }
}

// Intent System Test Function
async function testIntentSystem() {
  const button = document.getElementById('test-intent-btn');
  const originalText = button.innerHTML;
  
  try {
    // 1. Set button to loading state
    button.disabled = true;
    button.innerHTML = '<div class="spinner-border spinner-border-sm me-2" role="status"></div>Processing...';
    
    console.log('🧪 Starting intent system test...');
    
    // 2. Set intent for test notification (expecting it in 5 seconds)
    console.log('🔔 Setting test intent (10 seconds, check every 2s)');
    cf.setNotificationIntent('test_notification', 10 * 1000, 2 * 1000);
    
    // 3. Wait 5 seconds, then create notification
    setTimeout(async () => {
      try {
        console.log('🚀 Creating test notification...');
        
        await cf.notify(
          'Intent system test completed successfully! The notification appeared because we were checking every 2 seconds.',
          'Test Complete! 🎉',
          'test_notification'
        );
        
        // Force a notification refresh after a brief delay to account for D1 propagation
        setTimeout(() => {
          console.log('🔄 Force refreshing notifications after creation...');
          loadNotifications(true);
        }, 1000);
        
        console.log('✅ Test notification created');
        
        // Reset button after notification is created
        setTimeout(() => {
          if (button.disabled) {
            button.disabled = false;
            button.innerHTML = originalText;
            // Re-initialize feather icons
            if (typeof feather !== 'undefined') {
              feather.replace();
            }
          }
        }, 1000);
        
      } catch (error) {
        console.error('❌ Failed to create test notification:', error);
        button.disabled = false;
        button.innerHTML = originalText;
        if (typeof feather !== 'undefined') {
          feather.replace();
        }
      }
    }, 5000);
    
    console.log('⏰ Test notification will appear in 5 seconds...');
    console.log('💡 Watch the notification bell - it should appear automatically!');
    
  } catch (error) {
    console.error('❌ Intent test failed:', error);
    button.disabled = false;
    button.innerHTML = originalText;
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }
}

// Global functions for HTML
window.handleLogout = handleLogout;
window.createProject = createProject;
window.acceptCookies = cf.acceptCookies.bind(cf);
window.rejectCookies = cf.rejectCookies.bind(cf);
window.markNotificationSeen = markNotificationSeen;
window.refreshNotificationsOnOpen = refreshNotificationsOnOpen;
window.testIntentSystem = testIntentSystem;