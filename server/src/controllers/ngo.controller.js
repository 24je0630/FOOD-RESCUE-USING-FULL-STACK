const { z } = require('zod');
const prisma = require('../config/prisma');
const createError = require('http-errors');
const { sendNotification } = require('../services/notification.service');

// Schema for filtering and discovering donations
const discoverQuerySchema = z.object({
  lat: z.string().optional(),
  lng: z.string().optional(),
  radius: z.string().optional(), // in kilometers
  category: z.enum(['PRODUCE', 'BAKED_GOODS', 'PREPARED_MEALS', 'DAIRY', 'MEAT', 'BEVERAGES', 'OTHER']).optional(),
  search: z.string().optional(),
});

// Discover available donations
const discoverDonations = async (req, res, next) => {
  try {
    const query = discoverQuerySchema.parse(req.query);
    
    // Base filter: only AVAILABLE donations
    let whereClause = { status: 'AVAILABLE' };

    if (query.category) {
      whereClause.category = query.category;
    }

    if (query.search) {
      whereClause.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    const donations = await prisma.donation.findMany({
      where: whereClause,
      include: {
        restaurant: {
          select: { organizationName: true, address: true, latitude: true, longitude: true }
        }
      },
      orderBy: { expiryTime: 'asc' }
    });

    // If lat/lng and radius are provided, perform Haversine distance filtering
    let filteredDonations = donations;
    if (query.lat && query.lng && query.radius) {
      const lat = parseFloat(query.lat);
      const lng = parseFloat(query.lng);
      const radiusKm = parseFloat(query.radius);

      filteredDonations = donations.filter(d => {
        if (!d.latitude || !d.longitude) return false;
        
        const R = 6371; // Earth's radius in km
        const dLat = (d.latitude - lat) * Math.PI / 180;
        const dLon = (d.longitude - lng) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat * Math.PI / 180) * Math.cos(d.latitude * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        // Attach distance for convenience
        d.distanceKm = distance;
        return distance <= radiusKm;
      });

      // Sort by closest distance
      filteredDonations.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    res.json({
      success: true,
      data: { donations: filteredDonations },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError(400, error.errors[0].message));
    }
    next(error);
  }
};

// Request a pickup for a donation
const requestPickup = async (req, res, next) => {
  try {
    const { donationId } = req.params;

    const ngo = await prisma.nGOProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!ngo) {
      throw createError(404, 'NGO profile not found');
    }

    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
    });

    if (!donation || donation.status !== 'AVAILABLE') {
      throw createError(400, 'Donation is no longer available');
    }

    // Check if the NGO already requested this
    const existingRequest = await prisma.pickupRequest.findFirst({
      where: {
        donationId,
        ngoId: ngo.id,
      }
    });

    if (existingRequest) {
      throw createError(400, 'You have already requested a pickup for this donation');
    }

    // Use transaction to create request and update donation status
    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.pickupRequest.create({
        data: {
          donationId,
          ngoId: ngo.id,
          status: 'PENDING',
        }
      });

      await tx.donation.update({
        where: { id: donationId },
        data: { status: 'REQUESTED' }
      });

      return request;
    });

    res.status(201).json({
      success: true,
      data: { pickupRequest: result },
    });

    // Notify Restaurant
    const restaurant = await prisma.restaurantProfile.findFirst({
      where: { id: donation.restaurantId }
    });

    if (restaurant) {
      await sendNotification({
        userId: restaurant.userId,
        title: 'New Pickup Request',
        message: `${ngo.organizationName} has requested to pick up your donation: ${donation.title}.`,
        type: 'REQUEST_MADE',
        relatedEntityId: donation.id
      });
    }
  } catch (error) {
    next(error);
  }
};

// Get NGO's pickup requests
const getMyRequests = async (req, res, next) => {
  try {
    const ngo = await prisma.nGOProfile.findUnique({
      where: { userId: req.user.id },
    });

    const requests = await prisma.pickupRequest.findMany({
      where: { ngoId: ngo.id },
      include: {
        donation: {
          include: { restaurant: { select: { organizationName: true, address: true } } }
        },
        assignments: {
          include: { volunteer: { select: { phone: true, user: { select: { email: true } } } } }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { requests },
    });
  } catch (error) {
    next(error);
  }
};

// Cancel a pickup request
const cancelRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    const ngo = await prisma.nGOProfile.findUnique({
      where: { userId: req.user.id },
    });

    const request = await prisma.pickupRequest.findFirst({
      where: { id: requestId, ngoId: ngo.id },
    });

    if (!request) {
      throw createError(404, 'Pickup request not found or unauthorized');
    }

    if (['COMPLETED', 'CANCELLED'].includes(request.status)) {
      throw createError(400, 'Cannot cancel a completed or already cancelled request');
    }

    await prisma.$transaction(async (tx) => {
      await tx.pickupRequest.update({
        where: { id: requestId },
        data: { status: 'CANCELLED' }
      });

      // If no other pending/accepted requests exist, revert donation to AVAILABLE
      const otherRequests = await tx.pickupRequest.findMany({
        where: { donationId: request.donationId, status: { in: ['PENDING', 'ACCEPTED'] } }
      });

      if (otherRequests.length === 0) {
        await tx.donation.update({
          where: { id: request.donationId },
          data: { status: 'AVAILABLE' }
        });
      }
    });

    res.json({
      success: true,
      message: 'Pickup request cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get NGO impact stats
const getImpactStats = async (req, res, next) => {
  try {
    const ngo = await prisma.nGOProfile.findUnique({
      where: { userId: req.user.id },
    });

    const completedRequests = await prisma.pickupRequest.findMany({
      where: { ngoId: ngo.id, status: 'COMPLETED' },
      include: { donation: true }
    });

    const totalRescued = completedRequests.length;
    const totalQuantity = completedRequests.reduce((sum, req) => sum + req.donation.quantity, 0);
    const mealsProvided = Math.floor(totalQuantity); // Rough estimation

    res.json({
      success: true,
      data: {
        totalRescued,
        totalQuantity,
        mealsProvided,
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  discoverDonations,
  requestPickup,
  getMyRequests,
  cancelRequest,
  getImpactStats,
};
