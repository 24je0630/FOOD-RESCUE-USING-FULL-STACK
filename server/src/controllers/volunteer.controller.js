const { z } = require('zod');
const prisma = require('../config/prisma');
const createError = require('http-errors');

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
    const volunteer = await prisma.volunteerProfile.findUnique({
      where: { userId: req.user.id },
    });

    const assignments = await prisma.volunteerAssignment.findMany({
      where: { volunteerId: volunteer.id },
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
    });

    res.json({
      success: true,
      data: { assignments },
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
  } catch (error) {
    next(error);
  }
};

// Upload delivery proof
const uploadProof = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        const { proofImageUrl } = z.object({ proofImageUrl: z.string().url() }).parse(req.body);
    
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
    
        const updated = await prisma.volunteerAssignment.update({
            where: { id: assignment.id },
            data: { proofImageUrl }
        });
    
        res.json({
          success: true,
          data: { assignment: updated },
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
            return next(createError(400, error.errors[0].message));
        }
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
