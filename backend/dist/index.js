"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const init_1 = require("./db/init");
const storage_1 = require("./services/storage");
const middleware_1 = require("./middleware");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const projects_1 = __importDefault(require("./routes/projects"));
const videos_1 = __importDefault(require("./routes/videos"));
const tags_1 = __importDefault(require("./routes/tags"));
const connection_1 = __importDefault(require("./db/connection"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '4000', 10);
// ─── Middleware ───────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
// ─── Health Check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// ─── Stats (admin only) ─────────────────────────────────────
app.get('/stats', async (_req, res) => {
    try {
        const [videos, projects, users, tags, storage] = await Promise.all([
            connection_1.default.query('SELECT COUNT(*) as count FROM videos'),
            connection_1.default.query('SELECT COUNT(*) as count FROM projects'),
            connection_1.default.query('SELECT COUNT(*) as count FROM users'),
            connection_1.default.query('SELECT COUNT(*) as count FROM tags'),
            connection_1.default.query('SELECT COALESCE(SUM(file_size), 0) as total_bytes FROM videos'),
        ]);
        res.json({
            success: true,
            data: {
                total_videos: parseInt(videos.rows[0].count, 10),
                total_projects: parseInt(projects.rows[0].count, 10),
                total_users: parseInt(users.rows[0].count, 10),
                total_tags: parseInt(tags.rows[0].count, 10),
                total_storage_bytes: parseInt(storage.rows[0].total_bytes, 10),
                total_storage_human: formatBytes(parseInt(storage.rows[0].total_bytes, 10)),
            },
        });
    }
    catch (err) {
        console.error('[STATS] Error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});
// ─── Routes ──────────────────────────────────────────────────
app.use('/auth', auth_1.default);
app.use('/users', users_1.default);
app.use('/projects', projects_1.default);
app.use('/videos', videos_1.default);
app.use('/tags', tags_1.default);
// ─── Error Handler ───────────────────────────────────────────
app.use(middleware_1.errorHandler);
// ─── Helpers ─────────────────────────────────────────────────
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
// ─── Start Server ────────────────────────────────────────────
async function start() {
    try {
        console.log('[SERVER] Starting Video Archive API...');
        console.log(`[SERVER] Port: ${PORT}`);
        console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
        // Ensure storage directory exists
        (0, storage_1.ensureStorageDir)();
        console.log('[SERVER] Storage directory ready.');
        // Initialize database
        await (0, init_1.initializeDatabase)();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`[SERVER] 🚀 Video Archive API running on http://0.0.0.0:${PORT}`);
        });
    }
    catch (err) {
        console.error('[SERVER] Failed to start:', err);
        process.exit(1);
    }
}
start();
//# sourceMappingURL=index.js.map