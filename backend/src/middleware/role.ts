import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from './auth';

type Role = JwtPayload['role'];

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentification requise.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Permissions insuffisantes.' });
      return;
    }

    next();
  };
}

export function requireAdmin() {
  return requireRole('admin');
}

export function requireUploaderOrAdmin() {
  return requireRole('admin', 'uploader');
}
