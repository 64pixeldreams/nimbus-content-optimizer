/**
 * Test Analytics Engine Write
 * Write some test events to populate the dataset
 */

const fetch = require('node-fetch');

const API_URL = 'https://nimbus-platform.martin-598.workers.dev';

async function writeTestAnalytics() {
  try {
    console.log('📊 Writing test analytics data...');
    
    // 1. Login first
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
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
    
    // 2. Create a simple CloudFunction to write test analytics data
    console.log('\n2. Writing test analytics events...');
    
    const testResponse = await fetch(`${API_URL}/api/function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({
        function: 'system.debug',
        payload: {
          action: 'test_analytics_write',
          project_id: 'project:mfh4o6amph6zeb'
        }
      })
    });
    
    const testResult = await testResponse.json();
    console.log('📊 Test write response:', testResult);
    
  } catch (error) {
    console.error('❌ Analytics write test failed:', error);
  }
}

writeTestAnalytics();
