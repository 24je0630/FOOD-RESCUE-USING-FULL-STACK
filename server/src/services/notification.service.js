const prisma = require('../config/prisma');
const { getIo } = require('../config/socket');

const sendNotification = async ({ userId, title, message, type, relatedEntityId }) => {
  try {
    // 1. Persist in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        relatedEntityId,
      }
    });

    // 2. Emit via Socket.io to the user's specific room
    try {
      const io = getIo();
      io.to(userId).emit('new_notification', notification);
    } catch (socketError) {
      console.error('Socket error (user might be offline):', socketError.message);
    }

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw to prevent interrupting the main transaction
  }
};

const sendNotificationToRole = async ({ role, title, message, type, relatedEntityId }) => {
  try {
    // 1. Find all users with the role
    const users = await prisma.user.findMany({
      where: { role, status: 'ACTIVE' },
      select: { id: true }
    });

    // 2. Bulk create notifications
    const data = users.map(u => ({
      userId: u.id,
      title,
      message,
      type,
      relatedEntityId
    }));

    if (data.length > 0) {
      await prisma.notification.createMany({ data });
    }

    // 3. Emit via Socket.io to the role room
    try {
      const io = getIo();
      // Only send the payload, the DB will have individual records
      io.to(`ROLE_${role}`).emit('new_notification', {
        title,
        message,
        type,
        relatedEntityId,
        createdAt: new Date()
      });
    } catch (socketError) {
      console.error('Socket error:', socketError.message);
    }
  } catch (error) {
    console.error('Error sending role notification:', error);
  }
};

module.exports = {
  sendNotification,
  sendNotificationToRole
};
