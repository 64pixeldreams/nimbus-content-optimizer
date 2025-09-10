/**
 * Test Audit Logs
 * Check if audit logs are being created and retrieved
 */

const API_URL = 'https://nimbus-platform.martin-598.workers.dev';

async function testAuditLogs() {
  try {
    console.log('🔍 Testing audit logs...');
    
    // Test user logs
    const response = await fetch(`${API_URL}/api/function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': '5ed7c5c856a63446bc46a1b1716f80ba5318258bd446568223eac3c00feba0bc'
      },
      body: JSON.stringify({
        action: 'page.logs',
        payload: {
          type: 'user',
          limit: 10
        }
      })
    });
    
    const result = await response.json();
    
    console.log('📊 Audit logs result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Audit logs retrieved successfully!');
      console.log('📄 Logs found:', result.data?.logs?.length || 0);
      if (result.data?.logs?.length > 0) {
        console.log('📝 First log:', result.data.logs[0]);
      }
    } else {
      console.error('❌ Audit logs failed:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Error testing audit logs:', error);
  }
}

testAuditLogs();
