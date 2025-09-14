/**
 * Test Real Analytics Engine Data Query
 */

const fetch = require('node-fetch');

const API_URL = 'https://nimbus-platform.martin-598.workers.dev';

async function testRealAnalyticsQuery() {
  try {
    console.log('📊 Testing real Analytics Engine data...');
    
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
    
    // Test simple query for real data
    console.log('\n📊 Querying real Analytics Engine data...');
    
    const queries = [
      {
        name: 'Count all events',
        sql: 'SELECT COUNT() as total FROM nimbus_events'
      },
      {
        name: 'Events by type',
        sql: 'SELECT blob1 as event_type, COUNT() as count FROM nimbus_events GROUP BY blob1'
      },
      {
        name: 'Events by status', 
        sql: 'SELECT blob4 as status, COUNT() as count FROM nimbus_events GROUP BY blob4'
      },
      {
        name: 'Recent events',
        sql: 'SELECT blob1, blob2, blob3, blob4, double1 FROM nimbus_events ORDER BY timestamp DESC LIMIT 5'
      }
    ];
    
    for (const query of queries) {
      console.log(`\n📈 Testing: ${query.name}`);
      console.log(`   SQL: ${query.sql}`);
      
      const response = await fetch(`${API_URL}/api/function`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({
          action: 'analytics.sql',
          payload: {
            sql_query: query.sql
          }
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.data?.success) {
        console.log(`   ✅ SUCCESS:`, result.data.data);
      } else {
        console.log(`   ❌ FAILED:`, result.data?.error || result.error);
        
        // Check for detailed error in logs
        const errorLogs = result.logs?.filter(log => 
          log.level === 'error' && log.context?.includes('analytics')
        );
        if (errorLogs?.length > 0) {
          console.log(`   🔍 Error details:`, errorLogs[0].data);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRealAnalyticsQuery();
