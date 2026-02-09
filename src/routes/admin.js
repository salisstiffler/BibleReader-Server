import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import bcrypt from 'bcryptjs';

const admin = new Hono();

admin.post('/login', async (c) => {
    const { username, password } = await c.req.json();
    const db = c.env.DB;
    const JWT_SECRET = c.env.JWT_SECRET || 'secret_key';

    try {
        const adminUser = await db.prepare('SELECT * FROM admins WHERE username = ?').bind(username).first();
        if (!adminUser || !(await bcrypt.compare(password, adminUser.password_hash))) {
            return c.json({ error: 'Invalid username or password' }, 401);
        }

        const token = await sign({ adminId: adminUser.id, isAdmin: true }, JWT_SECRET, 'HS256');
        return c.json({ token, username: adminUser.username });
    } catch (err) {
        console.error(err);
        return c.json({ error: err.message }, 500);
    }
});

export default admin;
