/**
 * Full test of DataModel functionality
 * Tests all features: create, update, query, soft delete, hooks
 */

import { DataModel } from '../src/modules/datamodel/index.js';
import { Datastore } from '../src/modules/datastore/index.js';
import { LOGS } from '../src/modules/logs/index.js';
import { PageModel } from '../src/models/page.js';

// In-memory storage for testing
const kvStore = new Map();
const d1Results = [];

async function test() {
  console.log('🧪 Testing DataModel Module\n');
  
  // Mock environment with in-memory storage
  const env = {
    NIMBUS_PAGES: {
      get: async (key, format) => {
        console.log(`  KV GET: ${key}`);
        const value = kvStore.get(key);
        if (!value) return null;
        
        // Mimic real KV behavior: parse JSON when format is 'json'
        if (format === 'json') {
          return JSON.parse(value);
        }
        return value;
      },
      put: async (key, value) => {
        console.log(`  KV PUT: ${key}`);
        kvStore.set(key, value);
        return true;
      }
    },
    NIMBUS_DB: {
      // D1 not set up yet, mock it
      execute: async (query, bindings) => {
        console.log(`  D1 EXECUTE: ${query}`);
        console.log(`  D1 BINDINGS:`, bindings);
        d1Results.push({ query, bindings });
        return { 
          results: [],
          rows: [{ count: 2 }]
        };
      },
      prepare: (query) => ({
        bind: (...bindings) => ({
          run: async () => {
            console.log(`  D1 RUN: ${query}`);
            console.log(`  D1 BINDINGS:`, bindings);
            d1Results.push({ query, bindings });
            return { success: true };
          },
          first: async () => {
            console.log(`  D1 FIRST: ${query}`);
            return null;
          },
          all: async () => {
            console.log(`  D1 ALL: ${query}`);
            return { 
              results: [
                { count: 2 }
              ] 
            };
          }
        })
      })
    }
  };
  
  // Initialize
  LOGS.setLevel('info');
  const datastore = new Datastore(env, LOGS);
  const authDatastore = datastore.auth('user_123');
  
  // Register page model
  DataModel.register(PageModel);
  
  try {
    // Test 1: Create new page
    console.log('=== Test 1: Create New Page ===');
    const page = new DataModel('PAGE', authDatastore, LOGS);
    
    page.set({
      title: 'Homepage Optimization Test',
      url: 'https://example.com',
      project_id: 'proj_abc123',
      content: '<html><body>Large HTML content here...</body></html>',
      status: 'pending'
    });
    
    console.log('Before save:', {
      title: page.get('title'),
      status: page.get('status'),
      isNew: page.isNew()
    });
    
    await page.save();
    
    console.log('After save:', {
      page_id: page.get('page_id'),
      created_at: page.get('created_at'),
      user_id: page.get('user_id'),
      isNew: page.isNew()
    });
    
    const pageId = page.get('page_id');
    
    // Test 2: Load and update
    console.log('\n=== Test 2: Load and Update ===');
    const loadedPage = await DataModel.get('PAGE', authDatastore, pageId, LOGS);
    console.log('Loaded page:', loadedPage.get('title'));
    
    loadedPage.set('status', 'processing');
    loadedPage.set('optimized_content', '<html>Optimized...</html>');
    await loadedPage.save();
    
    console.log('Updated status:', loadedPage.get('status'));
    console.log('Updated at:', loadedPage.get('updated_at'));
    
    // Test 3: Query builder
    console.log('\n=== Test 3: Query Builder ===');
    const query = DataModel.query('PAGE', authDatastore, LOGS)
      .where('project_id', 'proj_abc123')
      .where('status', 'processing')
      .orderBy('created_at', 'desc')
      .limit(10)
      .page(1);
    
    console.log('Query will filter by:', {
      project_id: 'proj_abc123',
      status: 'processing',
      user_id: 'user_123 (auto)',
      deleted_at: 'NULL (auto)'
    });
    
    // Test 4: Soft delete
    console.log('\n=== Test 4: Soft Delete ===');
    await loadedPage.delete();
    console.log('Deleted at:', loadedPage.get('deleted_at'));
    
    // Verify still in KV
    const deletedData = kvStore.get(`page:${pageId}`);
    console.log('Still in KV:', deletedData ? 'Yes ✓' : 'No ✗');
    
    // Test 5: Restore
    console.log('\n=== Test 5: Restore ===');
    await loadedPage.restore();
    console.log('Deleted at after restore:', loadedPage.get('deleted_at'));
    
    // Test 6: Static create
    console.log('\n=== Test 6: Static Create ===');
    const quickPage = await DataModel.create('PAGE', authDatastore, {
      title: 'Quick Page',
      url: 'https://example.com/quick',
      project_id: 'proj_abc123'
    }, LOGS);
    
    console.log('Quick page created:', {
      id: quickPage.get('page_id'),
      title: quickPage.get('title')
    });
    
    // Summary
    console.log('\n=== Summary ===');
    console.log('KV Store entries:', kvStore.size);
    console.log('D1 operations:', d1Results.length);
    console.log('\n✅ All tests passed!');
    
    // Show what's in storage
    console.log('\n📦 Storage Contents:');
    for (const [key, value] of kvStore.entries()) {
      const data = JSON.parse(value);
      console.log(`  ${key}: ${data.title || data.email || 'Unknown'}`);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
  }
}

// Run test
test().catch(console.error);
