const db = require('../config/db.js');
const bcrypt = require('bcrypt');

// ============================================
// 1. User & Security Management
// ============================================

const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT u.id, u.full_name, u.email, u.phone, u.status, u.last_login_at, 
             GROUP_CONCAT(r.code) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const toggleUserLock = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'lock' or 'unlock'

    let status = 'inactive';
    let locked_until = '2099-12-31 23:59:59'; // Lock forever essentially

    if (action === 'unlock') {
      status = 'active';
      locked_until = null;
    }

    await db.query('UPDATE users SET status = ?, locked_until = ?, updated_at = NOW() WHERE id = ?', [status, locked_until, id]);

    res.status(200).json({ success: true, message: 'User account ' + action + 'ed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const forcePasswordReset = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(new_password, salt);

    await db.query(
      'UPDATE users SET password_hash = ?, must_change_password = 1, locked_until = NULL, failed_login_count = 0, status = "active", updated_at = NOW() WHERE id = ?', 
      [hash, id]
    );

    res.status(200).json({ success: true, message: 'Password reset successfully. User must change it on next login.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 2. Role & Permission Configuration
// ============================================

const getRolesAndPermissions = async (req, res) => {
  try {
    const [roles] = await db.query('SELECT * FROM roles');
    const [permissions] = await db.query('SELECT * FROM role_permissions');

    // Group permissions by role_id
    const rolesWithPerms = roles.map(r => {
      return {
        ...r,
        permissions: permissions.filter(p => p.role_id === r.id).map(p => p.permission_code)
      };
    });

    res.status(200).json({ success: true, data: rolesWithPerms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateRolePermissions = async (req, res) => {
  try {
    const { id } = req.params; // role_id
    const { permissions } = req.body; // array of permission_codes e.g. ["invoice.void", "court.book"]

    // 1. Delete old permissions for this role
    await db.query('DELETE FROM role_permissions WHERE role_id = ?', [id]);

    // 2. Insert new permissions
    if (permissions && permissions.length > 0) {
      const values = permissions.map(code => [id, code]);
      await db.query('INSERT INTO role_permissions (role_id, permission_code) VALUES ?', [values]);
    }

    res.status(200).json({ success: true, message: 'Role permissions updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 3. Global Club Settings & Taxes
// ============================================

const updateClubProfile = async (req, res) => {
  try {
    const { club_name, address, email, phone, website, tax_id, logo_url } = req.body;

    // Assuming a single row exists in club_profile with id = 1
    await db.query(
      'UPDATE club_profile ' +
      'SET club_name = COALESCE(?, club_name), ' +
      '    address = COALESCE(?, address), ' +
      '    email = COALESCE(?, email), ' +
      '    phone = COALESCE(?, phone), ' +
      '    website = COALESCE(?, website), ' +
      '    tax_id = COALESCE(?, tax_id), ' +
      '    logo_url = COALESCE(?, logo_url) ' +
      'WHERE id = 1',
      [club_name, address, email, phone, website, tax_id, logo_url]
    );

    res.status(200).json({ success: true, message: 'Club profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateClubSettings = async (req, res) => {
  try {
    const { setting_key, setting_value } = req.body;

    // Check if setting exists
    const [existing] = await db.query('SELECT id FROM club_settings WHERE setting_key = ?', [setting_key]);

    if (existing.length > 0) {
      await db.query('UPDATE club_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?', [setting_value, setting_key]);
    } else {
      await db.query('INSERT INTO club_settings (setting_key, setting_value, created_at, updated_at) VALUES (?, ?, NOW(), NOW())', [setting_key, setting_value]);
    }

    res.status(200).json({ success: true, message: 'Club setting updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const addTaxRate = async (req, res) => {
  try {
    const { name, rate_percent, is_default } = req.body;

    if (is_default) {
      // Unset previous defaults
      await db.query('UPDATE tax_rates SET is_default = 0');
    }

    const [taxRate] = await db.query(
      'INSERT INTO tax_rates (name, rate_percent, is_default, created_at) VALUES (?, ?, ?, NOW())',
      [name, rate_percent, is_default ? 1 : 0]
    );

    res.status(201).json({ success: true, message: 'Tax rate added', taxRateId: taxRate.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 4. System Auditing
// ============================================

const getAuditLogs = async (req, res) => {
  try {
    // Highly restricted read-only endpoint
    const [logs] = await db.query(`
      SELECT a.*, u.full_name as user_name 
      FROM audit_logs a 
      LEFT JOIN users u ON a.user_id = u.id 
      ORDER BY a.created_at DESC 
      LIMIT 100
    `);

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getAllUsers,
  toggleUserLock,
  forcePasswordReset,
  getRolesAndPermissions,
  updateRolePermissions,
  updateClubProfile,
  updateClubSettings,
  addTaxRate,
  getAuditLogs
};
