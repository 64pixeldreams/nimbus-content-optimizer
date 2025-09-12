/**
 * Test script to initialize database tables
 * Calls the system.initialize CloudFunction to auto-create D1 tables
 */

const API_URL = 'https://nimbus-platform.martin-598.workers.dev/api/function';

async function initializeDatabase() {
  console.log('🔧 Initializing database tables...');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'system.initialize',
        data: {}
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Database initialization successful!');
      console.log('Result:', JSON.stringify(result, null, 2));
    } else {
      console.error('❌ Database initialization failed:', result.error);
      console.log('Full response:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Run the initialization
initializeDatabase();
