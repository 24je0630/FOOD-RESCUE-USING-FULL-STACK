const { z } = require('zod');
const prisma = require('../config/prisma');
const createError = require('http-errors');

const createDonationSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.enum(['PRODUCE', 'BAKED_GOODS', 'PREPARED_MEALS', 'DAIRY', 'MEAT', 'BEVERAGES', 'OTHER']),
  quantity: z.number().positive(),
  unit: z.string(),
  preparationTime: z.coerce.date().optional(),
  expiryTime: z.coerce.date(),
  pickupDeadline: z.coerce.date(),
  pickupAddress: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const updateDonationSchema = createDonationSchema.partial().extend({
  status: z.enum(['AVAILABLE', 'CANCELLED']).optional(),
});

// Create a new donation
const createDonation = async (req, res, next) => {
  try {
    const validatedData = createDonationSchema.parse(req.body);

    const restaurant = await prisma.restaurantProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!restaurant) {
      throw createError(404, 'Restaurant profile not found');
    }

    const donation = await prisma.donation.create({
      data: {
        ...validatedData,
        restaurantId: restaurant.id,
      },
    });

    res.status(201).json({
      success: true,
      data: { donation },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError(400, error.errors[0].message));
    }
    next(error);
  }
};

// Get all donations for the logged-in restaurant
const getMyDonations = async (req, res, next) => {
  try {
    const restaurant = await prisma.restaurantProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!restaurant) {
      throw createError(404, 'Restaurant profile not found');
    }

    const donations = await prisma.donation.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: 'desc' },
      include: {
        pickupRequests: {
          include: { ngo: true },
        },
      },
    });

    res.json({
      success: true,
      data: { donations },
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific donation
const getDonationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const restaurant = await prisma.restaurantProfile.findUnique({
      where: { userId: req.user.id },
    });

    const donation = await prisma.donation.findFirst({
      where: {
        id,
        restaurantId: restaurant.id,
      },
      include: {
        pickupRequests: {
          include: { ngo: true, assignments: true },
        },
      },
    });

    if (!donation) {
      throw createError(404, 'Donation not found');
    }

    res.json({
      success: true,
      data: { donation },
    });
  } catch (error) {
    next(error);
  }
};

// Update a donation
const updateDonation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateDonationSchema.parse(req.body);

    const restaurant = await prisma.restaurantProfile.findUnique({
      where: { userId: req.user.id },
    });

    const existingDonation = await prisma.donation.findFirst({
      where: { id, restaurantId: restaurant.id },
    });

    if (!existingDonation) {
      throw createError(404, 'Donation not found or unauthorized');
    }

    // Only allow updating if it hasn't been picked up or delivered
    if (['PICKED_UP', 'DELIVERED', 'EXPIRED'].includes(existingDonation.status)) {
      throw createError(400, 'Cannot update donation in current status');
    }

    const donation = await prisma.donation.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      success: true,
      data: { donation },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError(400, error.errors[0].message));
    }
    next(error);
  }
};

// Get restaurant impact statistics
const getImpactStats = async (req, res, next) => {
  try {
    const restaurant = await prisma.restaurantProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!restaurant) {
      throw createError(404, 'Restaurant profile not found');
    }

    const donations = await prisma.donation.findMany({
      where: { restaurantId: restaurant.id },
    });

    const totalDonations = donations.length;
    const deliveredDonations = donations.filter((d) => d.status === 'DELIVERED');
    const totalQuantityDonated = deliveredDonations.reduce((sum, d) => sum + d.quantity, 0);

    // Assuming 1 quantity roughly equals 1 meal for simplicity in this metric
    const mealsSaved = Math.floor(totalQuantityDonated);

    res.json({
      success: true,
      data: {
        totalDonations,
        successfulDonations: deliveredDonations.length,
        totalQuantityDonated,
        mealsSaved,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDonation,
  getMyDonations,
  getDonationById,
  updateDonation,
  getImpactStats,
};
