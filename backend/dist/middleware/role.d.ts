import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from './auth';
type Role = JwtPayload['role'];
export declare function requireRole(...roles: Role[]): (req: Request, res: Response, next: NextFunction) => void;
export declare function requireAdmin(): (req: Request, res: Response, next: NextFunction) => void;
export declare function requireUploaderOrAdmin(): (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=role.d.ts.map