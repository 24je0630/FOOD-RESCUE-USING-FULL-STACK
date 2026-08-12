const prisma = require('../config/prisma');
const createError = require('http-errors');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');

// Get user notifications
const getMyNotifications = async (req, res, next) => {
  try {
    const { page, limit, skip, take } = getPaginationParams(req.query);
    const { unreadOnly } = req.query;

    const where = { userId: req.user.id };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where })
    ]);

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    });

    res.json({
      success: true,
      ...formatPaginatedResponse({ notifications, unreadCount }, total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// Mark one notification as read
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!notification) {
      throw createError(404, 'Notification not found');
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({ success: true, data: { notification: updated } });
  } catch (error) {
    next(error);
  }
};

// Mark all as read
const markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
