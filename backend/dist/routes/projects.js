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
// GET /projects - List all projects
router.get('/', middleware_1.authenticate, async (_req, res) => {
    try {
        const result = await connection_1.default.query(`
      SELECT p.*, u.username as created_by_username,
        (SELECT COUNT(*) FROM videos WHERE project_id = p.id) as video_count
      FROM projects p
      JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
    `);
        (0, response_1.success)(res, result.rows);
    }
    catch (err) {
        console.error('[PROJECTS] List error:', err);
        (0, response_1.error)(res, 'Internal server error.', 500);
    }
});
// GET /projects/:id - Get a single project
router.get('/:id', middleware_1.authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await connection_1.default.query(`
      SELECT p.*, u.username as created_by_username,
        (SELECT COUNT(*) FROM videos WHERE project_id = p.id) as video_count
      FROM projects p
      JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `, [id]);
        if (result.rows.length === 0) {
            (0, response_1.error)(res, 'Project not found.', 404);
            return;
        }
        (0, response_1.success)(res, result.rows[0]);
    }
    catch (err) {
        console.error('[PROJECTS] Get error:', err);
        (0, response_1.error)(res, 'Internal server error.', 500);
    }
});
// POST /projects - Create a project (admin only)
router.post('/', middleware_1.authenticate, (0, middleware_1.requireAdmin)(), async (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        (0, response_1.error)(res, 'Project name is required.', 400);
        return;
    }
    try {
        const existing = await connection_1.default.query('SELECT id FROM projects WHERE name = $1', [name]);
        if (existing.rows.length > 0) {
            (0, response_1.error)(res, 'A project with this name already exists.', 409);
            return;
        }
        const result = await connection_1.default.query('INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *', [name, description || null, req.user.userId]);
        (0, response_1.success)(res, result.rows[0], 201);
    }
    catch (err) {
        console.error('[PROJECTS] Create error:', err);
        (0, response_1.error)(res, 'Internal server error.', 500);
    }
});
// PUT /projects/:id - Update a project (admin only)
router.put('/:id', middleware_1.authenticate, (0, middleware_1.requireAdmin)(), async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    try {
        const existing = await connection_1.default.query('SELECT id FROM projects WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            (0, response_1.error)(res, 'Project not found.', 404);
            return;
        }
        if (name) {
            const duplicate = await connection_1.default.query('SELECT id FROM projects WHERE name = $1 AND id != $2', [name, id]);
            if (duplicate.rows.length > 0) {
                (0, response_1.error)(res, 'A project with this name already exists.', 409);
                return;
            }
        }
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (name) {
            updates.push(`name = $${paramIndex++}`);
            values.push(name);
        }
        if (description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            values.push(description);
        }
        if (updates.length === 0) {
            (0, response_1.error)(res, 'No fields to update.', 400);
            return;
        }
        values.push(id);
        const result = await connection_1.default.query(`UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
        (0, response_1.success)(res, result.rows[0]);
    }
    catch (err) {
        console.error('[PROJECTS] Update error:', err);
        (0, response_1.error)(res, 'Internal server error.', 500);
    }
});
// DELETE /projects/:id - Delete a project (admin only)
router.delete('/:id', middleware_1.authenticate, (0, middleware_1.requireAdmin)(), async (req, res) => {
    const { id } = req.params;
    try {
        // Get project name for storage cleanup
        const project = await connection_1.default.query('SELECT name FROM projects WHERE id = $1', [id]);
        if (project.rows.length === 0) {
            (0, response_1.error)(res, 'Project not found.', 404);
            return;
        }
        // Cascade delete will remove associated videos and video_tags
        await connection_1.default.query('DELETE FROM projects WHERE id = $1', [id]);
        (0, response_1.success)(res, { message: 'Project deleted successfully.' });
    }
    catch (err) {
        console.error('[PROJECTS] Delete error:', err);
        (0, response_1.error)(res, 'Internal server error.', 500);
    }
});
exports.default = router;
//# sourceMappingURL=projects.js.map