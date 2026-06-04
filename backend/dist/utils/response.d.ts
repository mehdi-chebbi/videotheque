import { Response } from 'express';
export declare function success(res: Response, data: unknown, statusCode?: number): Response;
export declare function error(res: Response, message: string, statusCode?: number): Response;
export declare function paginated(res: Response, data: unknown[], total: number, page: number, limit: number): Response;
//# sourceMappingURL=response.d.ts.map