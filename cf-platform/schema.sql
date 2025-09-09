-- NimbusAI Platform D1 Schema
-- DataModel Generated Schema
-- Generated at: 2025-09-08T02:58:42.731Z

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
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

-- Page optimization logs (not managed by DataModel)
-- Shows timeline of what happened during page processing
CREATE TABLE IF NOT EXISTS page_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'uploaded', 'processing_started', 'optimization_ran', 'analyzer_ran', 'completed', 'failed'
  message TEXT,
  duration_ms INTEGER,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSON -- Store prompt used, tokens consumed, etc
);

CREATE INDEX IF NOT EXISTS idx_page_logs_page_id ON page_logs (page_id);
CREATE INDEX IF NOT EXISTS idx_page_logs_project_id ON page_logs (project_id);
CREATE INDEX IF NOT EXISTS idx_page_logs_timestamp ON page_logs (timestamp);

