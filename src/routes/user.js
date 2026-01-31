import { Hono } from 'hono';

const user = new Hono();

// Get full profile
user.get('/profile', async (c) => {
    const userId = c.get('userId');
    const db = c.env.DB;

    const settings = await db.prepare('SELECT * FROM settings WHERE user_id = ?').bind(userId).first();
    const progress = await db.prepare('SELECT * FROM progress WHERE user_id = ?').bind(userId).first();
    const { results: bookmarksRaw } = await db.prepare('SELECT * FROM bookmarks WHERE user_id = ?').bind(userId).all();
    const { results: highlightsRaw } = await db.prepare('SELECT * FROM highlights WHERE user_id = ?').bind(userId).all();
    const { results: notesRaw } = await db.prepare('SELECT * FROM notes WHERE user_id = ?').bind(userId).all();

    const bookmarks = bookmarksRaw.map(b => ({
        id: b.id,
        bookId: b.book_id,
        chapter: b.chapter,
        startVerse: b.start_verse,
        endVerse: b.end_verse
    }));

    const highlights = highlightsRaw.map(h => ({
        id: h.id,
        bookId: h.book_id,
        chapter: h.chapter,
        startVerse: h.start_verse,
        endVerse: h.end_verse,
        color: h.color
    }));

    const notes = notesRaw.map(n => ({
        id: n.id,
        bookId: n.book_id,
        chapter: n.chapter,
        startVerse: n.start_verse,
        endVerse: n.end_verse,
        text: n.text
    }));

    return c.json({
        settings: settings || null,
        progress: progress || null,
        bookmarks,
        highlights,
        notes
    });
});

// Sync progress
user.post('/sync-progress', async (c) => {
    const userId = c.get('userId');
    const { progress } = await c.req.json();
    const db = c.env.DB;

    try {
        if (progress) {
            await db.prepare(`
                INSERT INTO progress (user_id, book_index, chapter_index, verse_num)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    book_index=excluded.book_index, chapter_index=excluded.chapter_index, verse_num=excluded.verse_num
            `).bind(userId, progress.bookIndex, progress.chapterIndex, progress.verseNum).run();
        }
        return c.json({ success: true });
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Progress sync failed' }, 500);
    }
});

// Sync settings
user.post('/sync-settings', async (c) => {
    const userId = c.get('userId');
    const { settings } = await c.req.json();
    const db = c.env.DB;

    try {
        if (settings) {
            await db.prepare(`
                INSERT INTO settings (user_id, theme, language, font_size, line_height, font_family, custom_theme, accent_color, page_turn_effect, continuous_reading, playback_rate, pause_on_manual_switch, loop_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    theme=excluded.theme, language=excluded.language, font_size=excluded.font_size, line_height=excluded.line_height,
                    font_family=excluded.font_family, custom_theme=excluded.custom_theme, accent_color=excluded.accent_color,
                    page_turn_effect=excluded.page_turn_effect, continuous_reading=excluded.continuous_reading,
                    playback_rate=excluded.playback_rate, pause_on_manual_switch=excluded.pause_on_manual_switch, loop_count=excluded.loop_count
            `).bind(
                userId, settings.theme, settings.language, settings.fontSize, settings.lineHeight, settings.fontFamily,
                settings.customTheme, settings.accentColor, settings.pageTurnEffect, settings.continuousReading ? 1 : 0,
                settings.playbackRate, settings.pauseOnManualSwitch ? 1 : 0, settings.loopCount
            ).run();
        }
        return c.json({ success: true });
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Settings sync failed' }, 500);
    }
});

// Add bookmark
user.post('/bookmark/add', async (c) => {
    const userId = c.get('userId');
    const { id, bookId, chapter, startVerse, endVerse } = await c.req.json();
    const db = c.env.DB;

    try {
        await db.prepare('INSERT OR REPLACE INTO bookmarks (id, user_id, book_id, chapter, start_verse, end_verse) VALUES (?, ?, ?, ?, ?, ?)')
            .bind(id, userId, bookId, chapter, startVerse, endVerse).run();
        return c.json({ success: true });
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Failed to add bookmark' }, 500);
    }
});

// Remove bookmark
user.post('/bookmark/remove', async (c) => {
    const userId = c.get('userId');
    const { id } = await c.req.json();
    const db = c.env.DB;

    try {
        await db.prepare('DELETE FROM bookmarks WHERE id = ? AND user_id = ?').bind(id, userId).run();
        return c.json({ success: true });
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Failed to remove bookmark' }, 500);
    }
});

// Add/Update highlight
user.post('/highlight/set', async (c) => {
    const userId = c.get('userId');
    const { id, bookId, chapter, startVerse, endVerse, color } = await c.req.json();
    const db = c.env.DB;

    try {
        await db.prepare('INSERT OR REPLACE INTO highlights (id, user_id, book_id, chapter, start_verse, end_verse, color) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .bind(id, userId, bookId, chapter, startVerse, endVerse, color).run();
        return c.json({ success: true });
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Failed to set highlight' }, 500);
    }
});

// Remove highlight
user.post('/highlight/remove', async (c) => {
    const userId = c.get('userId');
    const { id } = await c.req.json();
    const db = c.env.DB;

    try {
        await db.prepare('DELETE FROM highlights WHERE id = ? AND user_id = ?').bind(id, userId).run();
        return c.json({ success: true });
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Failed to remove highlight' }, 500);
    }
});

// Add/Update note
user.post('/note/save', async (c) => {
    const userId = c.get('userId');
    const { id, bookId, chapter, startVerse, endVerse, text } = await c.req.json();
    const db = c.env.DB;

    try {
        if (text && text.trim()) {
            await db.prepare('INSERT OR REPLACE INTO notes (id, user_id, book_id, chapter, start_verse, end_verse, text) VALUES (?, ?, ?, ?, ?, ?, ?)')
                .bind(id, userId, bookId, chapter, startVerse, endVerse, text).run();
        } else {
            await db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').bind(id, userId).run();
        }
        return c.json({ success: true });
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Failed to save note' }, 500);
    }
});

// Remove note
user.post('/note/remove', async (c) => {
    const userId = c.get('userId');
    const { id } = await c.req.json();
    const db = c.env.DB;

    try {
        await db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').bind(id, userId).run();
        return c.json({ success: true });
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Failed to remove note' }, 500);
    }
});

// Sync data (Batch update)
user.post('/sync', async (c) => {
    const userId = c.get('userId');
    const { settings, progress, bookmarks, highlights, notes } = await c.req.json();
    const db = c.env.DB;

    // Cloudflare D1 batching
    const batch = [];

    if (settings) {
        batch.push(db.prepare(`
            INSERT INTO settings (user_id, theme, language, font_size, line_height, font_family, custom_theme, accent_color, page_turn_effect, continuous_reading, playback_rate, pause_on_manual_switch, loop_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                theme=excluded.theme, language=excluded.language, font_size=excluded.font_size, line_height=excluded.line_height,
                font_family=excluded.font_family, custom_theme=excluded.custom_theme, accent_color=excluded.accent_color,
                page_turn_effect=excluded.page_turn_effect, continuous_reading=excluded.continuous_reading,
                playback_rate=excluded.playback_rate, pause_on_manual_switch=excluded.pause_on_manual_switch, loop_count=excluded.loop_count
        `).bind(
            userId, settings.theme, settings.language, settings.fontSize, settings.lineHeight, settings.fontFamily,
            settings.customTheme, settings.accentColor, settings.pageTurnEffect, settings.continuousReading ? 1 : 0,
            settings.playbackRate, settings.pauseOnManualSwitch ? 1 : 0, settings.loopCount
        ));
    }

    if (progress) {
        batch.push(db.prepare(`
            INSERT INTO progress (user_id, book_index, chapter_index, verse_num)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                book_index=excluded.book_index, chapter_index=excluded.chapter_index, verse_num=excluded.verse_num
        `).bind(userId, progress.bookIndex, progress.chapterIndex, progress.verseNum));
    }

    // Replace all pattern
    batch.push(db.prepare('DELETE FROM bookmarks WHERE user_id = ?').bind(userId));
    if (bookmarks && bookmarks.length > 0) {
        for (const b of bookmarks) {
            batch.push(db.prepare('INSERT INTO bookmarks (id, user_id, book_id, chapter, start_verse, end_verse) VALUES (?, ?, ?, ?, ?, ?)').bind(b.id, userId, b.bookId, b.chapter, b.startVerse, b.endVerse));
        }
    }

    batch.push(db.prepare('DELETE FROM highlights WHERE user_id = ?').bind(userId));
    if (highlights && highlights.length > 0) {
        for (const h of highlights) {
            batch.push(db.prepare('INSERT INTO highlights (id, user_id, book_id, chapter, start_verse, end_verse, color) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(h.id, userId, h.bookId, h.chapter, h.startVerse, h.endVerse, h.color));
        }
    }

    batch.push(db.prepare('DELETE FROM notes WHERE user_id = ?').bind(userId));
    if (notes && notes.length > 0) {
        for (const n of notes) {
            batch.push(db.prepare('INSERT INTO notes (id, user_id, book_id, chapter, start_verse, end_verse, text) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(n.id, userId, n.bookId, n.chapter, n.startVerse, n.endVerse, n.text));
        }
    }

    try {
        await db.batch(batch);
        return c.json({ success: true });
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Sync failed' }, 500);
    }
});

export default user;
