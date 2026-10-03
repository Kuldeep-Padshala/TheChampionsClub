const express = require('express');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const {
  getAllUsers,
  toggleUserLock,
  forcePasswordReset,
  getRolesAndPermissions,
  updateRolePermissions,
  updateClubProfile,
  updateClubSettings,
  addTaxRate,
  getAuditLogs
} = require('../controllers/admin.controller');

const router = express.Router();

// Require auth and SYSTEM_ADMIN role
router.use(requireAuth);
router.use(requireRole('SYSTEM_ADMIN'));

// 1. User & Security Management
router.get('/users', getAllUsers);
router.patch('/users/:id/lock', toggleUserLock);
router.post('/users/:id/reset-password', forcePasswordReset);

// 2. Role & Permission Configuration
router.get('/roles', getRolesAndPermissions);
router.patch('/roles/:id/permissions', updateRolePermissions);

// 3. Global Club Settings & Taxes
router.patch('/profile', updateClubProfile);
router.patch('/settings', updateClubSettings);
router.post('/tax-rates', addTaxRate);

// 4. System Auditing
router.get('/audit-logs', getAuditLogs);

module.exports = router;
