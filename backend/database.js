import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'data.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    date TEXT DEFAULT '',
    guests TEXT DEFAULT '',
    message TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now', '+3 hours'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    event TEXT DEFAULT '',
    text TEXT NOT NULL,
    stars INTEGER DEFAULT 5,
    created_at TEXT DEFAULT (datetime('now', '+3 hours'))
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    badge TEXT DEFAULT '',
    features TEXT DEFAULT '[]',
    is_featured INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
`);

const adminExists = db.prepare('SELECT id FROM admins WHERE login = ?').get('admin');
if (!adminExists) {
  db.prepare('INSERT INTO admins (login, password) VALUES (?, ?)').run('admin', 'admin123');
}

export default db;
