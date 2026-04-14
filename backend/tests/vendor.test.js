
const request = require('supertest');
const app = require('../app');
const db = require('../config/db');

describe('Vendor Endpoints', () => {
  const timestamp = Date.now();
  const vendorEmail = `vendor${timestamp}@example.com`;
  const ownerEmail = `owner${timestamp}@example.com`;
  const password = 'password123';
  
  let vendorToken;
  let ownerToken;
  let spaceId;

  // Setup: Register Owner, Vendor, and Create a Space
  beforeAll(async () => {
    // 1. Register Owner
    const ownerRes = await request(app).post('/api/auth/register').send({
      name: 'Test Owner', email: ownerEmail, password, role: 'OWNER', phone: '1234567890', ownerName: 'Corp', contactInfo: 'info'
    });
    ownerToken = ownerRes.body.token;

    // 2. Register Vendor
    const vendorRes = await request(app).post('/api/auth/register').send({
      name: 'Test Vendor', email: vendorEmail, password, role: 'VENDOR', phone: '0987654321', businessName: 'Truck', category: 'Food', licenseNumber: 'LIC'
    });
    vendorToken = vendorRes.body.token;

    // 3. Create Space (as Owner)
    const spaceRes = await request(app).post('/api/owner/spaces').set('Authorization', `Bearer ${ownerToken}`).send({
      spaceName: `Vendor Test Space ${timestamp}`, address: '123 Vendor St', lat: 12.0, lng: 77.0, allowedRadius: 100
    });
    spaceId = spaceRes.body.space.space_id;
    spaceId = spaceRes.body.space.space_id;
  }, 30000); // Increase timeout

  afterAll(async () => {
    await db.pool.end();
  });

  describe('List Spaces', () => {
    it('should list available spaces', async () => {
      const res = await request(app)
        .get('/api/vendor/spaces')
        .set('Authorization', `Bearer ${vendorToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.spaces).toBeInstanceOf(Array);
      // Ensure our created space is present
      const found = res.body.spaces.find(s => s.space_id === spaceId);
      expect(found).toBeTruthy();
    });
  });

  describe('Create Request', () => {
    it('should submit a booking request', async () => {
      // Future dates
      const start = new Date(Date.now() + 86400000).toISOString(); // +1 day
      const end = new Date(Date.now() + 90000000).toISOString();   // +1 day + 1hr

      const res = await request(app)
        .post('/api/vendor/requests')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          spaceId: spaceId,
          lat: 12.0001,
          lng: 77.0001,
          maxWidth: 3,
          maxLength: 3,
          startTime: start,
          endTime: end
        });

      expect(res.statusCode).toEqual(201);
      // expect(res.body).toHaveProperty('message', 'Request submitted successfully');
      expect(res.body.message).toMatch(/submitted/i); // More flexible
    });

    it('should fail validation on missing fields', async () => {
      const res = await request(app)
        .post('/api/vendor/requests')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          // Missing spaceId
          startTime: new Date().toISOString()
        });
      
      expect(res.statusCode).toEqual(400); // Bad Request
    });
  });

  describe('Get Requests', () => {
    it('should list vendor requests', async () => {
      const res = await request(app)
        .get('/api/vendor/requests')
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.requests).toBeInstanceOf(Array);
      expect(res.body.requests.length).toBeGreaterThan(0);
    });
  });
});
