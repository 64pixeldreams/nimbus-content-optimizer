/**
 * Create a brand new page to trigger pages_uploaded event
 */

const fetch = require('node-fetch');

const API_URL = 'https://nimbus-platform.martin-598.workers.dev';

async function createNewPage() {
  try {
    console.log('📄 Creating brand new page to trigger Analytics event...');
    
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
    
    // Create a completely new page
    const newPageData = {
      page_id: `page:test_analytics_${Date.now()}`,
      project_id: 'project:mfh4o6amph6zeb',
      url: `/test/analytics-${Date.now()}`,
      title: 'Analytics Test Page',
      status: 'created',
      extracted_data: {
        head: { title: 'Analytics Test Page', metaDescription: 'Test page for analytics' },
        blocks: [
          { type: 'h1', text: 'Analytics Test', id: 'test1' },
          { type: 'p', text: 'This is a test page for analytics tracking', id: 'test2' }
        ]
      },
      metadata: {
        source: 'analytics_test',
        created_for: 'testing_analytics_engine'
      }
    };
    
    console.log('📄 Creating page:', newPageData.url);
    
    const pageResponse = await fetch(`${API_URL}/api/function`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'page.create',
        payload: newPageData
      })
    });
    
    const pageResult = await pageResponse.json();
    
    if (pageResult.success) {
      console.log('✅ New page created successfully!');
      console.log('🆔 Page ID:', pageResult.data?.page_id);
      
      // Check for analytics tracking in logs
      const analyticsLogs = pageResult.logs?.filter(log => 
        log.message?.includes('Analytics') || log.context?.includes('analytics')
      );
      
      if (analyticsLogs?.length > 0) {
        console.log('📊 Analytics tracking logs:');
        analyticsLogs.forEach(log => {
          console.log(`   ${log.level}: ${log.message}`);
        });
      } else {
        console.log('⚠️ No analytics tracking logs found');
      }
      
    } else {
      console.error('❌ Page creation failed:', pageResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

createNewPage();
