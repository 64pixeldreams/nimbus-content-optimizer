/**
 * Check for Analytics tracking logs in page updates
 */

const fetch = require('node-fetch');

const API_URL = 'https://nimbus-platform.martin-598.workers.dev';

async function checkAnalyticsLogs() {
  try {
    console.log('🔍 Checking for Analytics tracking logs...');
    
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
    
    // Update page status and look for Analytics logs
    console.log('\n📄 Updating page status...');
    
    const updateResponse = await fetch(`${API_URL}/api/function`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'page.update',
        payload: {
          page_id: 'page:wwwrepairsbypostcom_/brands/cartier_watch_repair_495e350d',
          status: 'extracted'  // Change back to extracted
        }
      })
    });
    
    const updateResult = await updateResponse.json();
    
    if (updateResult.success) {
      console.log('✅ Page updated successfully');
      
      // Look for ALL logs containing "Analytics"
      const allLogs = updateResult.logs || [];
      console.log(`\n📋 Total logs: ${allLogs.length}`);
      
      allLogs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.level}: ${log.message}`);
        if (log.message.includes('Analytics') || log.message.includes('📊')) {
          console.log(`   🎯 ANALYTICS LOG FOUND!`);
          console.log(`   Data:`, log.data);
        }
      });
      
      // Also check for any error logs
      const errorLogs = allLogs.filter(log => log.level === 'error');
      if (errorLogs.length > 0) {
        console.log('\n❌ Error logs found:');
        errorLogs.forEach(log => {
          console.log(`   ${log.message}`);
          if (log.data) console.log(`   Data:`, log.data);
        });
      }
      
    } else {
      console.error('❌ Page update failed:', updateResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

checkAnalyticsLogs();
