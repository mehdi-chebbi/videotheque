import { Router, Request, Response } from 'express';
import db from '../db/connection';
import { authenticate, requireAdmin, requireUploaderOrAdmin } from '../middleware';
import { success, error } from '../utils/response';

const router = Router();

// GET /projects - List all projects
router.get('/', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query(`
      SELECT p.*, u.username as created_by_username,
        (SELECT COUNT(*) FROM videos WHERE project_id = p.id) as video_count
      FROM projects p
      JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
    `);
    success(res, result.rows);
  } catch (err) {
    console.error('[PROJECTS] List error:', err);
    error(res, 'Erreur interne du serveur.', 500);
  }
});

// GET /projects/:id - Get a single project
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await db.query(`
      SELECT p.*, u.username as created_by_username,
        (SELECT COUNT(*) FROM videos WHERE project_id = p.id) as video_count
      FROM projects p
      JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      error(res, 'Projet introuvable.', 404);
      return;
    }

    success(res, result.rows[0]);
  } catch (err) {
    console.error('[PROJECTS] Get error:', err);
    error(res, 'Erreur interne du serveur.', 500);
  }
});

// POST /projects - Create a project (uploader or admin)
router.post('/', authenticate, requireUploaderOrAdmin(), async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body;

  if (!name) {
    error(res, 'Le nom du projet est requis.', 400);
    return;
  }

  try {
    const existing = await db.query('SELECT id FROM projects WHERE name = $1', [name]);
    if (existing.rows.length > 0) {
      error(res, 'Un projet avec ce nom existe déjà.', 409);
      return;
    }

    const result = await db.query(
      'INSERT INTO projects (name, created_by) VALUES ($1, $2) RETURNING *',
      [name, req.user!.userId]
    );

    success(res, result.rows[0], 201);
  } catch (err) {
    console.error('[PROJECTS] Create error:', err);
    error(res, 'Erreur interne du serveur.', 500);
  }
});

// PUT /projects/:id - Update a project (admin only)
router.put('/:id', authenticate, requireAdmin(), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const existing = await db.query('SELECT id FROM projects WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      error(res, 'Projet introuvable.', 404);
      return;
    }

    if (name) {
      const duplicate = await db.query('SELECT id FROM projects WHERE name = $1 AND id != $2', [name, id]);
      if (duplicate.rows.length > 0) {
        error(res, 'Un projet avec ce nom existe déjà.', 409);
        return;
      }
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (updates.length === 0) {
      error(res, 'Aucun champ à mettre à jour.', 400);
      return;
    }

    values.push(id);
    const result = await db.query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    success(res, result.rows[0]);
  } catch (err) {
    console.error('[PROJECTS] Update error:', err);
    error(res, 'Erreur interne du serveur.', 500);
  }
});

// DELETE /projects/:id - Delete a project (owner or admin)
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const existing = await db.query('SELECT created_by FROM projects WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      error(res, 'Projet introuvable.', 404);
      return;
    }

    // Only the creator or admin can delete
    const isOwner = existing.rows[0].created_by === req.user!.userId;
    const isAdmin = req.user!.role === 'admin';
    if (!isOwner && !isAdmin) {
      error(res, 'Vous ne pouvez supprimer que les projets que vous avez créés.', 403);
      return;
    }

    // Cascade delete will remove associated videos and video_tags
    await db.query('DELETE FROM projects WHERE id = $1', [id]);

    success(res, { message: 'Projet supprimé avec succès.' });
  } catch (err) {
    console.error('[PROJECTS] Delete error:', err);
    error(res, 'Erreur interne du serveur.', 500);
  }
});

export default router;
