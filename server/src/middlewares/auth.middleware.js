const { verifyToken } = require('../utils/jwt.utils');
const createError = require('http-errors');
const prisma = require('../config/prisma');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError(401, 'Authentication token missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      throw createError(401, 'User no longer exists');
    }
    if (user.status === 'SUSPENDED') {
      throw createError(403, 'User account is suspended');
    }

    req.user = user;
    next();
  } catch (error) {
    next(createError(401, 'Unauthorized'));
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(createError(403, 'Forbidden: Insufficient privileges'));
    }
    next();
  };
};

module.exports = { requireAuth, requireRole };
