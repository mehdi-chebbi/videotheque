"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const connection_1 = __importDefault(require("../db/connection"));
const middleware_1 = require("../middleware");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
// GET /users - List all users (admin only)
router.get('/', middleware_1.authenticate, (0, middleware_1.requireAdmin)(), async (_req, res) => {
    try {
        const result = await connection_1.default.query('SELECT id, username, role, created_at, updated_at FROM users ORDER BY created_at DESC');
        (0, response_1.success)(res, result.rows);
    }
    catch (err) {
        console.error('[USERS] List error:', err);
        (0, response_1.error)(res, 'Internal server error.', 500);
    }
});
// POST /users - Create a new user (admin only)
router.post('/', middleware_1.authenticate, (0, middleware_1.requireAdmin)(), async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
        (0, response_1.error)(res, 'Username, password, and role are required.', 400);
        return;
    }
    if (!['admin', 'uploader'].includes(role)) {
        (0, response_1.error)(res, 'Role must be either "admin" or "uploader".', 400);
        return;
    }
    if (password.length < 6) {
        (0, response_1.error)(res, 'Password must be at least 6 characters.', 400);
        return;
    }
    try {
        const existing = await connection_1.default.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existing.rows.length > 0) {
            (0, response_1.error)(res, 'Username already exists.', 409);
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const result = await connection_1.default.query('INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at', [username, passwordHash, role]);
        (0, response_1.success)(res, result.rows[0], 201);
    }
    catch (err) {
        console.error('[USERS] Create error:', err);
        (0, response_1.error)(res, 'Internal server error.', 500);
    }
});
// PUT /users/:id - Update a user (admin only)
router.put('/:id', middleware_1.authenticate, (0, middleware_1.requireAdmin)(), async (req, res) => {
    const { id } = req.params;
    const { username, password, role } = req.body;
    try {
        const existing = await connection_1.default.query('SELECT id FROM users WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            (0, response_1.error)(res, 'User not found.', 404);
            return;
        }
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (username) {
            const duplicate = await connection_1.default.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, id]);
            if (duplicate.rows.length > 0) {
                (0, response_1.error)(res, 'Username already taken.', 409);
                return;
            }
            updates.push(`username = $${paramIndex++}`);
            values.push(username);
        }
        if (password) {
            if (password.length < 6) {
                (0, response_1.error)(res, 'Password must be at least 6 characters.', 400);
                return;
            }
            const salt = await bcryptjs_1.default.genSalt(10);
            const passwordHash = await bcryptjs_1.default.hash(password, salt);
            updates.push(`password_hash = $${paramIndex++}`);
            values.push(passwordHash);
        }
        if (role) {
            if (!['admin', 'uploader'].includes(role)) {
                (0, response_1.error)(res, 'Role must be either "admin" or "uploader".', 400);
                return;
            }
            updates.push(`role = $${paramIndex++}`);
            values.push(role);
        }
        if (updates.length === 0) {
            (0, response_1.error)(res, 'No fields to update.', 400);
            return;
        }
        values.push(id);
        const result = await connection_1.default.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, username, role, created_at, updated_at`, values);
        (0, response_1.success)(res, result.rows[0]);
    }
    catch (err) {
        console.error('[USERS] Update error:', err);
        (0, response_1.error)(res, 'Internal server error.', 500);
    }
});
// DELETE /users/:id - Delete a user (admin only)
router.delete('/:id', middleware_1.authenticate, (0, middleware_1.requireAdmin)(), async (req, res) => {
    const { id } = req.params;
    try {
        // Prevent deleting yourself
        if (id === req.user.userId) {
            (0, response_1.error)(res, 'You cannot delete your own account.', 400);
            return;
        }
        const result = await connection_1.default.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            (0, response_1.error)(res, 'User not found.', 404);
            return;
        }
        (0, response_1.success)(res, { message: 'User deleted successfully.' });
    }
    catch (err) {
        console.error('[USERS] Delete error:', err);
        (0, response_1.error)(res, 'Internal server error.', 500);
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map