
const request = require('supertest');
const app = require('../app');
const db = require('../config/db');

describe('Admin Endpoints', () => {
  const timestamp = Date.now();
  const adminEmail = `admin${timestamp}@smartstreet.com`;
  const ownerEmail = `owner_req${timestamp}@example.com`;
  const vendorEmail = `vendor_req${timestamp}@example.com`;
  const password = 'password123';
  
  let adminToken;
  let ownerToken;
  let vendorToken;
  let spaceId;
  let requestId;

  beforeAll(async () => {
    // 1. Register Admin
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Test Admin', email: adminEmail, password, role: 'ADMIN', phone: '0000000000', adminCode: process.env.ADMIN_REG_CODE || 'admin123'
    });
    // Debug if fails
    if (regRes.statusCode !== 201) {
      console.error('Admin Registration Failed:', regRes.body);
    }
    expect(regRes.statusCode).toEqual(201);

    const adminLogin = await request(app).post('/api/auth/login').send({ email: adminEmail, password });
    expect(adminLogin.statusCode).toEqual(200);
    adminToken = adminLogin.body.token;

    // 2. Register Owner & Create Space
    const ownerReg = await request(app).post('/api/auth/register').send({
      name: 'Test Owner', email: ownerEmail, password, role: 'OWNER', phone: '111', ownerName: 'C', contactInfo: 'i'
    });
    ownerToken = ownerReg.body.token;
    const spaceRes = await request(app).post('/api/owner/spaces').set('Authorization', `Bearer ${ownerToken}`).send({
      spaceName: `Admin Test Space ${timestamp}`, address: '123 Admin St', lat: 34.0, lng: -118.0, allowedRadius: 100
    });
    spaceId = spaceRes.body.space.space_id;

    // 3. Register Vendor & Create Request
    const vendorReg = await request(app).post('/api/auth/register').send({
      name: 'Test Vendor', email: vendorEmail, password, role: 'VENDOR', phone: '222', businessName: 'B', category: 'C', licenseNumber: 'L'
    });
    vendorToken = vendorReg.body.token;
    
    // Future Date
    const start = new Date(Date.now() + 100000000).toISOString();
    const end = new Date(Date.now() + 103600000).toISOString();
    
    const reqRes = await request(app).post('/api/vendor/requests').set('Authorization', `Bearer ${vendorToken}`).send({
      spaceId: null, lat: 34.0001, lng: -118.0001, maxWidth: 2, maxLength: 2, startTime: start, endTime: end
    });
    
    // We need requestId. Usually returned in response or we list requests.
    // If POST doesn't return ID, we list.
    const listRes = await request(app).get('/api/vendor/requests').set('Authorization', `Bearer ${vendorToken}`);
    requestId = listRes.body.requests[0].request_id;
  }, 30000); // Increase timeout to 30s

  afterAll(async () => {
    await db.pool.end();
  });

  describe('Manage Requests', () => {
    it('should list pending requests', async () => {
      const res = await request(app)
        .get('/api/admin/requests?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.requests).toBeInstanceOf(Array);
      const found = res.body.requests.find(r => r.request_id === requestId);
      expect(found).toBeTruthy();
    });

    it('should approve a request', async () => {
      const res = await request(app)
        .post(`/api/admin/requests/${requestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toEqual(200);
      // expect(res.body).toHaveProperty('message', 'Request approved and permit issued');
      expect(res.body).toHaveProperty('request');
      expect(res.body).toHaveProperty('permit');
      expect(res.body.request.status).toEqual('APPROVED');
    }, 30000);
  });

  describe('Stats', () => {
    it('should return dashboard stats', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('stats');
      expect(res.body.stats).toHaveProperty('total_vendors');
      expect(res.body.stats).toHaveProperty('total_spaces');
    });
  });
});
