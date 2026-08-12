const request = require('supertest');
const app = require('../app');
const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');
const { uploadImage } = require('../services/cloudinary.service');

const { generateToken } = require('../utils/jwt.utils');

describe('Donations API', () => {
  let restaurantToken;
  const restaurantUserId = 'user-rest-1';
  const restaurantProfileId = 'profile-rest-1';

  beforeEach(() => {
    jest.clearAllMocks();
    restaurantToken = generateToken(restaurantUserId, 'RESTAURANT');
    
    // Mock user lookup for auth middleware
    prisma.user.findUnique.mockResolvedValue({
      id: restaurantUserId,
      role: 'RESTAURANT',
      status: 'ACTIVE'
    });
  });

  describe('POST /api/donations', () => {
    it('should create a donation successfully', async () => {
      prisma.restaurantProfile.findUnique.mockResolvedValue({ id: restaurantProfileId, userId: restaurantUserId, organizationName: 'Test Rest' });
      
      const mockDonation = {
        id: 'don-1',
        title: 'Fresh Bread',
        category: 'BAKED_GOODS',
        restaurantId: restaurantProfileId,
      };
      
      prisma.donation.create.mockResolvedValue(mockDonation);

      const res = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${restaurantToken}`)
        .send({
          title: 'Fresh Bread',
          category: 'BAKED_GOODS',
          quantity: 10,
          unit: 'loaves',
          expiryTime: new Date(Date.now() + 86400000).toISOString(),
          pickupDeadline: new Date(Date.now() + 3600000).toISOString(),
          pickupAddress: '123 Bakery St',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.donation.title).toBe('Fresh Bread');
      expect(prisma.donation.create).toHaveBeenCalled();
    });

    it('should deny unauthorized role', async () => {
      const ngoToken = generateToken('user-ngo-1', 'NGO');
      
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-ngo-1',
        role: 'NGO',
        status: 'ACTIVE'
      });

      const res = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${ngoToken}`)
        .send({ title: 'Bread', category: 'BAKED_GOODS' });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/donations/:id/images', () => {
    it('should upload an image successfully', async () => {
      prisma.restaurantProfile.findUnique.mockResolvedValue({ id: restaurantProfileId, userId: restaurantUserId });
      prisma.donation.findFirst.mockResolvedValue({ id: 'don-1', restaurantId: restaurantProfileId });
      
      uploadImage.mockResolvedValue({
        url: 'https://cloudinary.com/test.jpg',
        publicId: 'test_public_id'
      });
      
      prisma.donationImage.create.mockResolvedValue({
        id: 'img-1',
        url: 'https://cloudinary.com/test.jpg'
      });

      const res = await request(app)
        .post('/api/donations/don-1/images')
        .set('Authorization', `Bearer ${restaurantToken}`)
        .attach('image', Buffer.from('fake-image-data'), 'test.jpg'); // Simulate file upload

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(uploadImage).toHaveBeenCalled();
      expect(prisma.donationImage.create).toHaveBeenCalled();
    });

    it('should fail and attempt cleanup if database save fails', async () => {
      prisma.restaurantProfile.findUnique.mockResolvedValue({ id: restaurantProfileId, userId: restaurantUserId });
      prisma.donation.findFirst.mockResolvedValue({ id: 'don-1', restaurantId: restaurantProfileId });
      
      uploadImage.mockResolvedValue({
        url: 'https://cloudinary.com/test.jpg',
        publicId: 'test_public_id'
      });
      
      prisma.donationImage.create.mockRejectedValue(new Error('DB connection failed'));
      
      const cloudinaryMock = require('../services/cloudinary.service');

      const res = await request(app)
        .post('/api/donations/don-1/images')
        .set('Authorization', `Bearer ${restaurantToken}`)
        .attach('image', Buffer.from('fake-image-data'), 'test.jpg');

      expect(res.status).toBe(500);
      expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith('test_public_id');
    });
  });
});
