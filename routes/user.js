const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Get full profile (Settings, Progress, Bookmarks, Highlights, Notes)
router.get('/profile', auth, (req, res) => {
    const userId = req.userId;

    const settings = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(userId);
    const progress = db.prepare('SELECT * FROM progress WHERE user_id = ?').get(userId);
    const bookmarksRaw = db.prepare('SELECT * FROM bookmarks WHERE user_id = ?').all(userId);
    const highlightsRaw = db.prepare('SELECT * FROM highlights WHERE user_id = ?').all(userId);
    const notesRaw = db.prepare('SELECT * FROM notes WHERE user_id = ?').all(userId);

    // Convert snake_case to camelCase for frontend
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

    res.json({
        settings: settings || null,
        progress: progress || null,
        bookmarks,
        highlights,
        notes
    });
});

// Sync settings and progress only (called periodically for reading progress)
router.post('/sync-progress', auth, (req, res) => {
    const userId = req.userId;
    const { progress } = req.body;

    try {
        if (progress) {
            db.prepare(`
                INSERT INTO progress (user_id, book_index, chapter_index, verse_num)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    book_index=excluded.book_index, chapter_index=excluded.chapter_index, verse_num=excluded.verse_num
            `).run(userId, progress.bookIndex, progress.chapterIndex, progress.verseNum);
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Progress sync failed' });
    }
});

// Sync settings only
router.post('/sync-settings', auth, (req, res) => {
    const userId = req.userId;
    const { settings } = req.body;

    try {
        if (settings) {
            db.prepare(`
                INSERT INTO settings (user_id, theme, language, font_size, line_height, font_family, custom_theme, accent_color, page_turn_effect, continuous_reading, playback_rate, pause_on_manual_switch, loop_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    theme=excluded.theme, language=excluded.language, font_size=excluded.font_size, line_height=excluded.line_height,
                    font_family=excluded.font_family, custom_theme=excluded.custom_theme, accent_color=excluded.accent_color,
                    page_turn_effect=excluded.page_turn_effect, continuous_reading=excluded.continuous_reading,
                    playback_rate=excluded.playback_rate, pause_on_manual_switch=excluded.pause_on_manual_switch, loop_count=excluded.loop_count
            `).run(
                userId, settings.theme, settings.language, settings.fontSize, settings.lineHeight, settings.fontFamily,
                settings.customTheme, settings.accentColor, settings.pageTurnEffect, settings.continuousReading ? 1 : 0,
                settings.playbackRate, settings.pauseOnManualSwitch ? 1 : 0, settings.loopCount
            );
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Settings sync failed' });
    }
});

// Add bookmark
router.post('/bookmark/add', auth, (req, res) => {
    const userId = req.userId;
    const { id, bookId, chapter, startVerse, endVerse } = req.body;

    try {
        db.prepare('INSERT OR REPLACE INTO bookmarks (id, user_id, book_id, chapter, start_verse, end_verse) VALUES (?, ?, ?, ?, ?, ?)')
            .run(id, userId, bookId, chapter, startVerse, endVerse);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add bookmark' });
    }
});

// Remove bookmark
router.post('/bookmark/remove', auth, (req, res) => {
    const userId = req.userId;
    const { id } = req.body;

    try {
        db.prepare('DELETE FROM bookmarks WHERE id = ? AND user_id = ?').run(id, userId);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to remove bookmark' });
    }
});

// Add/Update highlight
router.post('/highlight/set', auth, (req, res) => {
    const userId = req.userId;
    const { id, bookId, chapter, startVerse, endVerse, color } = req.body;

    try {
        db.prepare('INSERT OR REPLACE INTO highlights (id, user_id, book_id, chapter, start_verse, end_verse, color) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .run(id, userId, bookId, chapter, startVerse, endVerse, color);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to set highlight' });
    }
});

// Remove highlight
router.post('/highlight/remove', auth, (req, res) => {
    const userId = req.userId;
    const { id } = req.body;

    try {
        db.prepare('DELETE FROM highlights WHERE id = ? AND user_id = ?').run(id, userId);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to remove highlight' });
    }
});

// Add/Update note
router.post('/note/save', auth, (req, res) => {
    const userId = req.userId;
    const { id, bookId, chapter, startVerse, endVerse, text } = req.body;

    try {
        if (text && text.trim()) {
            db.prepare('INSERT OR REPLACE INTO notes (id, user_id, book_id, chapter, start_verse, end_verse, text) VALUES (?, ?, ?, ?, ?, ?, ?)')
                .run(id, userId, bookId, chapter, startVerse, endVerse, text);
        } else {
            // If text is empty, delete the note
            db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(id, userId);
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save note' });
    }
});

// Remove note
router.post('/note/remove', auth, (req, res) => {
    const userId = req.userId;
    const { id } = req.body;

    try {
        db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(id, userId);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to remove note' });
    }
});

// Sync data (Batch update) - Keep for initial sync or full sync
router.post('/sync', auth, (req, res) => {
    const userId = req.userId;
    const { settings, progress, bookmarks, highlights, notes } = req.body;

    const transaction = db.transaction(() => {
        // Sync Settings
        if (settings) {
            db.prepare(`
                INSERT INTO settings (user_id, theme, language, font_size, line_height, font_family, custom_theme, accent_color, page_turn_effect, continuous_reading, playback_rate, pause_on_manual_switch, loop_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    theme=excluded.theme, language=excluded.language, font_size=excluded.font_size, line_height=excluded.line_height,
                    font_family=excluded.font_family, custom_theme=excluded.custom_theme, accent_color=excluded.accent_color,
                    page_turn_effect=excluded.page_turn_effect, continuous_reading=excluded.continuous_reading,
                    playback_rate=excluded.playback_rate, pause_on_manual_switch=excluded.pause_on_manual_switch, loop_count=excluded.loop_count
            `).run(
                userId, settings.theme, settings.language, settings.fontSize, settings.lineHeight, settings.fontFamily,
                settings.customTheme, settings.accentColor, settings.pageTurnEffect, settings.continuousReading ? 1 : 0,
                settings.playbackRate, settings.pauseOnManualSwitch ? 1 : 0, settings.loopCount
            );
        }

        // Sync Progress
        if (progress) {
            db.prepare(`
                INSERT INTO progress (user_id, book_index, chapter_index, verse_num)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    book_index=excluded.book_index, chapter_index=excluded.chapter_index, verse_num=excluded.verse_num
            `).run(userId, progress.bookIndex, progress.chapterIndex, progress.verseNum);
        }

        // Sync Bookmarks (Delete all and re-insert for simplicity or diff)
        // Let's do a simple replace all for this user
        db.prepare('DELETE FROM bookmarks WHERE user_id = ?').run(userId);
        if (bookmarks && bookmarks.length > 0) {
            const insert = db.prepare('INSERT INTO bookmarks (id, user_id, book_id, chapter, start_verse, end_verse) VALUES (?, ?, ?, ?, ?, ?)');
            for (const b of bookmarks) {
                insert.run(b.id, userId, b.bookId, b.chapter, b.startVerse, b.endVerse);
            }
        }

        // Sync Highlights
        db.prepare('DELETE FROM highlights WHERE user_id = ?').run(userId);
        if (highlights && highlights.length > 0) {
            const insert = db.prepare('INSERT INTO highlights (id, user_id, book_id, chapter, start_verse, end_verse, color) VALUES (?, ?, ?, ?, ?, ?, ?)');
            for (const h of highlights) {
                insert.run(h.id, userId, h.bookId, h.chapter, h.startVerse, h.endVerse, h.color);
            }
        }

        // Sync Notes
        db.prepare('DELETE FROM notes WHERE user_id = ?').run(userId);
        if (notes && notes.length > 0) {
            const insert = db.prepare('INSERT INTO notes (id, user_id, book_id, chapter, start_verse, end_verse, text) VALUES (?, ?, ?, ?, ?, ?, ?)');
            for (const n of notes) {
                insert.run(n.id, userId, n.bookId, n.chapter, n.startVerse, n.endVerse, n.text);
            }
        }
    });

    try {
        transaction();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sync failed' });
    }
});

module.exports = router;
