import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/connection';
import { authenticate, requireAdmin } from '../middleware';
import { success, error } from '../utils/response';

const router = Router();

// GET /users - List all users (admin only)
router.get('/', authenticate, requireAdmin(), async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query(
      'SELECT id, username, role, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    success(res, result.rows);
  } catch (err) {
    console.error('[USERS] List error:', err);
    error(res, 'Erreur interne du serveur.', 500);
  }
});

// POST /users - Create a new user (admin only)
router.post('/', authenticate, requireAdmin(), async (req: Request, res: Response): Promise<void> => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    error(res, 'Nom d\'utilisateur, mot de passe et rôle requis.', 400);
    return;
  }

  if (!['admin', 'uploader'].includes(role)) {
    error(res, 'Le rôle doit être \'admin\' ou \'uploader\'.', 400);
    return;
  }

  if (password.length < 6) {
    error(res, 'Le mot de passe doit contenir au moins 6 caractères.', 400);
    return;
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      error(res, 'Ce nom d\'utilisateur existe déjà.', 409);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at',
      [username, passwordHash, role]
    );

    success(res, result.rows[0], 201);
  } catch (err) {
    console.error('[USERS] Create error:', err);
    error(res, 'Erreur interne du serveur.', 500);
  }
});

// PUT /users/:id - Update a user (admin only)
router.put('/:id', authenticate, requireAdmin(), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { username, password, role } = req.body;

  try {
    const existing = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      error(res, 'Utilisateur introuvable.', 404);
      return;
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (username) {
      const duplicate = await db.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, id]);
      if (duplicate.rows.length > 0) {
        error(res, 'Ce nom d\'utilisateur est déjà pris.', 409);
        return;
      }
      updates.push(`username = $${paramIndex++}`);
      values.push(username);
    }

    if (password) {
      if (password.length < 6) {
        error(res, 'Le mot de passe doit contenir au moins 6 caractères.', 400);
        return;
      }
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(passwordHash);
    }

    if (role) {
      if (!['admin', 'uploader'].includes(role)) {
        error(res, 'Le rôle doit être \'admin\' ou \'uploader\'.', 400);
        return;
      }
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }

    if (updates.length === 0) {
      error(res, 'Aucun champ à mettre à jour.', 400);
      return;
    }

    values.push(id);
    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, username, role, created_at, updated_at`,
      values
    );

    success(res, result.rows[0]);
  } catch (err) {
    console.error('[USERS] Update error:', err);
    error(res, 'Erreur interne du serveur.', 500);
  }
});

// DELETE /users/:id - Delete a user (admin only)
router.delete('/:id', authenticate, requireAdmin(), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    // Prevent deleting yourself
    if (id === req.user!.userId) {
      error(res, 'Vous ne pouvez pas supprimer votre propre compte.', 400);
      return;
    }

    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      error(res, 'Utilisateur introuvable.', 404);
      return;
    }

    success(res, { message: 'Utilisateur supprimé avec succès.' });
  } catch (err) {
    console.error('[USERS] Delete error:', err);
    error(res, 'Erreur interne du serveur.', 500);
  }
});

export default router;
