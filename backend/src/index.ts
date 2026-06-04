import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { initializeDatabase } from './db/init';
import { ensureStorageDir } from './services/storage';
import { errorHandler } from './middleware';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import projectRoutes from './routes/projects';
import videoRoutes from './routes/videos';
import tagRoutes from './routes/tags';
import db from './db/connection';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// ─── Middleware ───────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ─── Health Check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Stats (admin only) ─────────────────────────────────────
app.get('/stats', async (_req, res) => {
  try {
    const [videos, projects, users, tags, storage] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM videos'),
      db.query('SELECT COUNT(*) as count FROM projects'),
      db.query('SELECT COUNT(*) as count FROM users'),
      db.query('SELECT COUNT(*) as count FROM tags'),
      db.query('SELECT COALESCE(SUM(file_size), 0) as total_bytes FROM videos'),
    ]);

    res.json({
      success: true,
      data: {
        total_videos: parseInt(videos.rows[0].count, 10),
        total_projects: parseInt(projects.rows[0].count, 10),
        total_users: parseInt(users.rows[0].count, 10),
        total_tags: parseInt(tags.rows[0].count, 10),
        total_storage_bytes: parseInt(storage.rows[0].total_bytes, 10),
        total_storage_human: formatBytes(parseInt(storage.rows[0].total_bytes, 10)),
      },
    });
  } catch (err) {
    console.error('[STATS] Error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── Routes ──────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/videos', videoRoutes);
app.use('/tags', tagRoutes);

// ─── Error Handler ───────────────────────────────────────────
app.use(errorHandler);

// ─── Helpers ─────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ─── Start Server ────────────────────────────────────────────
async function start() {
  try {
    console.log('[SERVER] Starting Video Archive API...');
    console.log(`[SERVER] Port: ${PORT}`);
    console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);

    // Ensure storage directory exists
    ensureStorageDir();
    console.log('[SERVER] Storage directory ready.');

    // Initialize database
    await initializeDatabase();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[SERVER] 🚀 Video Archive API running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('[SERVER] Failed to start:', err);
    process.exit(1);
  }
}

start();
