-- DataModel Generated Schema
-- Generated at: 2025-09-11T05:21:29.708Z

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT DEFAULT '',
  email_verified INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  last_login TIMESTAMP,
  subscription_status TEXT,
  is_admin INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);


-- Table: project_meta
CREATE TABLE IF NOT EXISTS project_meta (
  project_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  stats TEXT DEFAULT '{"total_pages":0,"processing_pages":0,"completed_pages":0,"last_activity":null}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_meta_user_id ON project_meta (user_id);

-- Table: page_meta
CREATE TABLE IF NOT EXISTS page_meta (
  page_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  last_processed TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_page_meta_project_id ON page_meta (project_id);
CREATE INDEX IF NOT EXISTS idx_page_meta_user_id ON page_meta (user_id);

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  action TEXT NOT NULL,
  message TEXT NOT NULL,
  level TEXT DEFAULT 'info',
  entity_ids TEXT DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs (entity_id);

