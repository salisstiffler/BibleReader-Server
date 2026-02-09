import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';

const admin = new Hono();

// Admin Auth Middleware
const adminAuth = async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized: No token provided' }, 401);
    }

    const token = authHeader.split(' ')[1];
    const JWT_SECRET = c.env.JWT_SECRET || 'secret_key';

    try {
        const decoded = await verify(token, JWT_SECRET, 'HS256');
        if (!decoded.isAdmin) {
            return c.json({ error: 'Forbidden: Admin access required' }, 403);
        }
        c.set('adminId', decoded.adminId);
        await next();
    } catch (err) {
        return c.json({ error: 'Unauthorized: Invalid token' }, 401);
    }
};

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

// List all users
admin.get('/users', adminAuth, async (c) => {
    const db = c.env.DB;
    try {
        const { results: users } = await db.prepare('SELECT id, username, created_at FROM users').all();
        return c.json(users);
    } catch (err) {
        return c.json({ error: err.message }, 500);
    }
});

// Get user content
admin.get('/users/:id/content', adminAuth, async (c) => {
    const userId = c.req.param('id');
    const db = c.env.DB;
    try {
        const { results: bookmarks } = await db.prepare('SELECT * FROM bookmarks WHERE user_id = ?').bind(userId).all();
        const { results: notes } = await db.prepare('SELECT * FROM notes WHERE user_id = ?').bind(userId).all();
        const { results: highlights } = await db.prepare('SELECT * FROM highlights WHERE user_id = ?').bind(userId).all();
        const settings = await db.prepare('SELECT * FROM settings WHERE user_id = ?').bind(userId).first();
        const progress = await db.prepare('SELECT * FROM progress WHERE user_id = ?').bind(userId).first();

        return c.json({ bookmarks, notes, highlights, settings, progress });
    } catch (err) {
        return c.json({ error: err.message }, 500);
    }
});

// Delete user
admin.delete('/users/:id', adminAuth, async (c) => {
    const userId = c.req.param('id');
    const db = c.env.DB;
    try {
        await db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
        return c.json({ success: true });
    } catch (err) {
        return c.json({ error: err.message }, 500);
    }
});

// Update user password
admin.post('/users/:id/password', adminAuth, async (c) => {
    const userId = c.req.param('id');
    const { newPassword } = await c.req.json();
    if (!newPassword) return c.json({ error: 'New password required' }, 400);

    const db = c.env.DB;
    try {
        const hash = await bcrypt.hash(newPassword, 10);
        await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(hash, userId).run();
        return c.json({ success: true });
    } catch (err) {
        return c.json({ error: err.message }, 500);
    }
});

// List versions
admin.get('/versions', adminAuth, async (c) => {
    const db = c.env.DB;
    try {
        const { results: versions } = await db.prepare('SELECT * FROM app_versions ORDER BY created_at DESC').all();
        return c.json(versions);
    } catch (err) {
        return c.json({ error: err.message }, 500);
    }
});

// Delete version
admin.delete('/versions/:id', adminAuth, async (c) => {
    const versionId = c.req.param('id');
    const db = c.env.DB;
    try {
        await db.prepare('DELETE FROM app_versions WHERE id = ?').bind(versionId).run();
        return c.json({ success: true });
    } catch (err) {
        return c.json({ error: err.message }, 500);
    }
});

// Note: /versions/parse and /versions/publish are Node-only due to Multer and SFTP requirements.
// They return 501 Not Implemented in Worker environment to avoid 404.
admin.post('/versions/parse', adminAuth, (c) => {
    return c.json({ error: 'Direct upload is only supported on the Node.js backend. Please use the Node.js instance for publishing new versions.' }, 501);
});

admin.post('/versions/publish', adminAuth, (c) => {
    return c.json({ error: 'Direct publishing is only supported on the Node.js backend.' }, 501);
});

export default admin;
