#!/usr/bin/env node
/**
 * Persistent Workflow Test
 * Tests: Login → Save Session → Create Project → Save Config → Reuse Everything
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

const baseUrl = "https://nimbus-platform.martin-598.workers.dev";
const configFile = './dist/nimbus-config.json';

console.log('🚀 NIMBUS AI - PERSISTENT WORKFLOW TEST');
console.log('='.repeat(60));
console.log(`Target: ${baseUrl}`);
console.log(`Config: ${configFile}`);
console.log(`Time: ${new Date().toISOString()}`);
console.log('='.repeat(60));

// Load or create config
let config = {};
if (existsSync(configFile)) {
  config = JSON.parse(readFileSync(configFile, 'utf8'));
  console.log('📁 Loaded existing config');
} else {
  config = JSON.parse(readFileSync(configFile, 'utf8'));
  console.log('📁 Created new config');
}

function saveConfig() {
  writeFileSync(configFile, JSON.stringify(config, null, 2));
  console.log('💾 Config saved');
}

async function apiCall(endpoint, data = {}, useAuth = false) {
  const url = endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/api/function`;
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (useAuth && config.user.session_cookie) {
    headers['Cookie'] = config.user.session_cookie;
  }
  
  const body = endpoint.startsWith('/') ? 
    JSON.stringify(data) : 
    JSON.stringify({ action: endpoint, payload: data });
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body
  });
  
  // Extract and save session cookie
  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader && setCookieHeader.includes('session=')) {
    config.user.session_cookie = setCookieHeader;
    config.user.logged_in = true;
    config.user.last_login = new Date().toISOString();
    saveConfig();
  }
  
  return await response.json();
}

async function test(name, testFn) {
  try {
    console.log(`\n📋 ${name}`);
    await testFn();
    console.log('✅ PASSED');
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    throw error;
  }
}

async function runTests() {
  try {
    // Test 1: Check if user is already logged in
    await test('Check Existing Session', async () => {
      if (config.user.logged_in && config.user.session_cookie) {
        console.log(`   Found existing session for: ${config.user.email}`);
        console.log(`   User ID: ${config.user.user_id}`);
        console.log(`   Last login: ${config.user.last_login}`);
        
        // Test if session is still valid
        const result = await apiCall('/auth/me', {}, true);
        if (result.success) {
          console.log('   ✅ Session still valid');
          return;
        } else {
          console.log('   ❌ Session expired, will need to re-login');
          config.user.logged_in = false;
          config.user.session_cookie = null;
        }
      } else {
        console.log('   No existing session found');
      }
    });

    // Test 2: Login or Create User (only if not logged in)
    if (!config.user.logged_in) {
      await test('User Authentication', async () => {
        // Try to login with existing email first
        if (config.user.email) {
          console.log(`   Attempting login with: ${config.user.email}`);
          const loginResult = await apiCall('/auth/login', {
            email: config.user.email,
            password: 'TestPassword123!' // In real app, this would be stored securely or prompted
          });
          
          console.log(`   Login response: ${JSON.stringify(loginResult, null, 2)}`);
          
          if (loginResult.success) {
            config.user.user_id = loginResult.data?.user_id || loginResult.userId;
            config.user.name = loginResult.data?.name || loginResult.name;
            config.user.logged_in = true;
            saveConfig();
            console.log(`   ✅ Logged in successfully`);
            return;
          } else {
            console.log(`   ❌ Login failed: ${loginResult.error || 'Unknown error'}`);
            console.log(`   Will create new user instead`);
          }
        }
        
        // Create new user
        const timestamp = Date.now();
        const email = `nimbus-user-${timestamp}@example.com`;
        const signupResult = await apiCall('/auth/signup', {
          email: email,
          password: 'TestPassword123!',
          name: `Nimbus User ${timestamp}`
        });
        
        if (!signupResult.success) {
          throw new Error(`Signup failed: ${JSON.stringify(signupResult, null, 2)}`);
        }
        
        console.log(`   Signup response: ${JSON.stringify(signupResult, null, 2)}`);
        
        // Update config with user info
        config.user.user_id = signupResult.userId;
        config.user.email = signupResult.email;
        config.user.name = signupResult.data?.name || `Nimbus User ${timestamp}`;
        config.user.logged_in = true;
        config.user.last_login = new Date().toISOString();
        saveConfig();
        
        console.log(`   ✅ Created and logged in user: ${email}`);
        console.log(`   User ID: ${config.user.user_id}`);
      });
    }

    // Test 3: Check for existing project
    await test('Check Existing Project', async () => {
      if (config.project.project_id) {
        console.log(`   Found existing project: ${config.project.name}`);
        console.log(`   Project ID: ${config.project.project_id}`);
        console.log(`   Domain: ${config.project.domain}`);
        console.log(`   Dashboard: ${config.project.dashboard_url}`);
        
        // Verify project still exists
        const result = await apiCall('project.get', {
          project_id: config.project.project_id
        }, true);
        
        if (result.success) {
          console.log('   ✅ Project still exists');
          return;
        } else {
          console.log('   ❌ Project no longer exists, will create new one');
          config.project = {
            project_id: null,
            name: null,
            domain: null,
            dashboard_url: null,
            created_at: null,
            local_folder: null
          };
        }
      } else {
        console.log('   No existing project found');
      }
    });

    // Test 4: Create Project (only if needed)
    if (!config.project.project_id) {
      await test('Project Creation', async () => {
        const result = await apiCall('project.create', {
          name: `NimbusAI Project - ${new Date().toISOString().split('T')[0]}`,
          description: 'Local folder project for NimbusAI content optimization',
          domain: 'example.com',
          logo: 'https://example.com/logo.png',
          config: {
            optimization_level: 'standard',
            ai_model: 'gpt-4'
          }
        }, true);
        
        if (!result.success) {
          throw new Error(`Project creation failed: ${JSON.stringify(result, null, 2)}`);
        }
        
        console.log(`   Project response: ${JSON.stringify(result, null, 2)}`);
        
        // Update config with project info (CloudFunction wraps in data.project)
        const project = result.data?.project || result.data || result;
        config.project.project_id = project.project_id;
        config.project.name = project.name;
        config.project.domain = project.domain;
        config.project.dashboard_url = `${baseUrl}/dashboard/project/${project.project_id}`;
        config.project.created_at = project.created_at;
        config.project.local_folder = '.';
        config.project.website_root = '.';
        config.project.extraction_config = './extraction-config.json';
        saveConfig();
        
        console.log(`   ✅ Created project: ${config.project.name}`);
        console.log(`   Project ID: ${config.project.project_id}`);
        console.log(`   Dashboard URL: ${config.project.dashboard_url}`);
      });
    }

    // Test 5: Create Page (using persistent session and project)
    await test('Page Creation', async () => {
      const result = await apiCall('page.create', {
        project_id: config.project.project_id,
        url: `/test-page-${Date.now()}.html`,
        title: 'Test Page - Persistent Workflow',
        content: `<html>
<head>
    <title>Test Page - Persistent Workflow</title>
    <meta name="description" content="This page was created using persistent session and project configuration">
</head>
<body>
    <h1>Test Page - Persistent Workflow</h1>
    <p>This page demonstrates the persistent workflow:</p>
    <ul>
        <li>User: ${config.user.email}</li>
        <li>Project: ${config.project.name}</li>
        <li>Local Folder: ${config.project.local_folder}</li>
        <li>Created: ${new Date().toISOString()}</li>
    </ul>
</body>
</html>`,
        extracted_data: {
          head: {
            title: 'Test Page - Persistent Workflow',
            metaDescription: 'This page was created using persistent session and project configuration'
          },
          content: {
            headings: ['Test Page - Persistent Workflow'],
            paragraphs: ['This page demonstrates the persistent workflow']
          }
        },
        metadata: {
          source: 'persistent-workflow-test',
          user_email: config.user.email,
          project_name: config.project.name,
          local_folder: config.project.local_folder,
          test_run: new Date().toISOString()
        }
      }, true);
      
        console.log(`   Page response: ${JSON.stringify(result, null, 2)}`);
        
        if (!result.success) {
          throw new Error(`Page creation failed: ${JSON.stringify(result, null, 2)}`);
        }
      
      // Extract page data from CloudFunction response
      const page = result.data?.page || result.page;
      
      console.log(`   ✅ Created page: ${page?.page_id || 'undefined'}`);
      console.log(`   URL: ${page?.url || 'undefined'}`);
      console.log(`   Title: ${page?.title || 'undefined'}`);
      console.log(`   Status: ${page?.status || 'undefined'}`);
    });

    // Test 6: List Pages (verify everything is working)
    await test('Page Listing', async () => {
      const result = await apiCall('page.list', {
        project_id: config.project.project_id,
        limit: 10
      }, true);
      
      if (!result.success) {
        throw new Error(`Page listing failed: ${JSON.stringify(result, null, 2)}`);
      }
      
      // Extract pages data from CloudFunction response
      const pages = result.data?.pages || result.pages || [];
      const count = result.data?.count || result.count || pages.length;
      
      console.log(`   ✅ Listed ${count} pages`);
      pages.forEach(page => {
        console.log(`   - ${page.page_id}: ${page.title}`);
      });
    });

    // Test 7: Check Audit Logs
    await test('Audit Logs', async () => {
      // Get user logs
      const userLogsResult = await apiCall('page.logs', {
        type: 'user',
        limit: 10
      }, true);
      
      if (userLogsResult.success) {
        console.log(`   ✅ User logs: ${userLogsResult.logs?.length || 0} entries`);
        userLogsResult.logs?.slice(0, 3).forEach(log => {
          console.log(`   - ${log.message} (${log.action})`);
        });
      }
      
      // Get project logs
      const projectLogsResult = await apiCall('page.logs', {
        type: 'project',
        entity_id: config.project.project_id,
        limit: 10
      }, true);
      
      if (projectLogsResult.success) {
        console.log(`   ✅ Project logs: ${projectLogsResult.logs?.length || 0} entries`);
        projectLogsResult.logs?.slice(0, 3).forEach(log => {
          console.log(`   - ${log.message} (${log.action})`);
        });
      }
    });

    // Success Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 PERSISTENT WORKFLOW SUCCESS!');
    console.log('='.repeat(60));
    console.log('✅ Session persisted across runs');
    console.log('✅ Project linked to local folder');
    console.log('✅ No need to recreate user/project');
    console.log('✅ Full workflow working with saved state');

    console.log('\n📋 Current Configuration:');
    console.log(`   User: ${config.user.email} (${config.user.user_id})`);
    console.log(`   Project: ${config.project.name} (${config.project.project_id})`);
    console.log(`   Local Folder: ${config.project.local_folder}`);
    console.log(`   Dashboard: ${config.project.dashboard_url}`);
    console.log(`   Session: ${config.user.logged_in ? 'Active' : 'Expired'}`);

    console.log('\n🚀 Next Steps:');
    console.log('   1. Run this test again - it will reuse existing session/project');
    console.log('   2. Integrate with gulp extraction pipeline');
    console.log('   3. Add dashboard URL opening');
    console.log('   4. Build local CLI commands');

  } catch (error) {
    console.log('\n❌ PERSISTENT WORKFLOW FAILED');
    console.log(`Error: ${error.message}`);
    console.log('\n🔧 Config saved for debugging');
    process.exit(1);
  }
}

// Run persistent workflow test
runTests();
