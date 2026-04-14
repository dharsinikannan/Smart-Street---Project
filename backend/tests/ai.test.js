
const request = require('supertest');
const app = require('../app');
const db = require('../config/db');

// Mock external AI service
jest.mock('../services/aiService', () => ({
  generateSQL: jest.fn().mockResolvedValue('SELECT * FROM spaces'),
  answerQuestion: jest.fn().mockResolvedValue('This is a mocked AI response.')
}));

describe('AI Chat Endpoints', () => {
  afterAll(async () => {
    await db.pool.end();
  });

  describe('POST /api/chat', () => {
    it('should return AI response', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: "Find parking" });
      
      expect(res.statusCode).toEqual(200);
      // Since we mocked generateSQL to return SQL, controller should try to execute it.
      // If DB has no spaces, might return empty or error.
      // But the important thing is controller called the service.
      
      // The controller returns: { type: 'data', sql: ..., results: ... } 
      // OR { type: 'text', content: ... }
      
      expect(res.body).toHaveProperty('type');
      if (res.body.type === 'data') {
         expect(res.body).toHaveProperty('sql');
      } else {
         expect(res.body).toHaveProperty('content'); 
      }
    });

    it('should handle empty message', async () => {
      const res = await request(app).post('/api/chat').send({ message: "" });
      expect(res.statusCode).toEqual(400);
    });
  });
});
