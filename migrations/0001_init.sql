CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_slug TEXT NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  attachment_key TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_post
ON comments(post_slug, created_at);

CREATE TABLE IF NOT EXISTS uploads (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  content_type TEXT,
  size INTEGER,
  created_at TEXT NOT NULL
);
