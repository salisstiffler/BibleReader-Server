const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const adminRoutes = require('../routes/admin');
const updateRoutes = require('../routes/update');
const db = require('../db');

const app = express();
app.use(bodyParser.json());
app.use('/api/admin', adminRoutes);
app.use('/api/update', updateRoutes);

describe('Admin & Update API', () => {
    let adminToken;

    beforeAll(async () => {
        const res = await request(app)
            .post('/api/admin/login')
            .send({ username: 'admin', password: '123456' });
        adminToken = res.body.token;
    });

    test('GET /api/admin/users should return a list', async () => {
        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /api/update/check should handle no version found', async () => {
        const res = await request(app).get('/api/update/check?platform=pc');
        expect(res.statusCode).toEqual(200);
        expect(res.body.update).toBe(false);
    });

    test('GET /api/update/check should return 400 if no platform', async () => {
        const res = await request(app).get('/api/update/check');
        expect(res.statusCode).toEqual(400);
    });
});
