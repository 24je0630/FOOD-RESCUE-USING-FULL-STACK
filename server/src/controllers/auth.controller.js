const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { generateToken } = require('../utils/jwt.utils');
const createError = require('http-errors');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['RESTAURANT', 'NGO', 'VOLUNTEER']),
  organizationName: z.string().optional(),
  phone: z.string(),
  address: z.string(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      throw createError(409, 'User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          role: validatedData.role,
        },
      });

      if (validatedData.role === 'RESTAURANT') {
        await tx.restaurantProfile.create({
          data: {
            userId: newUser.id,
            organizationName: validatedData.organizationName,
            phone: validatedData.phone,
            address: validatedData.address,
          },
        });
      } else if (validatedData.role === 'NGO') {
        await tx.nGOProfile.create({
          data: {
            userId: newUser.id,
            organizationName: validatedData.organizationName,
            address: validatedData.address,
          },
        });
      } else if (validatedData.role === 'VOLUNTEER') {
        await tx.volunteerProfile.create({
          data: {
            userId: newUser.id,
            phone: validatedData.phone,
            address: validatedData.address,
          },
        });
      }
      return newUser;
    });

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError(400, error.errors[0].message));
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      throw createError(401, 'Invalid credentials');
    }

    const isMatch = await bcrypt.compare(validatedData.password, user.password);
    if (!isMatch) {
      throw createError(401, 'Invalid credentials');
    }

    if (user.status === 'SUSPENDED') {
      throw createError(403, 'Account is suspended');
    }

    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError(400, error.errors[0].message));
    }
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
