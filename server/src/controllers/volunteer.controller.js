const { z } = require('zod');
const prisma = require('../config/prisma');
const createError = require('http-errors');
const { sendNotification } = require('../services/notification.service');
const { uploadImage, deleteImage } = require('../services/cloudinary.service');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');

// Toggle volunteer availability
const toggleAvailability = async (req, res, next) => {
  try {
    const { isAvailable } = z.object({ isAvailable: z.boolean() }).parse(req.body);

    const volunteer = await prisma.volunteerProfile.update({
      where: { userId: req.user.id },
      data: { availabilityStatus: isAvailable },
    });

    res.json({
      success: true,
      message: `Availability updated to ${isAvailable ? 'available' : 'unavailable'}`,
      data: { volunteer },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError(400, error.errors[0].message));
    }
    next(error);
  }
};

// Get my assignments
const getMyAssignments = async (req, res, next) => {
  try {
    const { page, limit, skip, take } = getPaginationParams(req.query);
    const volunteer = await prisma.volunteerProfile.findUnique({
      where: { userId: req.user.id },
    });

    const [assignments, total] = await Promise.all([
      prisma.volunteerAssignment.findMany({
        where: { volunteerId: volunteer.id },
        skip,
        take,
        include: {
          pickupRequest: {
            include: {
              donation: {
                include: {
                  restaurant: { select: { organizationName: true, address: true, phone: true } }
                }
              },
              ngo: { select: { organizationName: true, address: true, phone: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.volunteerAssignment.count({ where: { volunteerId: volunteer.id } })
    ]);

    res.json({
      success: true,
      ...formatPaginatedResponse({ assignments }, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

// State machine for assignment status transitions
const validTransitions = {
  ASSIGNED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PICKUP_STARTED', 'CANCELLED'],
  PICKUP_STARTED: ['FOOD_COLLECTED'],
  FOOD_COLLECTED: ['DELIVERED'],
  DELIVERED: ['COMPLETED'], // Often NGO completes it, but we allow mapping here
};

// Update assignment status
const updateAssignmentStatus = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { status, proofImageUrl } = req.body;

    if (!validTransitions[status] && status !== 'COMPLETED') {
        throw createError(400, 'Invalid status format');
    }

    const volunteer = await prisma.volunteerProfile.findUnique({
      where: { userId: req.user.id },
    });

    const assignment = await prisma.volunteerAssignment.findFirst({
      where: { id: assignmentId, volunteerId: volunteer.id },
      include: {
        pickupRequest: true
      }
    });

    if (!assignment) {
      throw createError(404, 'Assignment not found or unauthorized');
    }

    // Validate transition
    const allowedNextStatuses = validTransitions[assignment.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      throw createError(400, `Cannot transition from ${assignment.status} to ${status}`);
    }

    // Process update in a transaction to update related entities
    const updatedAssignment = await prisma.$transaction(async (tx) => {
      const updated = await tx.volunteerAssignment.update({
        where: { id: assignment.id },
        data: {
          status,
          ...(proofImageUrl && { proofImageUrl })
        }
      });

      // Synchronize statuses across models based on the workflow
      if (status === 'PICKUP_STARTED') {
        // Just mark the pickup request as well? Optional, but keeps it clean
      } else if (status === 'DELIVERED') {
        await tx.pickupRequest.update({
          where: { id: assignment.pickupRequestId },
          data: { status: 'COMPLETED' }
        });
        
        await tx.donation.update({
          where: { id: assignment.pickupRequest.donationId },
          data: { status: 'DELIVERED' }
        });
      }

      return updated;
    });

    res.json({
      success: true,
      data: { assignment: updatedAssignment },
    });

    // Notify Restaurant and NGO
    const fullAssignment = await prisma.volunteerAssignment.findUnique({
      where: { id: assignment.id },
      include: {
        pickupRequest: {
          include: {
            donation: { include: { restaurant: true } },
            ngo: true
          }
        }
      }
    });

    if (fullAssignment) {
      const ngoUserId = fullAssignment.pickupRequest.ngo.userId;
      const restUserId = fullAssignment.pickupRequest.donation.restaurant.userId;

      let msg = `Volunteer status updated to ${status}.`;
      if (status === 'PICKUP_STARTED') msg = 'A volunteer is on their way to pick up the donation.';
      else if (status === 'FOOD_COLLECTED') msg = 'The volunteer has collected the food.';
      else if (status === 'DELIVERED') msg = 'The volunteer has delivered the food.';

      await sendNotification({
        userId: ngoUserId,
        title: 'Pickup Status Update',
        message: msg,
        type: 'STATUS_CHANGED',
        relatedEntityId: assignment.id
      });

      await sendNotification({
        userId: restUserId,
        title: 'Pickup Status Update',
        message: msg,
        type: 'STATUS_CHANGED',
        relatedEntityId: assignment.id
      });
    }

  } catch (error) {
    next(error);
  }
};

// Upload delivery proof
const uploadProof = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        
        if (!req.file) {
          throw createError(400, 'No image file provided');
        }
    
        const volunteer = await prisma.volunteerProfile.findUnique({
          where: { userId: req.user.id },
        });
    
        const assignment = await prisma.volunteerAssignment.findFirst({
          where: { id: assignmentId, volunteerId: volunteer.id },
        });
    
        if (!assignment) {
          throw createError(404, 'Assignment not found or unauthorized');
        }
    
        if (assignment.status !== 'DELIVERED' && assignment.status !== 'FOOD_COLLECTED') {
          throw createError(400, 'Proof can only be uploaded when food is collected or delivered');
        }

        // Upload to Cloudinary
        let cloudinaryResult;
        try {
          cloudinaryResult = await uploadImage(req.file.buffer, 'food-rescue/delivery-proofs');
        } catch (uploadError) {
          throw createError(500, 'Image upload failed. Please try again.');
        }
    
        try {
          const updated = await prisma.volunteerAssignment.update({
              where: { id: assignment.id },
              data: { proofImageUrl: cloudinaryResult.url }
          });
      
          res.json({
            success: true,
            data: { assignment: updated },
          });
        } catch (dbError) {
          await deleteImage(cloudinaryResult.publicId);
          throw createError(500, 'Failed to save proof record to database');
        }
      } catch (error) {
        next(error);
      }
};

// Get volunteer impact stats
const getImpactStats = async (req, res, next) => {
  try {
    const volunteer = await prisma.volunteerProfile.findUnique({
      where: { userId: req.user.id },
    });

    const completedAssignments = await prisma.volunteerAssignment.findMany({
      where: { 
        volunteerId: volunteer.id, 
        status: { in: ['DELIVERED', 'COMPLETED'] }
      },
      include: {
        pickupRequest: { include: { donation: true } }
      }
    });

    const totalDeliveries = completedAssignments.length;
    const totalQuantity = completedAssignments.reduce((sum, req) => sum + req.pickupRequest.donation.quantity, 0);
    const mealsDelivered = Math.floor(totalQuantity);

    res.json({
      success: true,
      data: {
        totalDeliveries,
        totalQuantity,
        mealsDelivered,
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleAvailability,
  getMyAssignments,
  updateAssignmentStatus,
  uploadProof,
  getImpactStats,
};
