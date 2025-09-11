#!/usr/bin/env node

/**
 * Migration script to populate project stats from existing pages
 * This will count pages for each project and update the stats fields
 */

async function migrateProjectStats() {
  console.log('🔄 Starting project stats migration...');
  
  try {
    // Get all projects
    console.log('📋 Fetching all projects...');
    const projectsResponse = await fetch('https://nimbus-platform.martin-598.workers.dev/api/function', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'project.list',
        payload: {}
      })
    });
    
    const projectsResult = await projectsResponse.json();
    if (!projectsResult.success) {
      throw new Error(`Failed to fetch projects: ${projectsResult.error}`);
    }
    
    const projects = projectsResult.data;
    console.log(`📊 Found ${projects.length} projects to update`);
    
    // Update each project's stats
    for (const project of projects) {
      console.log(`\n🔍 Processing project: ${project.name} (${project.project_id})`);
      
      // Get pages for this project
      const pagesResponse = await fetch('https://nimbus-platform.martin-598.workers.dev/api/function', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'page.list',
          payload: { project_id: project.project_id }
        })
      });
      
      const pagesResult = await pagesResponse.json();
      if (!pagesResult.success) {
        console.log(`❌ Failed to fetch pages for project ${project.name}: ${pagesResult.error}`);
        continue;
      }
      
      const pages = pagesResult.data;
      const totalPages = pages.length;
      const processingPages = pages.filter(p => p.status === 'processing').length;
      const completedPages = pages.filter(p => p.status === 'completed').length;
      
      console.log(`   📄 Pages: ${totalPages} total, ${processingPages} processing, ${completedPages} completed`);
      
      // Update project stats
      const updateResponse = await fetch('https://nimbus-platform.martin-598.workers.dev/api/function', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'project.update',
          payload: {
            project_id: project.project_id,
            stats: {
              total_pages: totalPages,
              processing_pages: processingPages,
              completed_pages: completedPages,
              last_activity: new Date().toISOString()
            }
          }
        })
      });
      
      const updateResult = await updateResponse.json();
      if (updateResult.success) {
        console.log(`   ✅ Updated stats for ${project.name}`);
      } else {
        console.log(`   ❌ Failed to update stats for ${project.name}: ${updateResult.error}`);
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log('📊 Dashboard should now show correct page counts for all projects');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateProjectStats();
