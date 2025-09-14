/**
 * Debug Analytics Engine Write - Find out why events aren't being written
 */

const fetch = require('node-fetch');

const API_URL = 'https://nimbus-platform.martin-598.workers.dev';

async function debugAnalyticsWrite() {
  try {
    console.log('🔍 Debugging Analytics Engine write...');
    
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
    console.log('✅ Login successful');
    const sessionToken = loginData.session_token;
    
    // Create a simple debug function to test Analytics Engine write
    console.log('\n📊 Creating debug function for Analytics write...');
    
    const debugResponse = await fetch(`${API_URL}/api/function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'system.debug',
        payload: {
          action: 'test_analytics_write_debug',
          test_data: {
            event_type: 'pages_uploaded',
            project_id: 'project:mfh4o6amph6zeb',
            user_id: 'user:mfcyoh72bo3qkf',
            status: 'created'
          }
        }
      })
    });
    
    const debugResult = await debugResponse.json();
    console.log('🔍 Debug function result:', debugResult);
    
    // Check if the debug function can access Analytics Engine
    const analyticsLogs = debugResult.logs?.filter(log => 
      log.message?.includes('Analytics') || 
      log.context?.includes('analytics') ||
      log.message?.includes('NIMBUS_ANALYTICS')
    );
    
    if (analyticsLogs?.length > 0) {
      console.log('📊 Analytics-related logs:');
      analyticsLogs.forEach(log => {
        console.log(`   ${log.level}: ${log.message}`);
        if (log.data) console.log(`   Data:`, log.data);
      });
    } else {
      console.log('⚠️ No Analytics-related logs found');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugAnalyticsWrite();
