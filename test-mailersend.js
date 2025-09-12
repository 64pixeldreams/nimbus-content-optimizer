/**
 * Test MailerSend Integration
 * Sends a test email to verify the email system is working
 */

const apiUrl = 'https://nimbus-platform.martin-598.workers.dev';

async function testMailerSend() {
  try {
    console.log('🔐 Logging in...');
    
    // Login first
    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nimbus-user-1757447187283@example.com',
        password: 'TestPassword123!'
      })
    });
    
    const loginResult = await loginResponse.json();
    
    if (!loginResult.success) {
      throw new Error(`Login failed: ${loginResult.error}`);
    }
    
    const sessionToken = loginResult.session_token;
    console.log('✅ Login successful');
    
    // Send test email
    console.log('📧 Sending test email...');
    
    const emailResponse = await fetch(`${apiUrl}/api/function`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'email.test',
        payload: {
          to: 'inc64com@gmail.com'
        }
      })
    });
    
    const emailResult = await emailResponse.json();
    console.log('📧 Email response:', JSON.stringify(emailResult, null, 2));
    
    if (emailResult.success) {
      console.log('✅ Test email sent successfully!');
      console.log('📧 Message ID:', emailResult.data?.messageId || 'N/A');
      console.log('📧 Recipient:', emailResult.data?.recipient || 'N/A');
      console.log('📧 Message:', emailResult.data?.message || 'N/A');
    } else {
      console.error('❌ Failed to send test email:', emailResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testMailerSend();
