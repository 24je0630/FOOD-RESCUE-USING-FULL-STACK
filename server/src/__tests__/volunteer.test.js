const request = require('supertest');
const app = require('../app');
const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');
const { uploadImage } = require('../services/cloudinary.service');

const { generateToken } = require('../utils/jwt.utils');

describe('Volunteer API Endpoints', () => {
  const volunteerId = 'user-vol-1';
  const volunteerProfileId = 'profile-vol-1';
  let volunteerToken;

  beforeEach(() => {
    jest.clearAllMocks();
    volunteerToken = generateToken(volunteerId, 'VOLUNTEER');

    prisma.user.findUnique.mockResolvedValue({
      id: volunteerId,
      role: 'VOLUNTEER',
      status: 'ACTIVE'
    });
  });

  describe('PATCH /api/volunteer/assignments/:assignmentId/status', () => {
    it('should successfully transition assignment status', async () => {
      prisma.volunteerProfile.findUnique.mockResolvedValue({ id: volunteerProfileId, userId: volunteerId });
      
      const mockAssignment = {
        id: 'assign-1',
        volunteerId: volunteerProfileId,
        status: 'ASSIGNED',
        pickupRequestId: 'req-1',
        pickupRequest: { donationId: 'don-1' }
      };

      prisma.volunteerAssignment.findFirst.mockResolvedValue(mockAssignment);
      
      // Transaction mock
      prisma.$transaction.mockImplementation(async (cb) => {
        return cb(prisma);
      });
      
      prisma.volunteerAssignment.update.mockResolvedValue({ ...mockAssignment, status: 'ACCEPTED' });

      const res = await request(app)
        .patch('/api/volunteer/assignments/assign-1/status')
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({ status: 'ACCEPTED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assignment.status).toBe('ACCEPTED');
    });

    it('should prevent invalid transitions', async () => {
      prisma.volunteerProfile.findUnique.mockResolvedValue({ id: volunteerProfileId, userId: volunteerId });
      
      prisma.volunteerAssignment.findFirst.mockResolvedValue({
        id: 'assign-1',
        volunteerId: volunteerProfileId,
        status: 'ASSIGNED',
      });

      const res = await request(app)
        .patch('/api/volunteer/assignments/assign-1/status')
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({ status: 'DELIVERED' }); // Invalid jump

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/Cannot transition/i);
    });
  });

  describe('POST /api/volunteer/assignments/:assignmentId/proof', () => {
    it('should upload proof successfully for FOOD_COLLECTED assignment', async () => {
      prisma.volunteerProfile.findUnique.mockResolvedValue({ id: volunteerProfileId, userId: volunteerId });
      
      prisma.volunteerAssignment.findFirst.mockResolvedValue({
        id: 'assign-1',
        volunteerId: volunteerProfileId,
        status: 'FOOD_COLLECTED', // valid state
      });

      uploadImage.mockResolvedValue({ url: 'http://cloudinary.com/proof.jpg', publicId: 'proof_1' });
      prisma.volunteerAssignment.update.mockResolvedValue({
        id: 'assign-1',
        proofImageUrl: 'http://cloudinary.com/proof.jpg'
      });

      const res = await request(app)
        .post('/api/volunteer/assignments/assign-1/proof')
        .set('Authorization', `Bearer ${volunteerToken}`)
        .attach('image', Buffer.from('fake-image-data'), 'proof.jpg');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(uploadImage).toHaveBeenCalled();
    });

    it('should reject proof upload if not FOOD_COLLECTED or DELIVERED', async () => {
      prisma.volunteerProfile.findUnique.mockResolvedValue({ id: volunteerProfileId, userId: volunteerId });
      
      prisma.volunteerAssignment.findFirst.mockResolvedValue({
        id: 'assign-1',
        volunteerId: volunteerProfileId,
        status: 'ASSIGNED', // invalid state for proof
      });

      const res = await request(app)
        .post('/api/volunteer/assignments/assign-1/proof')
        .set('Authorization', `Bearer ${volunteerToken}`)
        .attach('image', Buffer.from('fake-image-data'), 'proof.jpg');

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/Proof can only be uploaded when food is collected/i);
    });
  });
});
