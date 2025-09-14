/**
 * Simple Page Status Update Test
 * Updates existing pages to different statuses
 */

const API_BASE = 'https://nimbus-platform.martin-598.workers.dev';

async function updatePageStatus() {
    console.log('📝 Testing Page Status Updates...\n');
    
    // Use your session token
    const sessionToken = 'd0b3b9e1269c16845e7a1358d409dfe5e46718fa540d5a372bafc91f76ea3784';
    
    // Test page IDs (you can get these from your dashboard or use existing ones)
    const testPages = [
        'page:wwwrepairsbypostcom_/brands/cartier_watch_repair_495e350d',
        'page:wwwrepairsbypostcom_/brands/rolex_watch_repair_8b2a1c4f',
        'page:wwwrepairsbypostcom_/brands/omega_watch_repair_7d3e9a2b'
    ];
    
    const statuses = ['processing', 'completed', 'processing'];
    
    for (let i = 0; i < testPages.length; i++) {
        const pageId = testPages[i];
        const status = statuses[i];
        
        console.log(`${i + 1}. Updating ${pageId} to ${status}...`);
        
        try {
            const result = await fetch(`${API_BASE}/api/function`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Token': sessionToken
                },
                body: JSON.stringify({
                    action: 'page.update',
                    payload: {
                        page_id: pageId,
                        status: status,
                        last_processed: new Date().toISOString(),
                        processing_time_ms: Math.floor(Math.random() * 2000) + 500
                    }
                })
            }).then(r => r.json());
            
            if (result.success) {
                console.log(`   ✅ Updated to ${status}`);
            } else {
                console.log(`   ❌ Failed:`, result.error);
            }
            
        } catch (error) {
            console.log(`   ❌ Error:`, error.message);
        }
        
        // Small delay between updates
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n✅ Page status updates complete!');
    console.log('📊 Check your dashboard to see if the changes appear');
}

// Run the test
updatePageStatus();
