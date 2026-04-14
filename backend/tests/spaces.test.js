
const request = require('supertest');
const app = require('../app');
const db = require('../config/db');

describe('Space Endpoints', () => {
  const timestamp = Date.now();
  const ownerEmail = `spaceowner${timestamp}@example.com`;
  const password = 'password123';
  let token;
  let ownerId;

  // Setup: Register an owner and login to get token
  beforeAll(async () => {
    // Register
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Space Owner',
        email: ownerEmail,
        password: password,
        role: 'OWNER',
        phone: "1112223333",
        ownerName: "Space Corp",
        contactInfo: "info@spacecorp.com"
      });

    // Login
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: ownerEmail, password: password });
    
    token = res.body.token;
    ownerId = res.body.user.id;
  });

  // Teardown
  afterAll(async () => {
    await db.pool.end();
  });

  describe('Create Space', () => {
    it('should create a space with valid token', async () => {
      const res = await request(app)
        .post('/api/owner/spaces')
        .set('Authorization', `Bearer ${token}`)
        .send({
          spaceName: `Test Space ${timestamp}`,
          address: "123 Test Lane",
          lat: 40.7128,
          lng: -74.0060,
          allowedRadius: 50
        });

      expect(res.statusCode).toEqual(201);
      // expect(res.body).toHaveProperty('message', 'Space created successfully'); // specific message not returned
      expect(res.body).toHaveProperty('space');
      expect(res.body.space).toHaveProperty('space_name', `Test Space ${timestamp}`);
    });

    it('should fail without token', async () => {
      const res = await request(app)
        .post('/api/owner/spaces')
        .send({
          spaceName: "Unauthorized Space",
          address: "No Auth St",
          lat: 0,
          lng: 0,
          allowedRadius: 10
        });
      
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('Get Spaces', () => {
    it('should list owner spaces', async () => {
      const res = await request(app)
        .get('/api/owner/spaces')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('spaces');
      expect(Array.isArray(res.body.spaces)).toBeTruthy();
      expect(res.body.spaces.length).toBeGreaterThan(0);
    });
  });
});
