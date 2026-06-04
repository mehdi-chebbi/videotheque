"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const connection_1 = __importDefault(require("../db/connection"));
const middleware_1 = require("../middleware");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
// GET /tags - List all tags
router.get('/', middleware_1.authenticate, async (_req, res) => {
    try {
        const result = await connection_1.default.query(`
      SELECT t.*, (SELECT COUNT(*) FROM video_tags WHERE tag_id = t.id) as video_count
      FROM tags t
      ORDER BY t.name
    `);
        (0, response_1.success)(res, result.rows);
    }
    catch (err) {
        console.error('[TAGS] List error:', err);
        (0, response_1.error)(res, 'Internal server error.', 500);
    }
});
// POST /tags - Create a tag (admin + uploader)
router.post('/', middleware_1.authenticate, (0, middleware_1.requireUploaderOrAdmin)(), async (req, res) => {
    const { name } = req.body;
    if (!name) {
        (0, response_1.error)(res, 'Tag name is required.', 400);
        return;
    }
    try {
        const result = await connection_1.default.query('INSERT INTO tags (name) VALUES ($1) RETURNING *', [name.toLowerCase().trim()]);
        (0, response_1.success)(res, result.rows[0], 201);
    }
    catch (err) {
        const pgErr = err;
        if (pgErr.code === '23505') {
            (0, response_1.error)(res, 'Tag already exists.', 409);
            return;
        }
        console.error('[TAGS] Create error:', err);
        (0, response_1.error)(res, 'Internal server error.', 500);
    }
});
// DELETE /tags/:id - Delete a tag (admin only)
router.delete('/:id', middleware_1.authenticate, (0, middleware_1.requireAdmin)(), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await connection_1.default.query('DELETE FROM tags WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            (0, response_1.error)(res, 'Tag not found.', 404);
            return;
        }
        (0, response_1.success)(res, { message: 'Tag deleted successfully.' });
    }
    catch (err) {
        console.error('[TAGS] Delete error:', err);
        (0, response_1.error)(res, 'Internal server error.', 500);
    }
});
exports.default = router;
//# sourceMappingURL=tags.js.map