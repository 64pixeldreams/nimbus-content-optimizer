#!/usr/bin/env node

/**
 * Check project stats to verify they were saved correctly
 */

async function checkProjectStats() {
  console.log('🔍 Checking project stats...');
  
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
    if (!projectsResult.success) {
      throw new Error(`Failed to fetch projects: ${projectsResult.error}`);
    }
    
    const projects = projectsResult.data?.projects || [];
    console.log(`📊 Found ${projects.length} projects`);
    
    // Check stats for each project
    for (const project of projects) {
      console.log(`\n🔍 Project: ${project.name}`);
      console.log(`   ID: ${project.project_id}`);
      console.log(`   Stats:`, project.stats || 'No stats field');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkProjectStats();

