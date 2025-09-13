/**
 * Test Single Page Upload
 * Upload one page and check if logs appear in dashboard
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

async function uploadSinglePage() {
  try {
    console.log('📄 Testing single page upload with logging...');
    
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
    
    // Load a different page (hublot)
    const filePath = path.join(__dirname, 'gulp', '.nimbus', 'maps', 'hublot-watch-repair.json');
    const extracted = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const pageId = generatePageId('www.repairsbypost.com', extracted.route);
    console.log(`📄 Uploading: ${extracted.route}`);
    console.log(`🆔 Page ID: ${pageId}`);
    
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
        original_path: extracted.path,
        file_name: 'hublot-watch-repair.json',
        extracted_at: new Date().toISOString()
      }
    };
    
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
    console.log('📡 Upload response logs:', JSON.stringify(pageResult.logs || [], null, 2));
    
    if (pageResult.success) {
      console.log('✅ Page uploaded successfully!');
      console.log(`🆔 Page ID: ${pageResult.data?.page_id}`);
      
      // Now check if logs appear
      console.log('\n📋 Checking for logs...');
      
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
            limit: 5
          }
        })
      });
      
      const logsData = await logsResponse.json();
      
      if (logsData.success) {
        console.log(`📊 Recent info logs: ${logsData.data.logs.length}`);
        logsData.data.logs.forEach(log => {
          console.log(`   ${log.timestamp} | ${log.action} | ${log.message}`);
        });
      } else {
        console.error('❌ Failed to get logs:', logsData.error);
      }
      
    } else {
      console.error('❌ Page upload failed:', pageResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

uploadSinglePage();
