import { Request, Response, NextFunction } from 'express';
export interface JwtPayload {
    userId: string;
    username: string;
    role: 'admin' | 'uploader';
}
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
export declare function authenticate(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map