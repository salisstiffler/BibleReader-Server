const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/user');
const db = require('../db');

const app = express();
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

describe('User API', () => {
    let token;
    let username = `user_${Date.now()}`;

    beforeAll(async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username, password: 'password123' });
        token = res.body.token;
    });

    test('GET /api/user/profile should return user data', async () => {
        const res = await request(app)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('settings');
        expect(res.body).toHaveProperty('bookmarks');
    });

    test('POST /api/user/sync should update settings', async () => {
        const syncData = {
            settings: { theme: 'dark', fontSize: 18 }
        };
        const res = await request(app)
            .post('/api/user/sync')
            .set('Authorization', `Bearer ${token}`)
            .send(syncData);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);

        const profileRes = await request(app)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${token}`);

        expect(profileRes.body.settings.theme).toBe('dark');
        expect(profileRes.body.settings.font_size).toBe(18);
    });
});
