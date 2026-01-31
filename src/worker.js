import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';

const app = new Hono();

// Middleware
app.use('*', cors());

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// Auth routes (unprotected)
app.route('/api/auth', authRoutes);

// Protected routes middleware
app.use('/api/user/*', async (c, next) => {
    const JWT_SECRET = c.env.JWT_SECRET || 'secret_key';
    const authMiddleware = jwt({
        secret: JWT_SECRET,
        alg: 'HS256',
    });

    // We want to extract userId from payload and put it in context
    try {
        await authMiddleware(c, async () => {
            const payload = c.get('jwtPayload');
            if (payload && payload.userId) {
                c.set('userId', payload.userId);
            }
            await next();
        });
    } catch (err) {
        return c.json({ error: 'Unauthorized: Invalid token' }, 401);
    }
});

// User routes
app.route('/api/user', userRoutes);

export default app;
