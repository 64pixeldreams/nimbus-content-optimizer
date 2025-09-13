/**
 * Create Webhook Configuration
 * Creates a webhook config to test automatic webhook firing
 */

const apiUrl = 'https://nimbus-platform.martin-598.workers.dev';

async function createWebhookConfig() {
  try {
    console.log('🔧 Creating webhook configuration...');
    
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
    
    // Create webhook config using CloudFunction
    console.log('2. Creating webhook configuration...');
    
    const webhookResponse = await fetch(`${apiUrl}/api/function`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'webhook.config.create',
        payload: {
          name: 'Page Update Test Webhook',
          target_url: 'https://webhook.site/45368cf2-4657-491a-9ac7-a69c976b6586',
          event_types: ['page.updated'],
          status: 'active',
          timeout_ms: 10000,
          max_retries: 3
        }
      })
    });
    
    const webhookData = await webhookResponse.json();
    console.log('🔧 Webhook config response:', JSON.stringify(webhookData, null, 2));
    
    if (webhookData.success) {
      console.log('✅ Webhook config created!');
      console.log('🆔 Webhook ID:', webhookData.webhook_id);
      console.log('🎯 Target URL:', webhookData.data.target_url);
      console.log('📋 Event Types:', webhookData.data.event_types);
      console.log('🚀 Ready to test automatic webhook firing!');
    } else {
      console.error('❌ Webhook config creation failed:', webhookData.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
createWebhookConfig();
