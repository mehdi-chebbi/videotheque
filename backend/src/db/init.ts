import db from './connection';

const CREATE_USERS_TABLE = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'uploader')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const CREATE_PROJECTS_TABLE = `
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const CREATE_VIDEOS_TABLE = `
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  thumbnail_path VARCHAR(500),
  file_size BIGINT NOT NULL DEFAULT 0,
  duration FLOAT,
  format VARCHAR(50),
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const CREATE_TAGS_TABLE = `
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const CREATE_VIDEO_TAGS_TABLE = `
CREATE TABLE IF NOT EXISTS video_tags (
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (video_id, tag_id)
);
`;

const CREATE_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_videos_project_id ON videos(project_id);
CREATE INDEX IF NOT EXISTS idx_videos_uploaded_by ON videos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_title ON videos USING gin(to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
`;

const CREATE_UPDATED_AT_TRIGGER = `
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at'
  ) THEN
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_projects_updated_at'
  ) THEN
    CREATE TRIGGER update_projects_updated_at
      BEFORE UPDATE ON projects
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_videos_updated_at'
  ) THEN
    CREATE TRIGGER update_videos_updated_at
      BEFORE UPDATE ON videos
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;
`;

const SEED_ADMIN = `
INSERT INTO users (username, password_hash, role)
SELECT 'admin', '$2a$10$dummyhashreplaceonfirstsetup', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
`;

export async function initializeDatabase(): Promise<void> {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    console.log('[DB] Creating tables...');
    await client.query(CREATE_USERS_TABLE);
    await client.query(CREATE_PROJECTS_TABLE);
    await client.query(CREATE_TAGS_TABLE);
    await client.query(CREATE_VIDEOS_TABLE);
    await client.query(CREATE_VIDEO_TAGS_TABLE);

    console.log('[DB] Creating indexes...');
    await client.query(CREATE_INDEXES);

    console.log('[DB] Creating triggers...');
    await client.query(CREATE_UPDATED_AT_TRIGGER);

    console.log('[DB] Seeding default admin...');
    await client.query(SEED_ADMIN);

    await client.query('COMMIT');
    console.log('[DB] Database initialized successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[DB] Initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}
