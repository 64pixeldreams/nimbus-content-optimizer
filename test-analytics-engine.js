/**
 * Test Analytics Engine Dataset
 * Check if dataset exists and create some test events
 */

const fetch = require('node-fetch');

const API_URL = 'https://nimbus-platform.martin-598.workers.dev';

async function testAnalyticsEngine() {
  try {
    console.log('🔍 Testing Analytics Engine...');
    
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
    
    // 2. Try to query Analytics Engine directly
    console.log('\n2. Testing Analytics Engine query...');
    
    const analyticsResponse = await fetch(`${API_URL}/api/function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({
        function: 'analytics.metrics',
        payload: {
          category: 'pages',
          project_id: 'project:mfh4o6amph6zeb',
          timeRange: '24h'
        }
      })
    });
    
    const analyticsResult = await analyticsResponse.json();
    console.log('📊 Analytics Engine response:', analyticsResult);
    
    if (analyticsResult.success) {
      console.log('✅ Analytics Engine working!');
      console.log('📈 Chart data:', analyticsResult.data);
    } else {
      console.log('❌ Analytics Engine error:', analyticsResult.error);
    }
    
    // 3. Try summary endpoint
    console.log('\n3. Testing Analytics summary...');
    
    const summaryResponse = await fetch(`${API_URL}/api/function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({
        function: 'analytics.summary',
        payload: {
          category: 'pages',
          project_id: 'project:mfh4o6amph6zeb',
          timeRange: '24h'
        }
      })
    });
    
    const summaryResult = await summaryResponse.json();
    console.log('📊 Analytics summary response:', summaryResult);
    
  } catch (error) {
    console.error('❌ Analytics Engine test failed:', error);
  }
}

testAnalyticsEngine();
