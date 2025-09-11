#!/usr/bin/env node

/**
 * Debug script to test the updateProjectStats function directly
 */

async function debugHooks() {
  console.log('🔍 Debugging page hooks...');
  
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
    
    // Get a project
    console.log('\n📋 Getting a project...');
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
    const projects = projectsResult.data?.projects || [];
    const testProject = projects[0];
    
    console.log('Using project:', testProject.name, testProject.project_id);
    
    // Get pages for this project
    console.log('\n📄 Getting pages for this project...');
    const pagesResponse = await fetch('https://nimbus-platform.martin-598.workers.dev/api/function', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'page.list',
        payload: { project_id: testProject.project_id }
      })
    });
    
    const pagesResult = await pagesResponse.json();
    const pages = pagesResult.data?.pages || pagesResult.pages || [];
    
    console.log(`Found ${pages.length} pages for project`);
    pages.forEach(page => {
      console.log(`  - ${page.title || page.url} (${page.status})`);
    });
    
    // Test the updateProjectStats function by calling it via a test endpoint
    console.log('\n🧪 Testing updateProjectStats function...');
    
    // Create a test page first
    console.log('Creating a test page...');
    const createPageResponse = await fetch('https://nimbus-platform.martin-598.workers.dev/api/function', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'page.create',
        payload: {
          project_id: testProject.project_id,
          url: 'https://debug-test.example.com',
          title: 'Debug Test Page',
          status: 'pending'
        }
      })
    });
    
    const createPageResult = await createPageResponse.json();
    console.log('Page creation result:', createPageResult.success ? 'SUCCESS' : 'FAILED');
    
    if (createPageResult.success) {
      const newPage = createPageResult.data?.page || createPageResult.page;
      console.log('Created page ID:', newPage.page_id);
      
      // Wait for hooks
      console.log('⏳ Waiting for hooks to execute...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check project stats
      console.log('\n📊 Checking project stats after page creation...');
      const updatedProjectResponse = await fetch('https://nimbus-platform.martin-598.workers.dev/api/function', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({
          action: 'project.get',
          payload: { project_id: testProject.project_id }
        })
      });
      
      const updatedProjectResult = await updatedProjectResponse.json();
      if (updatedProjectResult.success) {
        const updatedProject = updatedProjectResult.data?.project || updatedProjectResult.project;
        const updatedStats = typeof updatedProject.stats === 'string' ? JSON.parse(updatedProject.stats) : updatedProject.stats;
        
        console.log('Updated stats:', updatedStats);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugHooks();

