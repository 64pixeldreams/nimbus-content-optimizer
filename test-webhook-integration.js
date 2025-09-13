/**
 * Test Webhook Integration
 * Tests the complete webhook system: config creation + automatic firing on page updates
 */

const apiUrl = 'https://nimbus-platform.martin-598.workers.dev';

async function testWebhookIntegration() {
  try {
    console.log('🔗 Testing complete webhook integration...');
    
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
    
    // Step 2: Create a webhook configuration (we'll need to create this CloudFunction)
    console.log('2. Creating webhook configuration...');
    console.log('   📝 Note: Need to create webhook.config.create CloudFunction first');
    
    // Step 3: Update a page to trigger the webhook
    console.log('3. Testing page update to trigger webhook...');
    
    // Get a page first
    const pageListResponse = await fetch(`${apiUrl}/api/function`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'page.list',
        payload: { limit: 1 }
      })
    });
    
    const pageListData = await pageListResponse.json();
    if (!pageListData.success || !pageListData.data.pages.length) {
      throw new Error('No pages found to test with');
    }
    
    const testPage = pageListData.data.pages[0];
    console.log(`📄 Found test page: ${testPage.page_id}`);
    
    // Update the page to trigger webhook
    console.log('4. Updating page to trigger webhook...');
    const pageUpdateResponse = await fetch(`${apiUrl}/api/function`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'page.update',
        payload: {
          page_id: testPage.page_id,
          title: `Test Page Updated - ${new Date().toISOString()}`
        }
      })
    });
    
    const pageUpdateData = await pageUpdateResponse.json();
    console.log('📡 Page update response:', JSON.stringify(pageUpdateData, null, 2));
    
    if (pageUpdateData.success) {
      console.log('✅ Page updated successfully!');
      console.log('🔍 Check logs for webhook firing attempts...');
      console.log('📦 Even with no webhook configs, system should log "No webhooks configured"');
    } else {
      console.error('❌ Page update failed:', pageUpdateData.error);
    }
    
    console.log('🎯 Next: Create webhook config and test actual webhook delivery');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testWebhookIntegration();
