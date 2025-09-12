/**
 * Test Notification Creation
 * Simple script to test notification system
 */

const API_BASE = 'https://nimbus-platform.martin-598.workers.dev';

async function testNotification() {
  try {
    console.log('🔔 Testing notification system...');
    
    // First login to get session
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
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
    
    // Create a test notification
    console.log('2. Creating test notification...');
    const notificationResponse = await fetch(`${API_BASE}/api/function`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'notification.create',
        payload: {
          type: 'test_notification',
          title: 'Test Notification! 🎉',
          message: 'This is a test notification to verify the system is working',
          priority: 'normal',
          action_url: '/app/dashboard.html',
          metadata: {
            test: true,
            created_by: 'test-script'
          }
        }
      })
    });
    
    const notificationData = await notificationResponse.json();
    console.log('Notification response:', JSON.stringify(notificationData, null, 2));
    
    if (!notificationData.success) {
      throw new Error('Notification creation failed: ' + JSON.stringify(notificationData.error));
    }
    
    console.log('✅ Notification created:', notificationData.notification_id);
    
    // List notifications to verify
    console.log('3. Listing notifications...');
    const listResponse = await fetch(`${API_BASE}/api/function`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'notification.list',
        payload: {
          limit: 5
        }
      })
    });
    
    const listData = await listResponse.json();
    if (!listData.success) {
      throw new Error('Notification listing failed: ' + listData.error);
    }
    
    console.log('✅ Notifications found:', listData.count);
    console.log('📋 Notifications:', listData.notifications.map(n => ({
      id: n.notification_id,
      title: n.title,
      seen: n.seen,
      created: n.created_at
    })));
    
    console.log('🎉 Notification system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testNotification();
