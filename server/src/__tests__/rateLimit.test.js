const request = require('supertest');
const express = require('express');
const { apiLimiter, authLimiter } = require('../config/rateLimit');

describe('Rate Limiting', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mount endpoints
    app.post('/api/auth/login', authLimiter, (req, res) => res.json({ success: true }));
    app.get('/api/users', apiLimiter, (req, res) => res.json({ success: true }));
  });

  describe('Auth Limiter', () => {
    it('should allow up to 10 requests', async () => {
      for (let i = 0; i < 10; i++) {
        const res = await request(app).post('/api/auth/login');
        expect(res.status).toBe(200);
      }
    });

    it('should block the 11th request', async () => {
      // 10 allowed requests
      for (let i = 0; i < 10; i++) {
        await request(app).post('/api/auth/login');
      }
      
      // 11th should be blocked
      const blockedRes = await request(app).post('/api/auth/login');
      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.message).toMatch(/Too many authentication attempts/);
    });
  });

  describe('API Limiter', () => {
    it('should allow normal traffic', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(200);
    });
  });
});
