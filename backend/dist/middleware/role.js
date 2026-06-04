"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
exports.requireAdmin = requireAdmin;
exports.requireUploaderOrAdmin = requireUploaderOrAdmin;
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required.' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions.' });
            return;
        }
        next();
    };
}
function requireAdmin() {
    return requireRole('admin');
}
function requireUploaderOrAdmin() {
    return requireRole('admin', 'uploader');
}
//# sourceMappingURL=role.js.map