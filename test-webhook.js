/**
 * Test Webhook Module
 * Tests webhook delivery to a test endpoint
 */

const apiUrl = 'https://nimbus-platform.martin-598.workers.dev';

async function testWebhook() {
  try {
    console.log('🔗 Testing webhook system...');
    
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
    
    // Test webhook to webhook.site (for testing)
    console.log('2. Testing webhook delivery...');
    
    const webhookResponse = await fetch(`${apiUrl}/api/function`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'webhook.test',
        payload: {
          url: 'https://webhook.site/45368cf2-4657-491a-9ac7-a69c976b6586',
          data: {
            test_message: 'Hello from NimbusHQ webhook system!',
            project_id: 'test_project_123',
            status: 'completed'
          },
          maxRetries: 2
        }
      })
    });
    
    const webhookData = await webhookResponse.json();
    console.log('📡 Webhook response:', JSON.stringify(webhookData, null, 2));
    
    if (webhookData.success) {
      console.log('✅ Webhook test completed!');
      console.log('📊 Result:', webhookData.data.message);
      console.log('🎯 Target URL:', webhookData.data.target_url);
      console.log('📦 Payload sent:', JSON.stringify(webhookData.data.test_payload, null, 2));
    } else {
      console.error('❌ Webhook test failed:', webhookData.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testWebhook();
