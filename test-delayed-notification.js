/**
 * Test script to create a delayed notification
 * Simulates real-world scenarios where notifications arrive after some processing time
 */

const API_URL = 'https://nimbus-platform.martin-598.workers.dev/api/function';

async function testDelayedNotification(delaySeconds = 60) {
  console.log('🔔 Testing delayed notification system...');
  
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
    
    // 2. Create delayed notification
    console.log(`2. Creating notification that will appear in ${delaySeconds} seconds...`);
    
    setTimeout(async () => {
      try {
        console.log('🚀 Creating notification now!');
        
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken
          },
          body: JSON.stringify({
            action: 'notification.create',
            data: {
              type: 'batch_upload_complete',
              title: 'Upload Complete! 🎉',
              message: `Your batch upload finished after ${delaySeconds} seconds of processing`,
              action_url: '/app/dashboard.html',
              metadata: {
                test: true,
                delay: delaySeconds,
                created_by: 'delayed-test-script'
              }
            }
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Delayed notification created successfully!');
          console.log('Notification ID:', result.data?.notification?.notification_id);
        } else {
          console.error('❌ Failed to create delayed notification:', result.error);
        }
        
      } catch (error) {
        console.error('❌ Delayed notification creation failed:', error.message);
      }
    }, delaySeconds * 1000);
    
    console.log(`⏰ Notification will be created in ${delaySeconds} seconds`);
    console.log('💡 Go to the dashboard and set a "batch_upload" intent to test!');
    console.log('🔗 Dashboard: https://nimbus360-dashboard.pages.dev/app/dashboard.html');
    console.log('🧪 Test page: https://nimbus360-dashboard.pages.dev/test-intent-system.html');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Get delay from command line argument or default to 60 seconds
const delaySeconds = process.argv[2] ? parseInt(process.argv[2]) : 60;

console.log(`🧪 Starting delayed notification test (${delaySeconds}s delay)`);
console.log('Usage: node test-delayed-notification.js [delay-in-seconds]');
console.log('Example: node test-delayed-notification.js 30');

// Run the test
testDelayedNotification(delaySeconds);
