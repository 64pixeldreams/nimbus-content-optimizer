/**
 * Test Analytics Engine SQL API Wrapper
 */

const fetch = require('node-fetch');

const API_URL = 'https://nimbus-platform.martin-598.workers.dev';

async function testAnalyticsSqlApi() {
  try {
    console.log('📊 Testing Analytics Engine SQL API Wrapper...');
    
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
    
    // 2. Test simple SQL query
    console.log('\n📊 Testing SQL API wrapper...');
    
    const sqlQuery = `
      SELECT 
        blob1 as event_type,
        blob4 as status,
        COUNT() as count
      FROM NIMBUS_ANALYTICS_ENGINE 
      WHERE startsWith(blob1, 'pages_')
      GROUP BY blob1, blob4
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const sqlResponse = await fetch(`${API_URL}/api/function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'analytics.sql',
        payload: {
          sql_query: sqlQuery
        }
      })
    });
    
    const sqlResult = await sqlResponse.json();
    console.log('📊 SQL API result:', sqlResult.success ? 'SUCCESS' : 'FAILED');
    
    if (sqlResult.success) {
      console.log('✅ Analytics Engine SQL API working!');
      console.log('📈 Query results:', sqlResult.data);
      console.log('📊 Meta info:', sqlResult.meta);
    } else {
      console.log('❌ SQL API failed:', sqlResult.error);
      console.log('🔍 Error details:', sqlResult.details);
    }
    
    // 3. Test time series query (for charts)
    console.log('\n📈 Testing time series query...');
    
    const timeSeriesQuery = `
      SELECT 
        toStartOfInterval(timestamp, INTERVAL '1' HOUR) as hour,
        blob4 as status,
        COUNT() as count
      FROM NIMBUS_ANALYTICS_ENGINE 
      WHERE startsWith(blob1, 'pages_')
        AND timestamp >= NOW() - INTERVAL '1' DAY
      GROUP BY hour, status
      ORDER BY hour
    `;
    
    const timeSeriesResponse = await fetch(`${API_URL}/api/function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'analytics.sql',
        payload: {
          sql_query: timeSeriesQuery
        }
      })
    });
    
    const timeSeriesResult = await timeSeriesResponse.json();
    console.log('📈 Time series result:', timeSeriesResult.success ? 'SUCCESS' : 'FAILED');
    
    if (timeSeriesResult.success) {
      console.log('✅ Time series query working!');
      console.log('📊 Chart data:', timeSeriesResult.data);
    } else {
      console.log('❌ Time series failed:', timeSeriesResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAnalyticsSqlApi();
