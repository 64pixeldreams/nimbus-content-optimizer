-- Migration: Create notifications table
-- Date: 2025-09-11
-- Description: Create notifications table for in-app notifications, webhooks, and email alerts

CREATE TABLE IF NOT EXISTS notifications (
  notification_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  seen BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  expires_at TEXT,
  action_url TEXT,
  metadata TEXT, -- JSON stored as TEXT
  priority TEXT DEFAULT 'normal',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_seen ON notifications(user_id, seen);
CREATE INDEX IF NOT EXISTS idx_notifications_user_dismissed ON notifications(user_id, dismissed);
