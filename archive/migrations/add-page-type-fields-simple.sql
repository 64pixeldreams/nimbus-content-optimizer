-- Add page type fields to page_meta table (simple version)
ALTER TABLE page_meta ADD COLUMN page_type TEXT DEFAULT 'page';
ALTER TABLE page_meta ADD COLUMN page_type_confidence REAL DEFAULT 1.0;
ALTER TABLE page_meta ADD COLUMN page_type_method TEXT DEFAULT 'fallback';
