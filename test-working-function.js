/**
 * Test a known working CloudFunction first
 */

const fetch = require('node-fetch');

const API_URL = 'https://nimbus-platform.martin-598.workers.dev';

async function testWorkingFunction() {
  try {
    console.log('🔍 Testing known working CloudFunction...');
    
    // 1. Login
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
    
    // 2. Test page.list (known working)
    console.log('\n📋 Testing page.list (known working)...');
    
    const pageListResponse = await fetch(`${API_URL}/api/function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({
        action: 'page.list',
        payload: {
          project_id: 'project:mfh4o6amph6zeb'
        }
      })
    });
    
    const pageListResult = await pageListResponse.json();
    console.log('📋 page.list response:', pageListResult.success ? 'SUCCESS' : 'FAILED');
    console.log('📊 Pages found:', pageListResult.data?.pages?.length || 0);
    
    // 3. Test analytics.metrics
    console.log('\n📊 Testing analytics.metrics...');
    
    const analyticsResponse = await fetch(`${API_URL}/api/function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({
        action: 'analytics.metrics',
        payload: {
          category: 'pages',
          project_id: 'project:mfh4o6amph6zeb',
          timeRange: '24h'
        }
      })
    });
    
    const analyticsResult = await analyticsResponse.json();
    console.log('📊 analytics.metrics response:', analyticsResult);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testWorkingFunction();
