import { Pool } from 'pg';
export declare const db: {
    query: (text: string, params?: unknown[]) => Promise<import("pg").QueryResult<any>>;
    getClient: () => Promise<import("pg").PoolClient>;
    pool: Pool;
};
export default db;
//# sourceMappingURL=connection.d.ts.map