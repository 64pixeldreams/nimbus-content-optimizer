/**
 * Test simplest Analytics Engine query
 */

const fetch = require('node-fetch');

const API_URL = 'https://nimbus-platform.martin-598.workers.dev';

async function testSimpleQuery() {
  try {
    console.log('📊 Testing simplest Analytics Engine query...');
    
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
    
    // Test 1: SHOW TABLES
    console.log('\n1. Testing SHOW TABLES...');
    
    const showTablesResponse = await fetch(`${API_URL}/api/function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'analytics.sql',
        payload: {
          sql_query: 'SHOW TABLES'
        }
      })
    });
    
    const showTablesResult = await showTablesResponse.json();
    console.log('📋 SHOW TABLES result:', showTablesResult);
    
    // Test 2: Simple SELECT
    console.log('\n2. Testing simple SELECT...');
    
    const selectResponse = await fetch(`${API_URL}/api/function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'analytics.sql',
        payload: {
          sql_query: 'SELECT * FROM nimbus_events LIMIT 5'
        }
      })
    });
    
    const selectResult = await selectResponse.json();
    console.log('📊 SELECT result:', selectResult);
    
    // Test 3: Count all rows
    console.log('\n3. Testing COUNT...');
    
    const countResponse = await fetch(`${API_URL}/api/function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'analytics.sql',
        payload: {
          sql_query: 'SELECT COUNT() as total FROM nimbus_events'
        }
      })
    });
    
    const countResult = await countResponse.json();
    console.log('🔢 COUNT result:', countResult);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSimpleQuery();
