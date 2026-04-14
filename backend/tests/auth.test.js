
const request = require('supertest');
const app = require('../app');
const db = require('../config/db');

describe('Auth Endpoints', () => {
  const timestamp = Date.now();
  const ownerEmail = `testowner${timestamp}@example.com`;
  const vendorEmail = `testvendor${timestamp}@example.com`;
  const password = 'password123';

  // Close DB pool after all tests
  afterAll(async () => {
    await db.pool.end();
  });

  describe('Health Check', () => {
    it('should return 200 OK', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'ok');
    });
  });

  describe('Registration', () => {
    it('should register a new owner', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Owner',
          email: ownerEmail,
          password: password,
          role: 'OWNER',
          phone: "1234567890",
          ownerName: "Test Entity",
          contactInfo: "test@entity.com"
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('role', 'OWNER');
    });

    it('should register a new vendor', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Vendor',
          email: vendorEmail,
          password: password,
          role: 'VENDOR',
          phone: "0987654321",
          businessName: "Test Truck",
          category: "Food", // Changed from businessType to category based on schema
          licenseNumber: "LIC-TEST"
        });

      if (res.statusCode === 400) console.log(JSON.stringify(res.body, null, 2));

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
    });

    it('should fail if email already exists', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate User',
          email: ownerEmail,
          password: password,
          role: 'OWNER'
        });
      
      // Expect 409 Conflict (or 400 if controller uses that)
      // Based on previous run, it turned 409.
      expect([400, 409]).toContain(res.statusCode);
    });
  });

  describe('Login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: ownerEmail,
          password: password
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should fail with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: ownerEmail,
          password: 'wrongpassword'
        });

      // Expect 401 Unauthorized
      expect(res.statusCode).toEqual(401); 
    });
  });
});
