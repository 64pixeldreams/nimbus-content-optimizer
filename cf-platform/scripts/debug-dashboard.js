#!/usr/bin/env node

/**
 * Debug script to check what the dashboard receives
 */

async function debugDashboard() {
  console.log('🔍 Debugging dashboard data...');
  
  try {
    // Login first
    console.log('🔐 Authenticating...');
    const loginResponse = await fetch('https://nimbus-platform.martin-598.workers.dev/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nimbus-user-1757447187283@example.com',
        password: 'TestPassword123!'
      })
    });
    
    const loginResult = await loginResponse.json();
    if (!loginResult.success) {
      throw new Error(`Login failed: ${loginResult.error}`);
    }
    
    const sessionToken = loginResult.session_token;
    console.log('✅ Authenticated successfully');
    
    // Get projects (same as dashboard)
    console.log('📋 Fetching projects...');
    const projectsResponse = await fetch('https://nimbus-platform.martin-598.workers.dev/api/function', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'project.list',
        payload: {}
      })
    });
    
    const projectsResult = await projectsResponse.json();
    if (!projectsResult.success) {
      throw new Error(`Failed to fetch projects: ${projectsResult.error}`);
    }
    
    const projects = projectsResult.data?.projects || [];
    console.log(`📊 Found ${projects.length} projects`);
    
    // Check first project in detail
    if (projects.length > 0) {
      const project = projects[0];
      console.log('\n🔍 First project details:');
      console.log('Name:', project.name);
      console.log('Stats field:', project.stats);
      console.log('Stats type:', typeof project.stats);
      
      if (typeof project.stats === 'string') {
        try {
          const parsedStats = JSON.parse(project.stats);
          console.log('Parsed stats:', parsedStats);
        } catch (e) {
          console.log('Failed to parse stats:', e.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugDashboard();

