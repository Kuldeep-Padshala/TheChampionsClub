const { WebSocketServer } = require('ws');
const { verifyAccessToken } = require('./token.service');
const { getUserRoles } = require('./auth.service');
const { pool } = require('../config/db');

let wss = null;
const clients = new Map(); // ws -> { userId, email, roles }

/**
 * Initialize WebSocket Server attached to HTTP Server
 */
function initWebSocketServer(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', async (ws, req) => {
    // 1. Try extracting token from URL query string ?token=...
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    let clientMeta = { userId: null, email: null, roles: [] };

    if (token) {
      try {
        const payload = verifyAccessToken(token);
        clientMeta.userId = payload.userId;
        clientMeta.email = payload.email;
        clientMeta.roles = await getUserRoles(payload.userId);
      } catch (err) {
        // Invalid token on connect, stays anonymous/guest
      }
    }

    clients.set(ws, clientMeta);

    // Send welcome handshake
    ws.send(JSON.stringify({
      type: 'CONNECTED',
      message: 'Connected to The Champions Club Real-Time Gateway',
      authenticated: !!clientMeta.userId,
      userId: clientMeta.userId,
    }));

    // 2. Handle messages from client
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'AUTH' && data.token) {
          try {
            const payload = verifyAccessToken(data.token);
            const roles = await getUserRoles(payload.userId);
            const meta = { userId: payload.userId, email: payload.email, roles };
            clients.set(ws, meta);

            ws.send(JSON.stringify({
              type: 'AUTH_SUCCESS',
              userId: meta.userId,
              roles: meta.roles,
            }));
          } catch (err) {
            ws.send(JSON.stringify({ type: 'AUTH_FAILED', message: 'Invalid or expired token' }));
          }
        } else if (data.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        }
      } catch (err) {
        // Ignore unparseable messages
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.warn('[WS Client Error]', err.message);
      clients.delete(ws);
    });
  });

  // Keep-alive heartbeat ping every 30s
  setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.ping();
      }
    });
  }, 30000);

  console.log('[WebSocket] Real-Time Gateway initialized');
  return wss;
}

/**
 * Broadcast event to ALL connected clients (e.g. court slot booked)
 */
function broadcast(payload) {
  if (!wss) return;
  const message = JSON.stringify(payload);
  clients.forEach((_meta, ws) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  });
}

/**
 * Send event to a specific user (all their active sockets/tabs)
 */
function sendToUser(userId, payload) {
  if (!wss) return;
  const message = JSON.stringify(payload);
  clients.forEach((meta, ws) => {
    if (meta.userId === Number(userId) && ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  });
}

/**
 * Send event to all users who have a specific role (e.g. 'RECEPTIONIST', 'ACCOUNTANT')
 */
function sendToRole(targetRole, payload) {
  if (!wss) return;
  const message = JSON.stringify(payload);
  const normalized = targetRole.toUpperCase();
  clients.forEach((meta, ws) => {
    if (meta.roles && meta.roles.includes(normalized) && ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  });
}

/**
 * Persist notification in MySQL and deliver in real-time via WebSocket
 */
async function createAndSendNotification({
  recipient_user_id = null,
  recipient_contact = null,
  type = 'general',
  channel = 'in_app',
  title,
  body,
  entity_type = null,
  entity_id = null,
  dedupe_key = null,
}) {
  try {
    const finalDedupe = dedupe_key || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const finalContact = recipient_contact || (!recipient_user_id ? 'all_members' : null);

    const [result] = await pool.query(
      `INSERT INTO notifications 
       (recipient_user_id, recipient_contact, type, channel, title, body, entity_type, entity_id, dedupe_key, status, is_read, scheduled_for, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', 0, NOW(), NOW())`,
      [recipient_user_id, finalContact, type, channel, title, body, entity_type, entity_id, finalDedupe]
    );

    const notificationPayload = {
      id: result.insertId,
      recipient_user_id,
      type,
      channel,
      title,
      body,
      entity_type,
      entity_id,
      is_read: 0,
      created_at: new Date().toISOString(),
    };

    const wsEvent = {
      type: 'NOTIFICATION',
      notification: notificationPayload,
    };

    if (recipient_user_id) {
      sendToUser(recipient_user_id, wsEvent);
    } else {
      broadcast(wsEvent);
    }

    return notificationPayload;
  } catch (error) {
    console.error('[createAndSendNotification error]', error.message);
    return null;
  }
}

module.exports = {
  initWebSocketServer,
  broadcast,
  sendToUser,
  sendToRole,
  createAndSendNotification,
};
