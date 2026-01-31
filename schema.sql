-- schema.sql
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
