-- Add page type fields to page_meta table
-- Migration: add-page-type-fields.sql

-- Add page_type column
ALTER TABLE page_meta ADD COLUMN page_type TEXT DEFAULT 'page';

-- Add page_type_confidence column  
ALTER TABLE page_meta ADD COLUMN page_type_confidence REAL DEFAULT 1.0;

-- Add page_type_method column
ALTER TABLE page_meta ADD COLUMN page_type_method TEXT DEFAULT 'fallback';

-- Update existing pages with detected page types
UPDATE page_meta SET 
  page_type = CASE 
    WHEN url = '/' OR url = '/index.html' OR url = '/home' THEN 'home'
    WHEN url LIKE '/branches/%' OR url LIKE '/locations/%' OR url LIKE '/stores/%' OR url LIKE '/local/%' THEN 'local_landing'
    WHEN url LIKE '/brand/%' OR url LIKE '/brands/%' THEN 'brand_landing'  
    WHEN url LIKE '/services/%' OR url LIKE '%-repair%' OR url LIKE '%-service%' THEN 'service_landing'
    WHEN url LIKE '/products/%' OR url LIKE '/shop/%' OR url LIKE '/store/%' THEN 'product_landing'
    WHEN url LIKE '/contact%' THEN 'contact'
    WHEN url LIKE '/about%' THEN 'about'
    WHEN url LIKE '/pricing%' OR url LIKE '/cost%' THEN 'pricing'
    WHEN url LIKE '/faq%' OR url LIKE '/help%' THEN 'faq'
    WHEN url LIKE '/terms%' OR url LIKE '/privacy%' OR url LIKE '/legal%' THEN 'legal'
    WHEN url LIKE '/blog/%' THEN 'blog'
    WHEN url = '/blog' OR url = '/news' OR url = '/help' THEN 'index'
    ELSE 'page'
  END,
  page_type_method = 'migration_url_pattern'
WHERE page_type = 'page' OR page_type IS NULL;
