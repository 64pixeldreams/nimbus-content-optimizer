/**
 * Test Analytics Engine with Correct Syntax
 */

const fetch = require('node-fetch');

const ACCOUNT_ID = "55987b6602e8ac9db46e14dcc7ad2c79";
const API_TOKEN = "u5jGlJWX-8F6hyb8ft30KXtdryfyOzkKHIM7d-IZ";
const API_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/analytics_engine/sql`;

async function testCorrectAnalyticsQuery() {
  try {
    console.log('📊 Testing Analytics Engine with correct syntax...');
    
    // Test 1: Count all events (correct syntax)
    console.log('\n1. Testing total event count...');
    
    const countQuery = `
      SELECT 
        SUM(_sample_interval * double1) AS total_events
      FROM nimbus_events
    `;
    
    const countResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/text'
      },
      body: countQuery
    });
    
    console.log(`Response status: ${countResponse.status}`);
    const countResult = await countResponse.text();
    console.log(`Raw response: ${countResult}`);
    
    if (countResponse.ok) {
      try {
        const parsed = JSON.parse(countResult);
        console.log('✅ Total events:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log(`❌ JSON parse failed: ${e.message}`);
      }
    }
    
    // Test 2: Events by type
    console.log('\n2. Testing events by type...');
    
    const typeQuery = `
      SELECT 
        blob1 AS event_type,
        SUM(_sample_interval * double1) AS count
      FROM nimbus_events
      GROUP BY blob1
      ORDER BY count DESC
    `;
    
    const typeResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/text'
      },
      body: typeQuery
    });
    
    console.log(`Response status: ${typeResponse.status}`);
    const typeResult = await typeResponse.text();
    console.log(`Raw response: ${typeResult}`);
    
    if (typeResponse.ok) {
      try {
        const parsed = JSON.parse(typeResult);
        console.log('✅ Events by type:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log(`❌ JSON parse failed: ${e.message}`);
      }
    }
    
    // Test 3: Time series (for charts)
    console.log('\n3. Testing time series...');
    
    const timeQuery = `
      SELECT 
        toStartOfInterval(timestamp, INTERVAL '1' HOUR) AS hour,
        blob4 AS status,
        SUM(_sample_interval * double1) AS count
      FROM nimbus_events
      WHERE timestamp >= NOW() - INTERVAL '1' DAY
      GROUP BY hour, status
      ORDER BY hour
    `;
    
    const timeResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/text'
      },
      body: timeQuery
    });
    
    console.log(`Response status: ${timeResponse.status}`);
    const timeResult = await timeResponse.text();
    console.log(`Raw response: ${timeResult}`);
    
    if (timeResponse.ok) {
      try {
        const parsed = JSON.parse(timeResult);
        console.log('✅ Time series data:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log(`❌ JSON parse failed: ${e.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCorrectAnalyticsQuery();
