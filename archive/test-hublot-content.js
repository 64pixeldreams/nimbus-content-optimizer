const fs = require('fs');
const path = require('path');

// Test script to debug Hublot content issue
async function testHublotContent() {
  console.log('🔍 DEBUGGING HUBLOT CONTENT ISSUE\n');

  // Check if Hublot cache exists and what it contains
  const cachePath = '.nimbus/work/brand-demo/cache/hublot-watch-repair-tier-3.json';
  
  if (fs.existsSync(cachePath)) {
    console.log('✅ Hublot cache found');
    const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    
    console.log('\n📊 CACHE ANALYSIS:');
    console.log('Blocks count:', cacheData.result.blocks?.length || 0);
    console.log('Blocks array:', JSON.stringify(cacheData.result.blocks, null, 2));
    
    if (cacheData.result.v2_metadata) {
      console.log('\n🔍 V2 METADATA:');
      console.log('Failed prompts:', cacheData.result.v2_metadata.failed_prompts);
      console.log('Content prompt success:', cacheData.result.v2_metadata.individual_results.find(r => r.prompt_type === 'content')?.success);
      console.log('Content prompt error:', cacheData.result.v2_metadata.individual_results.find(r => r.prompt_type === 'content')?.error);
    }
    
    if (cacheData.result.notes) {
      console.log('\n📝 AI NOTES:');
      cacheData.result.notes.forEach((note, i) => {
        if (note.includes('[content]')) {
          console.log(`Content note ${i + 1}:`, note);
        }
      });
    }
  } else {
    console.log('❌ Hublot cache not found');
  }

  // Check if there are any scan files
  const scanDir = '.nimbus/work/brand-demo/scan';
  if (fs.existsSync(scanDir)) {
    console.log('\n📁 SCAN DIRECTORY CONTENTS:');
    const files = fs.readdirSync(scanDir);
    files.forEach(file => {
      if (file.includes('hublot')) {
        console.log('Found Hublot scan file:', file);
      }
    });
  } else {
    console.log('\n📁 No scan directory found');
  }

  // Check working vs failing pages
  console.log('\n🔍 COMPARING WORKING VS FAILING PAGES:');
  
  const workingPages = ['hamilton-watch-repair', 'guess-watch-repair'];
  const failingPage = 'hublot-watch-repair';
  
  workingPages.forEach(page => {
    const cacheFile = `.nimbus/work/brand-demo/cache/${page}-tier-3.json`;
    if (fs.existsSync(cacheFile)) {
      const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      console.log(`✅ ${page}: ${data.result.blocks?.length || 0} blocks`);
    }
  });
  
  const hublotCache = `.nimbus/work/brand-demo/cache/${failingPage}-tier-3.json`;
  if (fs.existsSync(hublotCache)) {
    const data = JSON.parse(fs.readFileSync(hublotCache, 'utf8'));
    console.log(`❌ ${failingPage}: ${data.result.blocks?.length || 0} blocks`);
  }
}

testHublotContent().catch(console.error);
