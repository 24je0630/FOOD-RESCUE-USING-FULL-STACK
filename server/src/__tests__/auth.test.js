const request = require('supertest');
const app = require('../app'); // Ensure server exports app
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new RESTAURANT user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@restaurant.com',
        role: 'RESTAURANT',
        password: 'hashed-password',
      };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@restaurant.com',
          password: 'Password123!',
          role: 'RESTAURANT',
          organizationName: 'Test Rest',
          address: '123 Main St',
          phone: '1234567890'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@restaurant.com');
      expect(res.body.data.token).toBeDefined();
    });

    it('should fail if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@restaurant.com',
          password: 'Password123!',
          role: 'RESTAURANT',
          organizationName: 'Test Rest',
          address: '123 Main St',
          phone: '1234567890'
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/User with this email already exists/i);
    });

    it('should validate inputs', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'short', // missing role
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const plainPassword = 'Password123!';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);

      const mockUser = {
        id: 'user-123',
        email: 'login@test.com',
        role: 'NGO',
        password: hashedPassword,
        status: 'ACTIVE',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: plainPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should fail with invalid email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@test.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/Invalid credentials/i);
    });

    it('should fail with incorrect password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'login@test.com',
        role: 'NGO',
        password: 'some-other-hash',
        status: 'ACTIVE',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'WrongPassword1!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/Invalid credentials/i);
    });
  });
});
