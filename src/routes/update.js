const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * @swagger
 * tags:
 *   name: Update
 *   description: App version check and update services
 */

/**
 * @swagger
 * /api/update/check:
 *   get:
 *     summary: Check for app updates
 *     tags: [Update]
 *     parameters:
 *       - in: query
 *         name: platform
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: currentVersionCode
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Update information
 */
router.get('/check', (req, res) => {
    const { platform, currentVersionCode } = req.query;

    if (!platform) {
        return res.status(400).json({ error: 'Platform is required' });
    }

    try {
        const latest = db.prepare(`
            SELECT * FROM app_versions 
            WHERE platform = ? 
            ORDER BY version_code DESC, created_at DESC 
            LIMIT 1
        `).get(platform);

        if (!latest) {
            return res.json({ update: false });
        }

        const currentCode = parseInt(currentVersionCode) || 0;
        const hasUpdate = latest.version_code > currentCode;

        res.json({
            update: hasUpdate,
            versionName: latest.version_name,
            versionCode: latest.version_code,
            updateInfo: latest.update_info,
            fileUrl: latest.file_url,
            isForceUpdate: !!latest.is_force_update,
            releaseDate: latest.release_date
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
