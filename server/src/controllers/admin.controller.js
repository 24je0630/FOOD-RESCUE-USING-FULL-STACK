const { z } = require('zod');
const prisma = require('../config/prisma');
const createError = require('http-errors');
const { sendNotification } = require('../services/notification.service');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');

// Helper to log admin actions
const logAdminAction = async (adminId, action, details) => {
  await prisma.activityLog.create({
    data: {
      userId: adminId,
      action,
      details,
    },
  });
};

// --- DASHBOARD ---
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers, activeUsers, suspendedUsers,
      totalRestaurants, totalNgos, totalVolunteers,
      totalDonations, activeDonations, completedDonations,
      pendingPickups, completedPickups,
      recentActivity
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.restaurantProfile.count(),
      prisma.nGOProfile.count(),
      prisma.volunteerProfile.count(),
      prisma.donation.count(),
      prisma.donation.count({ where: { status: 'AVAILABLE' } }),
      prisma.donation.count({ where: { status: 'DELIVERED' } }),
      prisma.pickupRequest.count({ where: { status: 'PENDING' } }),
      prisma.pickupRequest.count({ where: { status: 'COMPLETED' } }),
      prisma.activityLog.findMany({ take: 10, orderBy: { timestamp: 'desc' }, include: { user: { select: { email: true, role: true } } } })
    ]);

    // Calculate total food rescued / meals saved
    const deliveredDonations = await prisma.donation.findMany({ where: { status: 'DELIVERED' } });
    const foodRescued = deliveredDonations.reduce((sum, d) => sum + d.quantity, 0);
    const mealsSaved = Math.floor(foodRescued);

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers, suspended: suspendedUsers },
        profiles: { restaurants: totalRestaurants, ngos: totalNgos, volunteers: totalVolunteers },
        donations: { total: totalDonations, active: activeDonations, completed: completedDonations },
        pickups: { pending: pendingPickups, completed: completedPickups },
        impact: { foodRescued, mealsSaved },
        recentActivity
      }
    });
  } catch (error) {
    next(error);
  }
};

// --- USER MANAGEMENT ---
const getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip, take } = getPaginationParams(req.query);
    const { role, status, search } = req.query;

    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) where.email = { contains: search, mode: 'insensitive' };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        select: { id: true, email: true, role: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({ success: true, ...formatPaginatedResponse({ users }, total, page, limit) });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        restaurantProfile: true,
        ngoProfile: true,
        volunteerProfile: true,
        activityLogs: { take: 5, orderBy: { timestamp: 'desc' } }
      }
    });
    if (!user) throw createError(404, 'User not found');
    
    // Don't leak password
    const { password, ...safeUser } = user;
    res.json({ success: true, data: { user: safeUser } });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED']) }).parse(req.body);

    const user = await prisma.user.update({
      where: { id },
      data: { status }
    });

    await logAdminAction(req.user.id, `USER_${status}`, `Admin updated user ${id} status to ${status}`);

    await sendNotification({
      userId: id,
      title: 'Account Status Updated',
      message: `Your account has been ${status.toLowerCase()} by an administrator.`,
      type: 'ALERT',
      relatedEntityId: id
    });

    res.json({ success: true, message: `User status updated to ${status}` });
  } catch (error) {
    if (error instanceof z.ZodError) return next(createError(400, error.errors[0].message));
    next(error);
  }
};

// --- RESTAURANT MANAGEMENT ---
const getRestaurants = async (req, res, next) => {
  try {
    const { page, limit, skip, take } = getPaginationParams(req.query);
    const { search, verificationStatus } = req.query;

    const where = {};
    if (search) where.organizationName = { contains: search, mode: 'insensitive' };
    if (verificationStatus) where.verificationStatus = verificationStatus;

    const [restaurants, total] = await Promise.all([
      prisma.restaurantProfile.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: { user: { select: { email: true, status: true } } }
      }),
      prisma.restaurantProfile.count({ where })
    ]);

    res.json({ success: true, ...formatPaginatedResponse({ restaurants }, total, page, limit) });
  } catch (error) {
    next(error);
  }
};

const updateRestaurantVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = z.object({ status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']) }).parse(req.body);

    const restaurant = await prisma.restaurantProfile.update({
      where: { id },
      data: { verificationStatus: status }
    });

    await logAdminAction(req.user.id, 'VERIFY_RESTAURANT', `Admin set restaurant ${id} verification to ${status}`);

    await sendNotification({
      userId: restaurant.userId,
      title: 'Verification Status Updated',
      message: `Your restaurant profile verification status is now ${status}.`,
      type: 'STATUS_CHANGED',
      relatedEntityId: restaurant.id
    });

    res.json({ success: true, message: `Restaurant verification updated to ${status}`, data: { restaurant } });
  } catch (error) {
    if (error instanceof z.ZodError) return next(createError(400, error.errors[0].message));
    next(error);
  }
};

// --- NGO MANAGEMENT ---
const getNgos = async (req, res, next) => {
  try {
    const { page, limit, skip, take } = getPaginationParams(req.query);
    const { search, verificationStatus } = req.query;

    const where = {};
    if (search) where.organizationName = { contains: search, mode: 'insensitive' };
    if (verificationStatus) where.verificationStatus = verificationStatus;

    const [ngos, total] = await Promise.all([
      prisma.nGOProfile.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: { user: { select: { email: true, status: true } } }
      }),
      prisma.nGOProfile.count({ where })
    ]);

    res.json({ success: true, ...formatPaginatedResponse({ ngos }, total, page, limit) });
  } catch (error) {
    next(error);
  }
};

const updateNgoVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = z.object({ status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']) }).parse(req.body);

    const ngo = await prisma.nGOProfile.update({
      where: { id },
      data: { verificationStatus: status }
    });

    await logAdminAction(req.user.id, 'VERIFY_NGO', `Admin set NGO ${id} verification to ${status}`);

    await sendNotification({
      userId: ngo.userId,
      title: 'Verification Status Updated',
      message: `Your NGO profile verification status is now ${status}.`,
      type: 'STATUS_CHANGED',
      relatedEntityId: ngo.id
    });

    res.json({ success: true, message: `NGO verification updated to ${status}`, data: { ngo } });
  } catch (error) {
    if (error instanceof z.ZodError) return next(createError(400, error.errors[0].message));
    next(error);
  }
};

// --- VOLUNTEER MANAGEMENT ---
const getVolunteers = async (req, res, next) => {
  try {
    const { page, limit, skip, take } = getPaginationParams(req.query);
    const { verificationStatus } = req.query;
    
    const where = {};
    if (verificationStatus) where.verificationStatus = verificationStatus;

    const [volunteers, total] = await Promise.all([
      prisma.volunteerProfile.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: { user: { select: { email: true, status: true } } }
      }),
      prisma.volunteerProfile.count({ where })
    ]);

    res.json({ success: true, ...formatPaginatedResponse({ volunteers }, total, page, limit) });
  } catch (error) {
    next(error);
  }
};

const updateVolunteerVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = z.object({ status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']) }).parse(req.body);

    const volunteer = await prisma.volunteerProfile.update({
      where: { id },
      data: { verificationStatus: status }
    });

    await logAdminAction(req.user.id, 'VERIFY_VOLUNTEER', `Admin set volunteer ${id} verification to ${status}`);

    await sendNotification({
      userId: volunteer.userId,
      title: 'Verification Status Updated',
      message: `Your volunteer profile verification status is now ${status}.`,
      type: 'STATUS_CHANGED',
      relatedEntityId: volunteer.id
    });

    res.json({ success: true, message: `Volunteer verification updated to ${status}`, data: { volunteer } });
  } catch (error) {
    if (error instanceof z.ZodError) return next(createError(400, error.errors[0].message));
    next(error);
  }
};

// --- DONATION MONITORING ---
const getDonations = async (req, res, next) => {
  try {
    const { page, limit, skip, take } = getPaginationParams(req.query);
    const { status, category } = req.query;

    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: { restaurant: { select: { organizationName: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.donation.count({ where })
    ]);

    res.json({ success: true, ...formatPaginatedResponse({ donations }, total, page, limit) });
  } catch (error) {
    next(error);
  }
};

// --- PICKUP MONITORING ---
const getPickups = async (req, res, next) => {
  try {
    const { page, limit, skip, take } = getPaginationParams(req.query);
    const { status } = req.query;

    const where = {};
    if (status) where.status = status;

    const [pickups, total] = await Promise.all([
      prisma.pickupRequest.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          ngo: { select: { organizationName: true } },
          donation: { select: { title: true, restaurant: { select: { organizationName: true } } } },
          assignments: { include: { volunteer: { select: { phone: true, user: { select: { email: true } } } } } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.pickupRequest.count({ where })
    ]);

    res.json({ success: true, ...formatPaginatedResponse({ pickups }, total, page, limit) });
  } catch (error) {
    next(error);
  }
};

// --- ACTIVITY LOGS ---
const getActivityLogs = async (req, res, next) => {
  try {
    const { page, limit, skip, take } = getPaginationParams(req.query, 50, 200);

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        skip: parseInt(skip),
        take: parseInt(limit),
        include: { user: { select: { email: true, role: true } } },
        orderBy: { timestamp: 'desc' }
      }),
      prisma.activityLog.count()
    ]);

    res.json({ success: true, ...formatPaginatedResponse({ logs }, total, page, limit) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserStatus,
  getRestaurants,
  updateRestaurantVerification,
  getNgos,
  updateNgoVerification,
  getVolunteers,
  getDonations,
  getPickups,
  getActivityLogs,
  updateVolunteerVerification
};
