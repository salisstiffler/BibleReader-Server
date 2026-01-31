import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import bcrypt from 'bcryptjs';

const auth = new Hono();

// Register
auth.post('/register', async (c) => {
    const { username, password } = await c.req.json();
    if (!username || !password) {
        return c.json({ error: 'Username and password required' }, 400);
    }

    const db = c.env.DB;
    const JWT_SECRET = c.env.JWT_SECRET || 'secret_key';

    try {
        const password_hash = await bcrypt.hash(password, 10);
        const info = await db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').bind(username, password_hash).run();
        const userId = info.meta.last_row_id;

        const token = await sign({ userId }, JWT_SECRET, 'HS256');
        return c.json({ token, user: { id: userId, username } });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return c.json({ error: 'Username already exists' }, 400);
        }
        console.error(err);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// Login
auth.post('/login', async (c) => {
    const { username, password } = await c.req.json();
    const db = c.env.DB;
    const JWT_SECRET = c.env.JWT_SECRET || 'secret_key';

    const user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return c.json({ error: 'Invalid username or password' }, 401);
    }

    const token = await sign({ userId: user.id }, JWT_SECRET, 'HS256');
    return c.json({ token, user: { id: user.id, username: user.username } });
});

export default auth;
