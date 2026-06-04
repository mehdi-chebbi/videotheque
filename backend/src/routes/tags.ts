import { Router, Request, Response } from 'express';
import db from '../db/connection';
import { authenticate, requireAdmin, requireUploaderOrAdmin } from '../middleware';
import { success, error } from '../utils/response';

const router = Router();

// GET /tags - List all tags
router.get('/', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query(`
      SELECT t.*, (SELECT COUNT(*) FROM video_tags WHERE tag_id = t.id) as video_count
      FROM tags t
      ORDER BY t.name
    `);
    success(res, result.rows);
  } catch (err) {
    console.error('[TAGS] List error:', err);
    error(res, 'Internal server error.', 500);
  }
});

// POST /tags - Create a tag (admin + uploader)
router.post('/', authenticate, requireUploaderOrAdmin(), async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body;

  if (!name) {
    error(res, 'Tag name is required.', 400);
    return;
  }

  try {
    const result = await db.query(
      'INSERT INTO tags (name) VALUES ($1) RETURNING *',
      [name.toLowerCase().trim()]
    );

    success(res, result.rows[0], 201);
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23505') {
      error(res, 'Tag already exists.', 409);
      return;
    }
    console.error('[TAGS] Create error:', err);
    error(res, 'Internal server error.', 500);
  }
});

// DELETE /tags/:id - Delete a tag (admin only)
router.delete('/:id', authenticate, requireAdmin(), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM tags WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      error(res, 'Tag not found.', 404);
      return;
    }

    success(res, { message: 'Tag deleted successfully.' });
  } catch (err) {
    console.error('[TAGS] Delete error:', err);
    error(res, 'Internal server error.', 500);
  }
});

export default router;
