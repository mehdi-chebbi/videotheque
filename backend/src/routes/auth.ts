import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import db from '../db/connection';
import { authenticate } from '../middleware/auth';
import { success, error } from '../utils/response';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_to_a_long_random_string';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// POST /auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    error(res, 'Nom d\'utilisateur et mot de passe requis.', 400);
    return;
  }

  try {
    const result = await db.query(
      'SELECT id, username, password_hash, role FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      error(res, 'Nom d\'utilisateur ou mot de passe incorrect.', 401);
      return;
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      error(res, 'Nom d\'utilisateur ou mot de passe incorrect.', 401);
      return;
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    error(res, 'Erreur interne du serveur.', 500);
  }
});

// GET /auth/me
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query(
      'SELECT id, username, role, created_at FROM users WHERE id = $1',
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      error(res, 'Utilisateur introuvable.', 404);
      return;
    }

    success(res, result.rows[0]);
  } catch (err) {
    console.error('[AUTH] Me error:', err);
    error(res, 'Erreur interne du serveur.', 500);
  }
});

// POST /auth/change-password
router.post('/change-password', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    error(res, 'Mot de passe actuel et nouveau mot de passe requis.', 400);
    return;
  }

  if (new_password.length < 6) {
    error(res, 'Le nouveau mot de passe doit contenir au moins 6 caractères.', 400);
    return;
  }

  try {
    const result = await db.query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      error(res, 'Utilisateur introuvable.', 404);
      return;
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(current_password, user.password_hash);

    if (!isValid) {
      error(res, 'Le mot de passe actuel est incorrect.', 401);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(new_password, salt);

    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, req.user!.userId]
    );

    success(res, { message: 'Mot de passe modifié avec succès.' });
  } catch (err) {
    console.error('[AUTH] Change password error:', err);
    error(res, 'Erreur interne du serveur.', 500);
  }
});

export default router;
