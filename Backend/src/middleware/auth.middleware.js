const { verifyAccessToken } = require('../services/token.service');
const { getUserRoles } = require('../services/auth.service');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
  const token = req.cookies?.['__access_token'] || bearerToken;
  if (!token) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.userId, name: '', email: payload.email };
    next();
  } catch {
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
      const userRoles = await getUserRoles(req.user.id);
      const isAllowed = userRoles.some(
        (r) => allowedRoles.includes(r) || r === 'OWNER' || r === 'MANAGER'
      );
      if (!isAllowed) {
        res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
        return;
      }
      req.user.roles = userRoles;
      next();
    } catch (err) {
      console.error('[requireRole error]', err);
      res.status(500).json({ success: false, message: 'Role authorization failed' });
    }
  };
}

module.exports = { requireAuth, requireRole };
