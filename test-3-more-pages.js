/**
 * Test 3 More Page Uploads
 * Upload 3 more pages and verify logs appear consistently
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const apiUrl = 'https://nimbus-platform.martin-598.workers.dev';
const projectId = 'project:mfh4o6amph6zeb';

function generatePageId(domain, url) {
  const cleanDomain = domain.replace(/[^a-z0-9]/gi, '');
  const cleanUrl = url.replace(/[^a-z0-9\/]/gi, '_');
  const hash = crypto.createHash('sha256').update(domain + url).digest('hex').substring(0, 8);
  return `page:${cleanDomain}_${cleanUrl}_${hash}`;
}

async function upload3MorePages() {
  try {
    console.log('📦 Uploading 3 more pages to test logging...');
    
    // Login
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
    
    // Get next 3 files (skip the ones we already uploaded)
    const mapsDir = path.join(__dirname, 'gulp', '.nimbus', 'maps');
    const allFiles = fs.readdirSync(mapsDir).filter(f => f.endsWith('.json'));
    
    // Skip first 4 (3 from first batch + 1 hublot we just uploaded)
    const nextFiles = allFiles.slice(4, 7);
    console.log(`📋 Uploading next 3 pages: ${nextFiles.join(', ')}`);
    
    for (let i = 0; i < nextFiles.length; i++) {
      const file = nextFiles[i];
      console.log(`\n📄 [${i+1}/3] Processing ${file}...`);
      
      // Load extracted JSON
      const filePath = path.join(mapsDir, file);
      const extracted = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      const pageId = generatePageId('www.repairsbypost.com', extracted.route);
      
      const pageData = {
        page_id: pageId,
        project_id: projectId,
        url: extracted.route,
        title: extracted.head.title,
        status: 'extracted',
        extracted_data: {
          head: extracted.head,
          blocks: extracted.blocks,
          above_fold_blocks: extracted.above_fold_blocks,
          rest_of_page_blocks: extracted.rest_of_page_blocks,
          content_dimensions: extracted.content_dimensions || {},
          extraction_stats: extracted.extraction_stats || {}
        },
        metadata: {
          source: 'gulp_extraction',
          file_name: file,
          extracted_at: new Date().toISOString()
        }
      };
      
      console.log(`🔗 URL: ${extracted.route}`);
      console.log(`📝 Title: ${extracted.head.title.substring(0, 50)}...`);
      
      // Upload page
      const pageResponse = await fetch(`${apiUrl}/api/function`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({
          action: 'page.create',
          payload: pageData
        })
      });
      
      const pageResult = await pageResponse.json();
      
      if (pageResult.success) {
        console.log(`✅ [${i+1}/3] ${file} uploaded successfully!`);
        
        // Check for audit log creation in the response
        const hasAuditLog = pageResult.logs?.some(log => 
          log.message === 'Audit log created' || 
          log.message === 'Page creation completed'
        );
        
        if (hasAuditLog) {
          console.log(`📋 [${i+1}/3] Audit log created ✅`);
        } else {
          console.log(`📋 [${i+1}/3] No audit log found ❌`);
        }
        
      } else {
        console.error(`❌ [${i+1}/3] ${file} upload failed:`, pageResult.error);
      }
      
      // Small delay between uploads
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📋 Checking final log count...');
    
    // Check logs after all uploads
    const logsResponse = await fetch(`${apiUrl}/api/function`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'page.logs',
        payload: {
          type: 'user',
          level: 'info',
          limit: 10
        }
      })
    });
    
    const logsData = await logsResponse.json();
    
    if (logsData.success) {
      console.log(`📊 Total recent info logs: ${logsData.data.logs.length}`);
      console.log('📋 Recent activity:');
      logsData.data.logs.slice(0, 5).forEach((log, i) => {
        console.log(`   ${i+1}. ${log.timestamp} | ${log.action} | ${log.message}`);
      });
    }
    
    console.log('\n🎉 3-page upload test completed!');
    console.log('🔗 Check CF dashboard - should show 7 total pages now!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

upload3MorePages();
