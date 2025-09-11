#!/usr/bin/env node

/**
 * Debug script to check project.list response
 */

async function debugProjects() {
  console.log('🔍 Debugging project.list...');
  
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
    console.log('Login result:', JSON.stringify(loginResult, null, 2));
    
    if (!loginResult.success) {
      throw new Error(`Login failed: ${loginResult.error}`);
    }
    
    const sessionToken = loginResult.session_token;
    console.log('✅ Authenticated successfully');
    
    // Get projects
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
    console.log('Projects result:', JSON.stringify(projectsResult, null, 2));
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugProjects();

