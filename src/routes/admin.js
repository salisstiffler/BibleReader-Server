const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getAppMetadata, getFileSignature, uploadToSCP } = require('../src/utils/appHelper');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

// Admin Auth Middleware
const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded.isAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        req.adminId = decoded.adminId;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

const upload = multer({ dest: 'uploads/' });

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
        if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign({ adminId: admin.id, isAdmin: true }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, username: admin.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrative management functions
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all users
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Array of user objects
 */
router.get('/users', adminAuth, (req, res) => {
    try {
        const users = db.prepare('SELECT id, username, created_at FROM users').all();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}/content:
 *   get:
 *     summary: Get all content for a specific user
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile, settings, and content
 */
router.get('/users/:id/content', adminAuth, (req, res) => {
    const userId = req.params.id;
    try {
        const bookmarks = db.prepare('SELECT * FROM bookmarks WHERE user_id = ?').all(userId);
        const notes = db.prepare('SELECT * FROM notes WHERE user_id = ?').all(userId);
        const highlights = db.prepare('SELECT * FROM highlights WHERE user_id = ?').all(userId);
        const settings = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(userId);
        const progress = db.prepare('SELECT * FROM progress WHERE user_id = ?').get(userId);

        res.json({ bookmarks, notes, highlights, settings, progress });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user and all their data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/users/:id', adminAuth, (req, res) => {
    const userId = req.params.id;
    try {
        db.prepare('DELETE FROM users WHERE id = ?').run(userId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}/password:
 *   post:
 *     summary: Update a user's password
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 */
router.post('/users/:id/password', adminAuth, async (req, res) => {
    const userId = req.params.id;
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'New password required' });

    try {
        const hash = await bcrypt.hash(newPassword, 10);
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/admin/versions/parse:
 *   post:
 *     summary: Upload and parse app version metadata
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Metadata extracted
 */
router.post('/versions/parse', adminAuth, upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const meta = await getAppMetadata(file.path, file.originalname);
        res.json({
            success: true,
            meta: {
                ...meta,
                tempPath: file.path,
                originalName: file.originalname
            }
        });
    } catch (err) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/admin/versions/publish:
 *   post:
 *     summary: Finalize and publish the version
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tempPath
 *               - meta
 *             properties:
 *               tempPath:
 *                 type: string
 *               updateInfo:
 *                 type: string
 *               isForceUpdate:
 *                 type: boolean
 *               meta:
 *                 type: object
 *     responses:
 *       200:
 *         description: Version published
 */
router.post('/versions/publish', adminAuth, async (req, res) => {
    const { tempPath, meta, updateInfo, isForceUpdate } = req.body;

    if (!tempPath || !fs.existsSync(tempPath)) {
        return res.status(400).json({ error: 'Invalid or missing temporary file' });
    }

    try {
        const signature = getFileSignature(tempPath);
        const originalName = meta.originalName;

        const scpConfig = {
            host: process.env.SCP_HOST,
            port: process.env.SCP_PORT || 22,
            username: process.env.SCP_USER,
            password: process.env.SCP_PASSWORD,
        };

        if (process.env.SCP_KEY_PATH && fs.existsSync(process.env.SCP_KEY_PATH)) {
            scpConfig.privateKey = fs.readFileSync(process.env.SCP_KEY_PATH);
        }

        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const remoteFileName = `${meta.versionName || '1.0'}_${dateStr}_${originalName}`;

        const baseDir = process.env.SCP_BASE_PATH || '/home/ubuntu/bible_client/';
        // Ensure meta.platform is handled (android -> android, etc.)
        const remotePath = path.join(baseDir, meta.platform, remoteFileName).replace(/\\/g, '/');

        if (scpConfig.host) {
            await uploadToSCP(tempPath, remotePath, scpConfig);
        }

        const fileUrl = `${process.env.DOWNLOAD_BASE_URL || ''}/downloads/${meta.platform}/${remoteFileName}`;

        const stmt = db.prepare(`
            INSERT INTO app_versions (platform, version_code, version_name, update_info, file_url, file_path, signature_hash, is_force_update)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
            meta.platform,
            meta.versionCode || 0,
            meta.versionName || '1.0.0',
            updateInfo || '',
            fileUrl,
            remotePath,
            signature,
            isForceUpdate ? 1 : 0
        );

        fs.unlinkSync(tempPath);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/admin/versions:
 *   get:
 *     summary: List version history
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Array of version objects
 */
/**
 * @swagger
 * /api/admin/versions/{id}:
 *   delete:
 *     summary: Delete a version from history
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Version deleted
 */
router.delete('/versions/:id', adminAuth, (req, res) => {
    const { id } = req.params;
    try {
        db.prepare('DELETE FROM app_versions WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/versions', adminAuth, (req, res) => {
    try {
        const versions = db.prepare('SELECT * FROM app_versions ORDER BY created_at DESC').all();
        res.json(versions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
