const request = require('supertest');
const app = require('../app');
const db = require('../config/db');
const jwt = require('jsonwebtoken');

describe('Public Endpoints', () => {
  const timestamp = Date.now();
  let permitId; // We will generate a fake UUID for testing 404
  let validQrCode;

  beforeAll(async () => {
    // We don't need a full setup here if we just test Public logic behavior
  });

  afterAll(async () => {
    await db.pool.end();
  });

  describe('GET /api/public/verify-permit/:qrCode', () => {
    it('should return 404 for non-existent permit ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app).get(`/api/public/verify-permit/${fakeId}`);
      expect(res.statusCode).toEqual(404);
    });

    it('should return 401 for invalid JWT format', async () => {
      const res = await request(app).get(`/api/public/verify-permit/invalid-jwt-string`);
      expect(res.statusCode).toEqual(401); 
    });
  });

  describe('GET /api/public/vendors', () => {
    it('should return list of vendors', async () => {
        const res = await request(app).get('/api/public/vendors');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('vendors');
        expect(res.body.vendors).toBeInstanceOf(Array);
    });
  });
});
