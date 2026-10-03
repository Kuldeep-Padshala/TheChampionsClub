const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const {
  getAllUsers,
  toggleUserLock,
  forcePasswordReset,
  getRolesAndPermissions,
  updateRolePermissions,
  getClubProfile,
  updateClubProfile,
  getClubSettings,
  updateClubSettings,
  getTaxRates,
  addTaxRate,
  toggleTaxRate,
  getAuditLogs,
  getAdminStats
} = require('../controllers/admin.controller');

const router = express.Router();

// Require auth and SYSTEM_ADMIN role
router.use(requireAuth);
router.use(requireRole('SYSTEM_ADMIN', 'ADMIN'));

// 0. Dashboard Stats
router.get('/stats', getAdminStats);

// 1. User & Security Management
router.get('/users', getAllUsers);
router.patch('/users/:id/lock', toggleUserLock);
router.post('/users/:id/reset-password', forcePasswordReset);

// 2. Role & Permission Configuration
router.get('/roles', getRolesAndPermissions);
router.patch('/roles/:id/permissions', updateRolePermissions);

// 3. Global Club Settings & Profile
router.get('/profile', getClubProfile);
router.patch('/profile', updateClubProfile);
router.get('/settings', getClubSettings);
router.patch('/settings', updateClubSettings);

// 4. Tax Rates Management
router.get('/tax-rates', getTaxRates);
router.post('/tax-rates', addTaxRate);
router.patch('/tax-rates/:id/toggle', toggleTaxRate);

// 5. System Auditing
router.get('/audit-logs', getAuditLogs);

module.exports = router;
