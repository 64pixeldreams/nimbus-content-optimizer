#!/usr/bin/env node

/**
 * Debug script to check what's in KV storage for a page
 */

async function debugPageStatus() {
  console.log('🔍 Debugging page status in KV storage...\n');
  
  const apiUrl = 'https://nimbus-platform.martin-598.workers.dev';
  const pageId = 'page:mfee2t46vletpz';
  
  try {
    // Login first
    console.log('🔐 Logging in...');
    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nimbus-user-1757447187283@example.com',
        password: 'TestPassword123!'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login result:', loginData.success);
    
    if (!loginData.success) {
      console.log('❌ Login failed:', loginData.error);
      return;
    }
    
    const sessionToken = loginData.session_token;
    console.log('✅ Authenticated');
    
    // Get the page data
    console.log('\n📊 Getting page data...');
    const pageResponse = await fetch(`${apiUrl}/api/function`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'page.get',
        payload: {
          page_id: pageId
        }
      })
    });
    
    const pageData = await pageResponse.json();
    console.log('Page data:', JSON.stringify(pageData, null, 2));
    
    if (pageData.success) {
      const page = pageData.data?.data || pageData.data?.page || pageData.data;
      console.log('\n📋 Page details:');
      console.log('- Page ID:', page.page_id);
      console.log('- Status:', page.status);
      console.log('- User ID:', page.user_id);
      console.log('- Title:', page.title);
      console.log('- Created:', page.created_at);
      console.log('- Updated:', page.updated_at);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugPageStatus();
