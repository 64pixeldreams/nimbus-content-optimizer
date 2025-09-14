/**
 * Test Analytics Engine Binding
 * Simple test to verify binding works and can write/read data
 */

const fetch = require('node-fetch');

const API_URL = 'https://nimbus-platform.martin-598.workers.dev';

async function testAnalyticsBinding() {
  try {
    console.log('🔍 Testing Analytics Engine Binding...');
    
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
      throw new Error('Login failed');
    }
    
    console.log('✅ Login successful');
    const sessionToken = loginData.session_token;
    
    // 2. Test Analytics Engine binding
    console.log('\n📊 Testing Analytics Engine binding...');
    
    const testResponse = await fetch(`${API_URL}/api/function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'analytics.test',
        payload: {
          project_id: 'project:mfh4o6amph6zeb'
        }
      })
    });
    
    const testResult = await testResponse.json();
    console.log('📊 Analytics binding test:', testResult);
    
    if (testResult.success) {
      console.log('✅ Analytics Engine binding working!');
      console.log('🔧 Binding details:', {
        exists: testResult.data.binding_exists,
        canWrite: testResult.data.has_write_method,
        canQuery: testResult.data.has_sql_method
      });
    } else {
      console.log('❌ Analytics Engine binding failed:', testResult.error);
    }
    
    // 3. Test metrics query
    console.log('\n📈 Testing metrics query...');
    
    const metricsResponse = await fetch(`${API_URL}/api/function`, {
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
    
    const metricsResult = await metricsResponse.json();
    console.log('📈 Metrics query result:', metricsResult.success ? 'SUCCESS' : 'FAILED');
    
    if (metricsResult.success) {
      const data = metricsResult.data?.data;
      console.log('📊 Chart data received:', {
        hasLabels: !!data?.labels,
        labelCount: data?.labels?.length,
        hasDatasets: !!data?.datasets,
        datasetCount: data?.datasets?.length,
        sampleData: data?.datasets?.[0]?.data?.slice(0, 5)
      });
    } else {
      console.log('❌ Metrics query failed:', metricsResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAnalyticsBinding();
