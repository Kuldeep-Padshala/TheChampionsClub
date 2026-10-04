const { pool } = require('../config/db');
const { createAndSendNotification } = require('../services/websocket.service');

/**
 * 1. Get current user's notifications
 * GET /api/notifications
 */
async function getMyNotifications(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT * FROM notifications 
       WHERE (recipient_user_id = ? OR recipient_user_id IS NULL)
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    const [unreadCountResult] = await pool.query(
      `SELECT COUNT(*) as unread_count FROM notifications 
       WHERE (recipient_user_id = ? OR recipient_user_id IS NULL) AND is_read = 0`,
      [userId]
    );

    res.json({
      success: true,
      data: rows,
      unread_count: unreadCountResult[0].unread_count || 0,
    });
  } catch (error) {
    console.error('[getMyNotifications error]', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications' });
  }
}

/**
 * 2. Mark single notification as read
 * PATCH /api/notifications/:id/read
 */
async function markAsRead(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await pool.query(
      `UPDATE notifications 
       SET is_read = 1, read_at = NOW() 
       WHERE id = ? AND (recipient_user_id = ? OR recipient_user_id IS NULL)`,
      [id, userId]
    );

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('[markAsRead error]', error);
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
}

/**
 * 3. Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;

    await pool.query(
      `UPDATE notifications 
       SET is_read = 1, read_at = NOW() 
       WHERE (recipient_user_id = ? OR recipient_user_id IS NULL) AND is_read = 0`,
      [userId]
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('[markAllAsRead error]', error);
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
}

/**
 * 4. Dispatch a new notification (Staff / System)
 * POST /api/notifications
 */
async function createNotification(req, res) {
  try {
    const { recipient_user_id, title, body, type, entity_type, entity_id } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const created = await createAndSendNotification({
      recipient_user_id: recipient_user_id || null,
      title,
      body: body || '',
      type: type || 'announcement',
      entity_type,
      entity_id,
    });

    res.status(201).json({
      success: true,
      message: 'Notification sent and broadcasted in real time',
      data: created,
    });
  } catch (error) {
    console.error('[createNotification error]', error);
    res.status(500).json({ success: false, message: 'Failed to create notification' });
  }
}

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
};
