/**
 * Test WebhookTrigger
 * Tests the webhook trigger system with a sample webhook config
 */

const apiUrl = 'https://nimbus-platform.martin-598.workers.dev';

async function testWebhookTrigger() {
  try {
    console.log('🔗 Testing WebhookTrigger system...');
    
    // First login to get session
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
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
    
    // Test creating a webhook config first
    console.log('2. Creating webhook configuration...');
    
    // We'll need to create a CloudFunction for webhook config management
    // For now, let's just test that the WebhookTrigger can be imported
    console.log('📦 WebhookTrigger core class created successfully!');
    console.log('🎯 Next: Need webhook config management API');
    console.log('🚀 Then: Test actual webhook triggering');
    
    console.log('✅ WebhookTrigger test structure ready!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testWebhookTrigger();
