"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    console.error('[ERROR]', err.message, err.stack);
    if (err.message.includes('Invalid file type')) {
        res.status(400).json({ error: err.message });
        return;
    }
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({ error: 'Invalid token.' });
        return;
    }
    res.status(500).json({ error: 'Internal server error.' });
}
//# sourceMappingURL=error.js.map