"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const pg_1 = require("pg");
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'video_archive',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
};
const pool = new pg_1.Pool(poolConfig);
pool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle client:', err);
    process.exit(-1);
});
exports.db = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
    pool,
};
exports.default = exports.db;
//# sourceMappingURL=connection.js.map