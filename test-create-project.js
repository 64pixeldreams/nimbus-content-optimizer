/**
 * Test Project Creation
 * Creates a project in CF for the CLI integration
 */

const apiUrl = 'https://nimbus-platform.martin-598.workers.dev';

async function createProject() {
  try {
    console.log('🏗️ Creating project in CF...');
    
    // First login to get session
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nimbus-user-1757447187283@example.com',
        password: 'TestPassword123!'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error('Login failed: ' + loginData.error);
    }
    
    console.log('✅ Login successful');
    const sessionToken = loginData.session_token;
    
    // Create project with domain for live URL generation
    console.log('2. Creating project...');
    const projectResponse = await fetch(`${apiUrl}/api/function`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'project.create',
        payload: {
          name: 'Watch Repair Site - CLI Integration Test',
          domain: 'www.repairsbypost.com',
          description: 'Test project for CLI → CF integration with live URL generation',
          status: 'active'
        }
      })
    });
    
    const projectData = await projectResponse.json();
    console.log('🏗️ Project response:', JSON.stringify(projectData, null, 2));
    
    if (projectData.success) {
      console.log('✅ Project created successfully!');
      console.log('🆔 Project ID:', projectData.data.project_id);
      console.log('🌐 Domain:', projectData.data.domain);
      console.log('🔗 Base URL:', projectData.data.base_url || `https://${projectData.data.domain}`);
      console.log('📊 Stats:', JSON.stringify(projectData.data.stats, null, 2));
      
      // Create local project config (simulating what gulp would do)
      const localConfig = {
        project_id: projectData.data.project_id,
        name: projectData.data.name,
        domain: projectData.data.domain,
        base_url: projectData.data.base_url || `https://${projectData.data.domain}`,
        created_at: projectData.data.created_at,
        cf_synced: true,
        session_token: sessionToken
      };
      
      console.log('\n📋 Local config that gulp would store:');
      console.log(JSON.stringify(localConfig, null, 2));
      
      console.log('\n🎯 Next: Check CF dashboard to see the project!');
      console.log('🔗 Dashboard: https://nimbus360-dashboard.pages.dev/app/dashboard.html');
      
    } else {
      console.error('❌ Project creation failed:', projectData.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
createProject();
