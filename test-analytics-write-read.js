/**
 * Test Analytics Engine Write/Read Cycle
 * 1. Write test events to create dataset
 * 2. Query the dataset to verify data
 * 3. Debug any API/binding issues
 */

const fetch = require('node-fetch');

const API_URL = 'https://nimbus-platform.martin-598.workers.dev';

async function testAnalyticsWriteRead() {
  try {
    console.log('📊 Testing Analytics Engine Write/Read Cycle...');
    
    // 1. Login
    console.log('\n1. Logging in...');
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
    
    // 2. Write test analytics events
    console.log('\n2. Writing test analytics events...');
    
    const testEvents = [
      { action: 'uploaded', status: 'created' },
      { action: 'processed', status: 'processing' },
      { action: 'completed', status: 'completed' }
    ];
    
    for (const event of testEvents) {
      const writeResponse = await fetch(`${API_URL}/api/function`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({
          action: 'system.debug',
          payload: {
            action: 'analytics_write_test',
            category: 'pages',
            event_action: event.action,
            status: event.status,
            project_id: 'project:mfh4o6amph6zeb',
            entity_id: `test_page_${Date.now()}`
          }
        })
      });
      
      const writeResult = await writeResponse.json();
      console.log(`📝 Write ${event.action}:`, writeResult.success ? 'SUCCESS' : 'FAILED');
      if (!writeResult.success) {
        console.log('   Error:', writeResult.error);
      }
    }
    
    // 3. Wait for data to be available
    console.log('\n3. Waiting 5 seconds for Analytics Engine...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 4. Query Analytics Engine
    console.log('\n4. Querying Analytics Engine...');
    
    const queryResponse = await fetch(`${API_URL}/api/function`, {
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
    
    const queryResult = await queryResponse.json();
    console.log('📊 Query result:', queryResult.success ? 'SUCCESS' : 'FAILED');
    
    if (queryResult.success) {
      console.log('✅ Analytics Engine working!');
      console.log('📈 Data structure:', {
        hasLabels: !!queryResult.data?.data?.labels,
        labelCount: queryResult.data?.data?.labels?.length,
        hasDatasets: !!queryResult.data?.data?.datasets,
        datasetCount: queryResult.data?.data?.datasets?.length,
        firstDataset: queryResult.data?.data?.datasets?.[0]
      });
    } else {
      console.log('❌ Query failed:', queryResult.error);
      
      // Check logs for specific errors
      const analyticsLogs = queryResult.logs?.filter(log => 
        log.context?.includes('analytics') || log.message?.includes('Analytics')
      );
      
      console.log('🔍 Analytics-specific logs:');
      analyticsLogs?.forEach(log => {
        console.log(`   ${log.level}: ${log.message}`);
        if (log.data) console.log('   Data:', log.data);
      });
    }
    
  } catch (error) {
    console.error('❌ Analytics test failed:', error);
  }
}

testAnalyticsWriteRead();
