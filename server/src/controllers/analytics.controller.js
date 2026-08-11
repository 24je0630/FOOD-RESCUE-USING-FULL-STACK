const { z } = require('zod');
const prisma = require('../config/prisma');
const createError = require('http-errors');

// Helper to parse date ranges
const getDateFilter = (from, to) => {
  const filter = {};
  if (from) filter.gte = new Date(from);
  if (to) filter.lte = new Date(to);
  return Object.keys(filter).length > 0 ? filter : undefined;
};

// 1. Platform Analytics (Admin Only)
const getGlobalAnalytics = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const dateFilter = getDateFilter(from, to);

    const baseWhere = dateFilter ? { createdAt: dateFilter } : {};

    const [
      totalUsers, activeUsers, suspendedUsers,
      totalRestaurants, totalNgos, totalVolunteers,
      totalDonations, activeDonations, completedDonations, cancelledDonations, expiredDonations,
      totalPickups, completedPickups,
      donationsStats
    ] = await Promise.all([
      prisma.user.count({ where: baseWhere }),
      prisma.user.count({ where: { ...baseWhere, status: 'ACTIVE' } }),
      prisma.user.count({ where: { ...baseWhere, status: 'SUSPENDED' } }),
      
      prisma.restaurantProfile.count({ where: dateFilter ? { user: { createdAt: dateFilter } } : {} }),
      prisma.nGOProfile.count({ where: dateFilter ? { user: { createdAt: dateFilter } } : {} }),
      prisma.volunteerProfile.count({ where: dateFilter ? { user: { createdAt: dateFilter } } : {} }),
      
      prisma.donation.count({ where: baseWhere }),
      prisma.donation.count({ where: { ...baseWhere, status: 'AVAILABLE' } }),
      prisma.donation.count({ where: { ...baseWhere, status: 'DELIVERED' } }),
      prisma.donation.count({ where: { ...baseWhere, status: 'CANCELLED' } }),
      prisma.donation.count({ where: { ...baseWhere, status: 'EXPIRED' } }),
      
      prisma.pickupRequest.count({ where: baseWhere }),
      prisma.pickupRequest.count({ where: { ...baseWhere, status: 'COMPLETED' } }),
      
      // Aggregate quantities for DELIVERED donations
      prisma.donation.aggregate({
        where: { ...baseWhere, status: 'DELIVERED' },
        _sum: { quantity: true }
      })
    ]);

    const totalFoodRescued = donationsStats._sum.quantity || 0;
    const totalMealsSaved = Math.floor(totalFoodRescued);
    const pickupSuccessRate = totalPickups > 0 ? ((completedPickups / totalPickups) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers, suspended: suspendedUsers },
        profiles: { restaurants: totalRestaurants, ngos: totalNgos, volunteers: totalVolunteers },
        donations: {
          total: totalDonations,
          active: activeDonations,
          completed: completedDonations,
          cancelled: cancelledDonations,
          expired: expiredDonations
        },
        impact: {
          foodRescued: totalFoodRescued,
          mealsSaved: totalMealsSaved,
          successfulPickups: completedPickups,
          pickupSuccessRate: parseFloat(pickupSuccessRate)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Restaurant Analytics
const getRestaurantAnalytics = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const dateFilter = getDateFilter(from, to);

    const restaurant = await prisma.restaurantProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!restaurant) throw createError(404, 'Restaurant profile not found');

    const baseWhere = { restaurantId: restaurant.id, ...(dateFilter && { createdAt: dateFilter }) };

    const [
      totalDonations, activeDonations, completedDonations, cancelledDonations, expiredDonations,
      stats, categoryDist
    ] = await Promise.all([
      prisma.donation.count({ where: baseWhere }),
      prisma.donation.count({ where: { ...baseWhere, status: 'AVAILABLE' } }),
      prisma.donation.count({ where: { ...baseWhere, status: 'DELIVERED' } }),
      prisma.donation.count({ where: { ...baseWhere, status: 'CANCELLED' } }),
      prisma.donation.count({ where: { ...baseWhere, status: 'EXPIRED' } }),
      
      prisma.donation.aggregate({
        where: { ...baseWhere, status: 'DELIVERED' },
        _sum: { quantity: true }
      }),

      prisma.donation.groupBy({
        by: ['category'],
        where: baseWhere,
        _count: true
      })
    ]);

    const foodDonated = stats._sum.quantity || 0;
    const pickupSuccessRate = totalDonations > 0 ? ((completedDonations / totalDonations) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        donations: {
          total: totalDonations,
          active: activeDonations,
          completed: completedDonations,
          cancelled: cancelledDonations,
          expired: expiredDonations
        },
        impact: {
          foodDonated,
          mealsSaved: Math.floor(foodDonated),
          successfulPickups: completedDonations,
          pickupSuccessRate: parseFloat(pickupSuccessRate)
        },
        categoryDistribution: categoryDist.map(c => ({ category: c.category, count: c._count }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. NGO Analytics
const getNgoAnalytics = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const dateFilter = getDateFilter(from, to);

    const ngo = await prisma.nGOProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!ngo) throw createError(404, 'NGO profile not found');

    const baseWhere = { ngoId: ngo.id, ...(dateFilter && { createdAt: dateFilter }) };

    const [
      totalRequests, acceptedRequests, rejectedRequests, completedPickups, cancelledRequests,
      completedDonationsDetails
    ] = await Promise.all([
      prisma.pickupRequest.count({ where: baseWhere }),
      prisma.pickupRequest.count({ where: { ...baseWhere, status: 'ACCEPTED' } }),
      prisma.pickupRequest.count({ where: { ...baseWhere, status: 'REJECTED' } }),
      prisma.pickupRequest.count({ where: { ...baseWhere, status: 'COMPLETED' } }),
      prisma.pickupRequest.count({ where: { ...baseWhere, status: 'CANCELLED' } }),

      prisma.pickupRequest.findMany({
        where: { ...baseWhere, status: 'COMPLETED' },
        include: { donation: { select: { quantity: true, category: true } } }
      })
    ]);

    const foodReceived = completedDonationsDetails.reduce((sum, req) => sum + req.donation.quantity, 0);
    const pickupSuccessRate = totalRequests > 0 ? ((completedPickups / totalRequests) * 100).toFixed(2) : 0;

    // Aggregate category distribution manually from the fetched array
    const categoryDistMap = {};
    completedDonationsDetails.forEach(req => {
      const cat = req.donation.category;
      categoryDistMap[cat] = (categoryDistMap[cat] || 0) + 1;
    });
    const categoryDistribution = Object.keys(categoryDistMap).map(key => ({ category: key, count: categoryDistMap[key] }));

    res.json({
      success: true,
      data: {
        requests: {
          total: totalRequests,
          accepted: acceptedRequests,
          rejected: rejectedRequests,
          completed: completedPickups,
          cancelled: cancelledRequests
        },
        impact: {
          foodReceived,
          mealsServed: Math.floor(foodReceived),
          pickupSuccessRate: parseFloat(pickupSuccessRate)
        },
        categoryDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Volunteer Analytics
const getVolunteerAnalytics = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const dateFilter = getDateFilter(from, to);

    const volunteer = await prisma.volunteerProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!volunteer) throw createError(404, 'Volunteer profile not found');

    const baseWhere = { volunteerId: volunteer.id, ...(dateFilter && { createdAt: dateFilter }) };

    const [
      totalAssignments, acceptedAssignments, completedPickups, cancelledAssignments,
      completedAssignmentsDetails
    ] = await Promise.all([
      prisma.volunteerAssignment.count({ where: baseWhere }),
      prisma.volunteerAssignment.count({ where: { ...baseWhere, status: 'ACCEPTED' } }),
      prisma.volunteerAssignment.count({ where: { ...baseWhere, status: { in: ['DELIVERED', 'COMPLETED'] } } }),
      prisma.volunteerAssignment.count({ where: { ...baseWhere, status: 'CANCELLED' } }),

      prisma.volunteerAssignment.findMany({
        where: { ...baseWhere, status: { in: ['DELIVERED', 'COMPLETED'] } },
        include: { pickupRequest: { include: { donation: { select: { quantity: true } } } } }
      })
    ]);

    const foodCollectedAndDelivered = completedAssignmentsDetails.reduce((sum, assign) => sum + assign.pickupRequest.donation.quantity, 0);
    const deliverySuccessRate = totalAssignments > 0 ? ((completedPickups / totalAssignments) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        assignments: {
          total: totalAssignments,
          accepted: acceptedAssignments,
          completed: completedPickups,
          cancelled: cancelledAssignments
        },
        impact: {
          foodDelivered: foodCollectedAndDelivered,
          deliverySuccessRate: parseFloat(deliverySuccessRate)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGlobalAnalytics,
  getRestaurantAnalytics,
  getNgoAnalytics,
  getVolunteerAnalytics
};
