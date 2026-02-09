const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('../routes/auth');
const db = require('../db');

const app = express();
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);

describe('Auth API', () => {
    let testUser = {
        username: `testuser_${Date.now()}`,
        password: 'password123'
    };

    test('POST /api/auth/register should create a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.username).toEqual(testUser.username);
    });

    test('POST /api/auth/login should authenticate user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send(testUser);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    test('POST /api/auth/login should fail with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: testUser.username, password: 'wrongpassword' });

        expect(res.statusCode).toEqual(401);
    });
});
