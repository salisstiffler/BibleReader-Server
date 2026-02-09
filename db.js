const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'holy.db'));

// Initialize tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
        user_id INTEGER PRIMARY KEY,
        theme TEXT,
        language TEXT,
        font_size INTEGER,
        line_height REAL,
        font_family TEXT,
        custom_theme TEXT,
        accent_color TEXT,
        page_turn_effect TEXT,
        continuous_reading BOOLEAN,
        playback_rate REAL,
        pause_on_manual_switch BOOLEAN,
        loop_count INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS progress (
        user_id INTEGER PRIMARY KEY,
        book_index INTEGER,
        chapter_index INTEGER,
        verse_num INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        book_id TEXT,
        chapter INTEGER,
        start_verse INTEGER,
        end_verse INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS highlights (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        book_id TEXT,
        chapter INTEGER,
        start_verse INTEGER,
        end_verse INTEGER,
        color TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        book_id TEXT,
        chapter INTEGER,
        start_verse INTEGER,
        end_verse INTEGER,
        text TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL,
        version_code INTEGER,
        version_name TEXT,
        update_info TEXT,
        file_url TEXT,
        file_path TEXT,
        signature_hash TEXT,
        is_force_update BOOLEAN DEFAULT 0,
        release_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// Initialize default admin
const bcrypt = require('bcryptjs');
const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get('admin');
if (!admin) {
    const hash = bcrypt.hashSync('123456', 10);
    db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('admin', hash);
}

module.exports = db;
