import { Router, Request, Response } from 'express';
import db from '../db/connection';
import { authenticate, requireAdmin, requireUploaderOrAdmin } from '../middleware';
import { success, error } from '../utils/response';

const router = Router();

// GET /tags - List all tags
router.get('/', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query(`
      SELECT t.*, u.username as created_by_username,
        (SELECT COUNT(*) FROM video_tags WHERE tag_id = t.id) as video_count
      FROM tags t
      LEFT JOIN users u ON t.created_by = u.id
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
      'INSERT INTO tags (name, created_by) VALUES ($1, $2) RETURNING *',
      [name.toLowerCase().trim(), req.user!.userId]
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

// DELETE /tags/:id - Delete a tag (owner or admin)
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const existing = await db.query('SELECT created_by FROM tags WHERE id = $1', [id]);

    if (existing.rows.length === 0) {
      error(res, 'Tag not found.', 404);
      return;
    }

    // Only the creator or admin can delete
    const isOwner = existing.rows[0].created_by === req.user!.userId;
    const isAdmin = req.user!.role === 'admin';
    if (!isOwner && !isAdmin) {
      error(res, 'You can only delete tags you created.', 403);
      return;
    }

    await db.query('DELETE FROM tags WHERE id = $1', [id]);
    success(res, { message: 'Tag deleted successfully.' });
  } catch (err) {
    console.error('[TAGS] Delete error:', err);
    error(res, 'Internal server error.', 500);
  }
});

export default router;
