const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
} = require('../controllers/notification.controller');

const router = Router();

router.use(requireAuth);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.post('/', createNotification);

module.exports = router;
