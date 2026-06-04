"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_1 = __importDefault(require("../db/connection"));
const auth_1 = require("../middleware/auth");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_to_a_long_random_string';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
// POST /auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        (0, response_1.error)(res, 'Username and password are required.', 400);
        return;
    }
    try {
        const result = await connection_1.default.query('SELECT id, username, password_hash, role FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            (0, response_1.error)(res, 'Invalid username or password.', 401);
            return;
        }
        const user = result.rows[0];
        const isValid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValid) {
            (0, response_1.error)(res, 'Invalid username or password.', 401);
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        (0, response_1.success)(res, {
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        });
    }
    catch (err) {
        console.error('[AUTH] Login error:', err);
        (0, response_1.error)(res, 'Internal server error.', 500);
    }
});
// GET /auth/me
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        const result = await connection_1.default.query('SELECT id, username, role, created_at FROM users WHERE id = $1', [req.user.userId]);
        if (result.rows.length === 0) {
            (0, response_1.error)(res, 'User not found.', 404);
            return;
        }
        (0, response_1.success)(res, result.rows[0]);
    }
    catch (err) {
        console.error('[AUTH] Me error:', err);
        (0, response_1.error)(res, 'Internal server error.', 500);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map