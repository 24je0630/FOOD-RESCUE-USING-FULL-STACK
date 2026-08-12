const { z } = require('zod');
const prisma = require('../config/prisma');
const createError = require('http-errors');
const { sendNotification, sendNotificationToRole } = require('../services/notification.service');
const { uploadImage } = require('../services/cloudinary.service');

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

    // Notify all NGOs
    await sendNotificationToRole({
      role: 'NGO',
      title: 'New Food Donation Available',
      message: `${restaurant.organizationName} has posted a new donation of ${validatedData.category}.`,
      type: 'DONATION_CREATED',
      relatedEntityId: donation.id
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
        images: true,
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
        images: true,
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

// Accept a pickup request (Restaurant action)
const acceptPickupRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    const restaurant = await prisma.restaurantProfile.findUnique({
      where: { userId: req.user.id },
    });

    const request = await prisma.pickupRequest.findFirst({
      where: { id: requestId },
      include: { donation: true }
    });

    if (!request || request.donation.restaurantId !== restaurant.id) {
      throw createError(404, 'Pickup request not found or unauthorized');
    }

    if (request.status !== 'PENDING') {
      throw createError(400, 'Can only accept PENDING requests');
    }

    // Find an available volunteer (simple round-robin or just first available for now)
    const availableVolunteer = await prisma.volunteerProfile.findFirst({
      where: { availabilityStatus: true }
    });

    if (!availableVolunteer) {
      throw createError(400, 'No volunteers currently available. Please try again later.');
    }

    const updatedData = await prisma.$transaction(async (tx) => {
      // 1. Mark request as ACCEPTED
      const updatedReq = await tx.pickupRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' }
      });

      // 2. Reject other pending requests for this donation
      await tx.pickupRequest.updateMany({
        where: { donationId: request.donationId, status: 'PENDING', id: { not: requestId } },
        data: { status: 'REJECTED' }
      });

      // 3. Mark donation as ASSIGNED
      await tx.donation.update({
        where: { id: request.donationId },
        data: { status: 'ASSIGNED' }
      });

      // 4. Create VolunteerAssignment
      const assignment = await tx.volunteerAssignment.create({
        data: {
          pickupRequestId: requestId,
          volunteerId: availableVolunteer.id,
          status: 'ASSIGNED'
        }
      });

      return { request: updatedReq, assignment, availableVolunteer };
    });

    res.json({
      success: true,
      data: { request: updatedData.request, assignment: updatedData.assignment },
    });

    // Notifications
    await sendNotification({
      userId: request.ngo.userId,
      title: 'Pickup Request Accepted',
      message: `${restaurant.organizationName} accepted your pickup request. A volunteer has been assigned.`,
      type: 'STATUS_CHANGED',
      relatedEntityId: request.donationId
    });

    await sendNotification({
      userId: updatedData.availableVolunteer.userId,
      title: 'New Volunteer Assignment',
      message: `You have been assigned to pick up food from ${restaurant.organizationName}.`,
      type: 'ASSIGNMENT_UPDATED',
      relatedEntityId: updatedData.assignment.id
    });
  } catch (error) {
    next(error);
  }
};

// Upload Donation Image
const uploadDonationImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      throw createError(400, 'No image file provided');
    }

    const restaurant = await prisma.restaurantProfile.findUnique({
      where: { userId: req.user.id },
    });

    const donation = await prisma.donation.findFirst({
      where: { id, restaurantId: restaurant.id },
    });

    if (!donation) {
      throw createError(404, 'Donation not found or unauthorized');
    }

    // Upload to Cloudinary
    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadImage(req.file.buffer, 'food-rescue/donations');
    } catch (uploadError) {
      throw createError(500, 'Image upload failed. Please try again.');
    }

    // Save to DB
    try {
      const donationImage = await prisma.donationImage.create({
        data: {
          donationId: donation.id,
          url: cloudinaryResult.url,
          publicId: cloudinaryResult.publicId,
        },
      });

      res.status(201).json({
        success: true,
        data: { image: donationImage },
      });
    } catch (dbError) {
      // If DB fails, attempt to delete from Cloudinary
      const { deleteImage } = require('../services/cloudinary.service');
      await deleteImage(cloudinaryResult.publicId);
      throw createError(500, 'Failed to save image record to database');
    }
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
  acceptPickupRequest,
  uploadDonationImage,
};
