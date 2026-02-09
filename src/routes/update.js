import { Hono } from 'hono';

const update = new Hono();

update.get('/check', async (c) => {
    const platform = c.req.query('platform');
    const currentVersionCode = c.req.query('currentVersionCode');

    if (!platform) {
        return c.json({ error: 'Platform is required' }, 400);
    }

    const db = c.env.DB;

    try {
        const latest = await db.prepare(`
            SELECT * FROM app_versions 
            WHERE platform = ? 
            ORDER BY version_code DESC, created_at DESC 
            LIMIT 1
        `).bind(platform).first();

        if (!latest) {
            return c.json({ update: false });
        }

        const currentCode = parseInt(currentVersionCode) || 0;
        const hasUpdate = latest.version_code > currentCode;

        return c.json({
            update: hasUpdate,
            versionName: latest.version_name,
            versionCode: latest.version_code,
            updateInfo: latest.update_info,
            fileUrl: latest.file_url,
            isForceUpdate: !!latest.is_force_update,
            releaseDate: latest.release_date
        });
    } catch (err) {
        return c.json({ error: err.message }, 500);
    }
});

export default update;
