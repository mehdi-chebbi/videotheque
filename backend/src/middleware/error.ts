import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[ERROR]', err.message, err.stack);

  if (err.message.includes('Type de fichier invalide')) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ error: 'Jeton invalide.' });
    return;
  }

  res.status(500).json({ error: 'Erreur interne du serveur.' });
}
