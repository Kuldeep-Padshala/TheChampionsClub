"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const token_service_1 = require("../services/token.service");
const auth_service_1 = require("../services/auth.service");
function requireAuth(req, res, next) {
    var _a;
    const authHeader = req.headers.authorization;
    const bearerToken = (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer ')) ? authHeader.slice(7).trim() : undefined;
    const token = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a['__access_token']) || bearerToken;
    if (!token) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    try {
        const payload = (0, token_service_1.verifyAccessToken)(token);
        req.user = { id: payload.userId, name: '', email: payload.email };
        next();
    }
    catch (_b) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
}
function requireRole(...allowedRoles) {
    return async (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        try {
            const userRoles = await (0, auth_service_1.getUserRoles)(req.user.id);
            const isAllowed = userRoles.some((r) => allowedRoles.includes(r) || r === 'OWNER' || r === 'MANAGER');
            if (!isAllowed) {
                res.status(403).json({ success: false, message: 'Forbidden: Front desk staff role required' });
                return;
            }
            req.user.roles = userRoles;
            next();
        }
        catch (err) {
            console.error('[requireRole error]', err);
            res.status(500).json({ success: false, message: 'Role authorization failed' });
        }
    };
}
