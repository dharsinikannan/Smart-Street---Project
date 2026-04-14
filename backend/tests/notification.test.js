const request = require('supertest');
const app = require('../app');
const db = require('../config/db');

describe('Notification Endpoints', () => {
    const timestamp = Date.now();
    const vendorEmail = `vendor_notif${timestamp}@smartstreet.com`;
    const password = 'password123';
    let vendorToken;
    let userId;

    beforeAll(async () => {
        // Register Vendor
        const regRes = await request(app).post('/api/auth/register').send({
            name: 'Test Vendor Notif', email: vendorEmail, password, role: 'VENDOR', phone: '333', businessName: 'NB', category: 'C', licenseNumber: 'L'
        });
        expect(regRes.statusCode).toEqual(201);
        
        const loginRes = await request(app).post('/api/auth/login').send({ email: vendorEmail, password });
        vendorToken = loginRes.body.token;
        userId = loginRes.body.user.userId;
    });

    afterAll(async () => {
        await db.pool.end();
    });

    it('should list empty notifications initially', async () => {
        const res = await request(app)
            .get('/api/notifications')
            .set('Authorization', `Bearer ${vendorToken}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.notifications).toBeInstanceOf(Array);
        expect(res.body.notifications.length).toEqual(0);
    });

    // Manually insert a notification to test retrieval and marking as read
    it('should list notifications and mark as read', async () => {
        // Direct DB insertion to simulate system event
        const insertQuery = `
            INSERT INTO notifications (user_id, type, title, message)
            VALUES ($1, 'REQUEST_APPROVED', 'Test Title', 'Test Message')
            RETURNING notification_id
        `;
        // We insert, but we don't rely on the returned ID yet, we fetch it via API to be safe
        await db.query(insertQuery, [userId]);
       
        // Verify it appears in list
        const listRes = await request(app)
            .get('/api/notifications')
            .set('Authorization', `Bearer ${vendorToken}`);
        
        expect(listRes.body.notifications.length).toBeGreaterThan(0);
        expect(listRes.body.notifications[0].title).toEqual('Test Title');

        const notificationId = listRes.body.notifications[0].notification_id;

        // Mark as read
        const readRes = await request(app)
            .put(`/api/notifications/${notificationId}/read`)
            .set('Authorization', `Bearer ${vendorToken}`);
        
        expect(readRes.statusCode).toEqual(200);
        expect(readRes.body.is_read).toEqual(true);
    });
});
