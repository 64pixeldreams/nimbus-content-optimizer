/**
 * Test script to debug notification listing
 */

const API_URL = 'https://nimbus-platform.martin-598.workers.dev/api/function';

async function testListNotifications() {
  console.log('🔔 Testing notification listing...');
  
  try {
    // 1. Login first
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${API_URL.replace('/api/function', '')}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nimbus-user-1757447187283@example.com',
        password: 'TestPassword123!'
      })
    });
    
    const loginResult = await loginResponse.json();
    if (!loginResult.success) {
      throw new Error('Login failed: ' + loginResult.error);
    }
    
    const sessionToken = loginResult.session_token;
    console.log('✅ Login successful');
    
    // 2. List notifications
    console.log('2. Listing notifications...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'notification.list',
        data: { limit: 10 }
      })
    });
    
    const result = await response.json();
    
    console.log('List response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ List successful!');
      console.log('Notifications found:', result.data?.notifications?.length || 0);
      
      if (result.data?.notifications?.length > 0) {
        console.log('First notification:', result.data.notifications[0]);
      }
    } else {
      console.error('❌ List failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testListNotifications();
