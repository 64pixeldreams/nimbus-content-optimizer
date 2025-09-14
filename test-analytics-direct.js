/**
 * Test Analytics Engine Direct Write
 * Write test events directly to verify Analytics Engine dataset works
 */

const fetch = require('node-fetch');

const API_URL = 'https://nimbus-platform.martin-598.workers.dev';

async function testAnalyticsDirect() {
  try {
    console.log('📊 Testing Analytics Engine direct write...');
    
    // Login
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
    
    // Create a simple system function to test Analytics Engine write
    console.log('\n📊 Testing Analytics Engine write...');
    
    const writeResponse = await fetch(`${API_URL}/api/function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'system.debug',
        payload: {
          action: 'write_test_analytics',
          project_id: 'project:mfh4o6amph6zeb'
        }
      })
    });
    
    const writeResult = await writeResponse.json();
    console.log('📊 Analytics write test:', writeResult);
    
    // Wait a moment then try to read
    console.log('\n⏳ Waiting 2 seconds for data to be available...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to read analytics data
    console.log('\n📈 Testing Analytics Engine read...');
    
    const readResponse = await fetch(`${API_URL}/api/function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
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
    
    const readResult = await readResponse.json();
    console.log('📈 Analytics read result:', readResult);
    
    if (readResult.success) {
      console.log('✅ Analytics Engine working!');
      console.log('📊 Chart data:', readResult.data);
    } else {
      console.log('❌ Analytics Engine read failed:', readResult.error);
    }
    
  } catch (error) {
    console.error('❌ Analytics test failed:', error);
  }
}

testAnalyticsDirect();
