const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

// ============================================
// 1. User & Security Management
// ============================================

const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT 
        u.id, 
        u.full_name, 
        u.email, 
        u.phone, 
        u.status, 
        u.last_login_at, 
        u.created_at,
        GROUP_CONCAT(DISTINCT r.code) as roles,
        GROUP_CONCAT(DISTINCT r.name) as role_names,
        mr.status as membership_request_status,
        mr.id as membership_request_id
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN membership_requests mr ON u.id = mr.user_id AND mr.status = 'pending'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    const formattedUsers = users.map(u => ({
      ...u,
      roles: u.roles ? u.roles.split(',') : (u.membership_request_status === 'pending' ? ['APPLICANT'] : []),
      role_names: u.role_names ? u.role_names.split(',') : (u.membership_request_status === 'pending' ? ['Applicant'] : [])
    }));

    res.status(200).json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error('[getAllUsers error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving users' });
  }
};

const toggleUserLock = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'lock' or 'unlock'
    const adminId = req.user.id;

    let status = 'suspended';
    let locked_until = '2099-12-31 23:59:59';

    if (action === 'unlock') {
      status = 'active';
      locked_until = null;
    }

    await pool.query(
      'UPDATE users SET status = ?, locked_until = ?, failed_login_count = 0, updated_at = NOW() WHERE id = ?',
      [status, locked_until, id]
    );

    // Record audit log
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [adminId, action === 'unlock' ? 'USER_UNLOCKED' : 'USER_LOCKED', 'users', id, JSON.stringify({ status, locked_until })]
    ).catch(() => {});

    res.status(200).json({
      success: true,
      message: `User account #${id} has been ${action === 'unlock' ? 'unlocked and activated' : 'locked and suspended'}`
    });
  } catch (error) {
    console.error('[toggleUserLock error]', error);
    res.status(500).json({ success: false, message: 'Server error toggling user lock' });
  }
};

const forcePasswordReset = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password = 'Password@123' } = req.body;
    const adminId = req.user.id;

    const hash = await bcrypt.hash(new_password, 10);

    await pool.query(
      'UPDATE users SET password_hash = ?, must_change_password = 1, locked_until = NULL, failed_login_count = 0, status = "active", updated_at = NOW() WHERE id = ?',
      [hash, id]
    );

    // Record audit log
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [adminId, 'PASSWORD_FORCE_RESET', 'users', id, JSON.stringify({ forced_by: adminId })]
    ).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. The user can now log in with the temporary password.'
    });
  } catch (error) {
    console.error('[forcePasswordReset error]', error);
    res.status(500).json({ success: false, message: 'Server error resetting password' });
  }
};

// ============================================
// 2. Role & Permission Configuration
// ============================================

const getRolesAndPermissions = async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT * FROM roles ORDER BY id ASC');
    const [allPermissions] = await pool.query('SELECT * FROM permissions ORDER BY module ASC, code ASC');
    const [rolePerms] = await pool.query(`
      SELECT rp.role_id, p.id as permission_id, p.code as permission_code, p.module, p.description
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
    `);

    // Group permissions by role_id
    const rolesWithPerms = roles.map(r => ({
      ...r,
      permission_ids: rolePerms.filter(p => p.role_id === r.id).map(p => p.permission_id),
      permission_codes: rolePerms.filter(p => p.role_id === r.id).map(p => p.permission_code)
    }));

    res.status(200).json({
      success: true,
      data: {
        roles: rolesWithPerms,
        permissions: allPermissions
      }
    });
  } catch (error) {
    console.error('[getRolesAndPermissions error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving roles and permissions' });
  }
};

const updateRolePermissions = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params; // role_id
    const { permission_ids = [] } = req.body;
    const adminId = req.user.id;

    await connection.beginTransaction();

    // 1. Delete old permissions for this role
    await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [id]);

    // 2. Insert new permissions
    if (Array.isArray(permission_ids) && permission_ids.length > 0) {
      const values = permission_ids.map(pId => [id, pId]);
      await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [values]);
    }

    // 3. Audit log
    await connection.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [adminId, 'ROLE_PERMISSIONS_UPDATED', 'roles', id, JSON.stringify({ granted_count: permission_ids.length })]
    ).catch(() => {});

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Role permissions updated successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('[updateRolePermissions error]', error);
    res.status(500).json({ success: false, message: 'Server error updating role permissions' });
  } finally {
    connection.release();
  }
};

// ============================================
// 3. Global Club Settings & Profile
// ============================================

const getClubProfile = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM club_profile WHERE id = 1');
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Club profile not found' });
    }
    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[getClubProfile error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving club profile' });
  }
};

const updateClubProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const {
      name,
      tagline,
      description,
      address_line1,
      city,
      state,
      postal_code,
      phone,
      email,
      website_url,
      tax_id,
      currency_code = 'INR',
      timezone = 'Asia/Kolkata'
    } = req.body;

    await pool.query(`
      UPDATE club_profile SET
        name = COALESCE(?, name),
        tagline = COALESCE(?, tagline),
        description = COALESCE(?, description),
        address_line1 = COALESCE(?, address_line1),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        postal_code = COALESCE(?, postal_code),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        website_url = COALESCE(?, website_url),
        tax_id = COALESCE(?, tax_id),
        currency_code = COALESCE(?, currency_code),
        timezone = COALESCE(?, timezone),
        updated_at = NOW()
      WHERE id = 1
    `, [name, tagline, description, address_line1, city, state, postal_code, phone, email, website_url, tax_id, currency_code, timezone]);

    // Record audit log
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [adminId, 'CLUB_PROFILE_UPDATED', 'club_profile', 1, JSON.stringify({ name, email, phone, tax_id })]
    ).catch(() => {});

    res.status(200).json({ success: true, message: 'Club profile updated successfully' });
  } catch (error) {
    console.error('[updateClubProfile error]', error);
    res.status(500).json({ success: false, message: 'Server error updating club profile' });
  }
};

const getClubSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM club_settings ORDER BY `key` ASC');
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('[getClubSettings error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving club settings' });
  }
};

const updateClubSettings = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { key, value } = req.body;

    if (!key) {
      return res.status(400).json({ success: false, message: 'Setting key is required' });
    }

    const [existing] = await pool.query('SELECT `key` FROM club_settings WHERE `key` = ?', [key]);

    if (existing.length > 0) {
      await pool.query(
        'UPDATE club_settings SET value = ?, updated_by = ?, updated_at = NOW() WHERE `key` = ?',
        [String(value), adminId, key]
      );
    } else {
      await pool.query(
        'INSERT INTO club_settings (`key`, value, updated_by, updated_at) VALUES (?, ?, ?, NOW())',
        [key, String(value), adminId]
      );
    }

    res.status(200).json({ success: true, message: `Setting "${key}" updated successfully` });
  } catch (error) {
    console.error('[updateClubSettings error]', error);
    res.status(500).json({ success: false, message: 'Server error updating club setting' });
  }
};

// ============================================
// 4. Tax Rates Management
// ============================================

const getTaxRates = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tax_rates ORDER BY id ASC');
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('[getTaxRates error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving tax rates' });
  }
};

const addTaxRate = async (req, res) => {
  try {
    const { name, rate_pct, is_active = 1 } = req.body;

    if (!name || rate_pct === undefined) {
      return res.status(400).json({ success: false, message: 'Tax name and percentage rate are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO tax_rates (name, rate_pct, is_active) VALUES (?, ?, ?)',
      [name, rate_pct, is_active ? 1 : 0]
    );

    res.status(201).json({
      success: true,
      message: 'Tax rate added successfully',
      taxRateId: result.insertId
    });
  } catch (error) {
    console.error('[addTaxRate error]', error);
    res.status(500).json({ success: false, message: 'Server error adding tax rate' });
  }
};

const toggleTaxRate = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    await pool.query('UPDATE tax_rates SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);

    res.status(200).json({ success: true, message: 'Tax rate status updated' });
  } catch (error) {
    console.error('[toggleTaxRate error]', error);
    res.status(500).json({ success: false, message: 'Server error updating tax rate status' });
  }
};

// ============================================
// 5. System Auditing & Stats
// ============================================

const getAuditLogs = async (req, res) => {
  try {
    const [logs] = await pool.query(`
      SELECT 
        a.id,
        a.user_id,
        a.action,
        a.entity_type,
        a.entity_id,
        a.old_values,
        a.new_values,
        a.ip_address,
        a.user_agent,
        a.created_at,
        u.full_name as user_name,
        u.email as user_email
      FROM audit_logs a 
      LEFT JOIN users u ON a.user_id = u.id 
      ORDER BY a.created_at DESC 
      LIMIT 100
    `);

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error('[getAuditLogs error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving audit logs' });
  }
};

const getAdminStats = async (req, res) => {
  try {
    const [userCounts] = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as locked_users
      FROM users
    `);

    const [memberCount] = await pool.query('SELECT COUNT(*) as count FROM members');
    const [staffCount] = await pool.query("SELECT COUNT(*) as count FROM employees WHERE status = 'active'");
    const [auditCount] = await pool.query('SELECT COUNT(*) as count FROM audit_logs');
    const [settingsCount] = await pool.query('SELECT COUNT(*) as count FROM club_settings');

    const [pendingRequestsCount] = await pool.query("SELECT COUNT(*) as count FROM membership_requests WHERE status = 'pending'");

    res.status(200).json({
      success: true,
      data: {
        totalUsers: Number(userCounts[0].total_users || 0),
        activeUsers: Number(userCounts[0].active_users || 0),
        lockedUsers: Number(userCounts[0].locked_users || 0),
        totalMembers: Number(memberCount[0].count || 0),
        totalStaff: Number(staffCount[0].count || 0),
        auditLogsCount: Number(auditCount[0].count || 0),
        settingsCount: Number(settingsCount[0].count || 0),
        pendingMembershipRequests: Number(pendingRequestsCount[0]?.count || 0),
        dbStatus: 'Operational (Aiven MySQL 21561)',
        nodeEnv: process.env.NODE_ENV || 'production'
      }
    });
  } catch (error) {
    console.error('[getAdminStats error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving admin stats' });
  }
};

// ============================================
// 6. Membership Requests Management (Admin Approval)
// ============================================

const getMembershipRequests = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        mr.id,
        mr.user_id,
        mr.full_name,
        mr.email,
        mr.phone,
        mr.date_of_birth,
        mr.status,
        mr.admin_notes,
        mr.reviewed_by,
        mr.reviewed_at,
        mr.created_at,
        u.created_at as user_created_at,
        reviewer.full_name as reviewer_name
      FROM membership_requests mr
      LEFT JOIN users u ON mr.user_id = u.id
      LEFT JOIN users reviewer ON mr.reviewed_by = reviewer.id
      ORDER BY (CASE WHEN mr.status = 'pending' THEN 0 ELSE 1 END) ASC, mr.created_at DESC
    `);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('[getMembershipRequests error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving membership requests' });
  }
};

const approveMembershipRequest = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params; // membership_request id
    const adminId = req.user.id;
    const { notes } = req.body || {};

    await connection.beginTransaction();

    const [requests] = await connection.query('SELECT * FROM membership_requests WHERE id = ?', [id]);
    if (requests.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Membership request not found' });
    }

    const reqRecord = requests[0];
    const userId = reqRecord.user_id;

    // 1. Update membership_requests status to approved
    await connection.query(
      `UPDATE membership_requests 
       SET status = 'approved', admin_notes = ?, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW() 
       WHERE id = ?`,
      [notes || 'Approved by Administrator', adminId, id]
    );

    // 2. Assign MEMBER role (role id 8) in user_roles if not exists
    const [existingRole] = await connection.query(
      'SELECT * FROM user_roles WHERE user_id = ? AND role_id = 8',
      [userId]
    );
    if (existingRole.length === 0) {
      await connection.query(
        'INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, 8, NOW())',
        [userId]
      );
    }

    // 3. Create or activate members record
    const [existingMember] = await connection.query('SELECT * FROM members WHERE user_id = ?', [userId]);
    let memberCode, qrToken;
    if (existingMember.length === 0) {
      memberCode = 'CC-2026-' + Math.floor(1000 + Math.random() * 9000);
      qrToken = 'QR-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      const dob = reqRecord.date_of_birth || '1995-01-01';
      const phone = reqRecord.phone || ('+91-9' + Math.floor(100000000 + Math.random() * 900000000));

      await connection.query(
        `INSERT INTO members (user_id, member_code, qr_token, full_name, email, phone, date_of_birth, status, joined_on, registered_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', CURDATE(), ?, NOW(), NOW())`,
        [userId, memberCode, qrToken, reqRecord.full_name, reqRecord.email, phone, dob, adminId]
      );
    } else {
      memberCode = existingMember[0].member_code;
      qrToken = existingMember[0].qr_token;
      await connection.query(
        `UPDATE members SET status = 'active', updated_at = NOW() WHERE id = ?`,
        [existingMember[0].id]
      );
    }

    // 4. Audit log
    await connection.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [adminId, 'MEMBERSHIP_REQUEST_APPROVED', 'membership_requests', id, JSON.stringify({ userId, approved_by: adminId })]
    ).catch(() => {});

    await connection.commit();

    // 5. Send In-App Notification and WebSocket Broadcast to user and admin
    const { createAndSendNotification, broadcast } = require('../services/websocket.service');
    createAndSendNotification({
      recipient_user_id: userId,
      title: 'Membership Approved!',
      body: `Welcome to The Champions Club, ${reqRecord.full_name}! Your membership application has been accepted. Your digital member pass is now active.`,
      type: 'membership_approved',
      entity_type: 'member',
      entity_id: userId,
    }).catch(err => console.error('[Notif error]', err.message));

    broadcast({
      type: 'MEMBERSHIP_APPROVED',
      userId: Number(userId),
      requestId: Number(id),
      memberName: reqRecord.full_name,
      memberCode,
      qrToken,
    });

    res.status(200).json({
      success: true,
      message: `Membership approved for ${reqRecord.full_name}. Member pass (${memberCode}) activated successfully!`,
      memberCode,
    });
  } catch (error) {
    await connection.rollback();
    console.error('[approveMembershipRequest error]', error);
    res.status(500).json({ success: false, message: 'Server error approving membership request' });
  } finally {
    connection.release();
  }
};

const rejectMembershipRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { reason = 'Application criteria not met' } = req.body || {};

    const [requests] = await pool.query('SELECT * FROM membership_requests WHERE id = ?', [id]);
    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Membership request not found' });
    }

    const reqRecord = requests[0];

    await pool.query(
      `UPDATE membership_requests 
       SET status = 'rejected', admin_notes = ?, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW() 
       WHERE id = ?`,
      [reason, adminId, id]
    );

    // Audit log
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [adminId, 'MEMBERSHIP_REQUEST_REJECTED', 'membership_requests', id, JSON.stringify({ userId: reqRecord.user_id, reason })]
    ).catch(() => {});

    const { createAndSendNotification, broadcast } = require('../services/websocket.service');
    createAndSendNotification({
      recipient_user_id: reqRecord.user_id,
      title: 'Membership Application Update',
      body: `Your club membership request was not approved: ${reason}. Please contact the concierge desk for assistance.`,
      type: 'membership_rejected',
    }).catch(err => console.error('[Notif error]', err.message));

    broadcast({
      type: 'MEMBERSHIP_REJECTED',
      userId: Number(reqRecord.user_id),
      requestId: Number(id),
      reason,
    });

    res.status(200).json({
      success: true,
      message: `Membership request #${id} for ${reqRecord.full_name} has been rejected.`,
    });
  } catch (error) {
    console.error('[rejectMembershipRequest error]', error);
    res.status(500).json({ success: false, message: 'Server error rejecting membership request' });
  }
};

module.exports = {
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
  getAdminStats,
  getMembershipRequests,
  approveMembershipRequest,
  rejectMembershipRequest,
};
