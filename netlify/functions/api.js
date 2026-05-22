import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '..', '..', 'backend', 'data.db');

let db;
try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  initDB();
} catch (e) {
  console.error('DB init error:', e.message);
}

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL,
      email TEXT DEFAULT '', date TEXT DEFAULT '', guests TEXT DEFAULT '',
      message TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT, author TEXT NOT NULL, event TEXT DEFAULT '',
      text TEXT NOT NULL, stars INTEGER DEFAULT 5, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price INTEGER NOT NULL,
      badge TEXT DEFAULT '', features TEXT DEFAULT '[]', is_featured INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT UNIQUE NOT NULL, password TEXT NOT NULL
    );
  `);
  if (!db.prepare('SELECT id FROM admins WHERE login = ?').get('admin')) {
    db.prepare('INSERT INTO admins (login, password) VALUES (?, ?)').run('admin', 'admin123');
  }
  if (db.prepare('SELECT COUNT(*) as c FROM services').get().c === 0) {
    const ins = db.prepare('INSERT INTO services (name,price,badge,features,is_featured) VALUES (?,?,?,?,?)');
    ins.run('Базовый', 1500, 'Базовый', '["Банкетное меню (5 подач)","Обслуживание официантами","Базовое оформление стола","Музыкальное сопровождение"]', 0);
    ins.run('Популярный', 2500, 'Популярный', '["Расширенное меню (7 подач)","Обслуживание + бармен","Индивидуальный декор зала","Звук, свет, сцена","Фотозона"]', 1);
    ins.run('Премиум', 4000, 'Премиум', '["Премиум-меню (9 подач)","Персональный менеджер","Полный декор и флористика","Проф. звук, свет, сцена","Фото-видео съёмка в подарок","Трансфер гостей"]', 0);
  }
  if (db.prepare('SELECT COUNT(*) as c FROM reviews').get().c === 0) {
    const ins = db.prepare('INSERT INTO reviews (author,event,text,stars) VALUES (?,?,?,?)');
    ins.run('Анна и Дмитрий', 'Свадьба, 25 гостей', 'Спасибо огромное за нашу свадьбу!', 5);
    ins.run('ООО «Ромашка»', 'Корпоратив, 50 гостей', 'Вкусная кухня, красивая подача, отличный сервис.', 5);
    ins.run('Мария', 'День рождения, 30 гостей', 'Очень уютный зал, стильный интерьер.', 5);
  }
}

const JWT_SECRET = 'schastie-secret-key-2026';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' }
  });
}

function auth(request) {
  const header = request.headers.get('authorization');
  if (!header) return null;
  try { return jwt.verify(header.replace('Bearer ', ''), JWT_SECRET); } catch { return null; }
}

function getBody(request) {
  return request.json();
}

export async function handler(event) {
  const method = event.httpMethod;
  const path = event.path.replace('/.netlify/functions/api', '').replace(/\/$/, '');
  const body = event.body ? JSON.parse(event.body) : {};
  const headers = event.headers;

  // CORS preflight
  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' } };
  }

  try {
    // Auth
    if (path === '/login' && method === 'POST') {
      const admin = db.prepare('SELECT id FROM admins WHERE login = ? AND password = ?').get(body.login, body.password);
      if (!admin) return { statusCode: 401, body: JSON.stringify({ error: 'Неверный логин или пароль' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
      const token = jwt.sign({ id: admin.id, login: body.login }, JWT_SECRET, { expiresIn: '24h' });
      return { statusCode: 200, body: JSON.stringify({ token }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
    }

    // Bookings
    if (path === '/bookings') {
      if (method === 'POST') {
        if (!body.name || !body.phone) return { statusCode: 400, body: JSON.stringify({ error: 'Имя и телефон обязательны' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
        db.prepare('INSERT INTO bookings (name, phone, email, date, guests, message) VALUES (?, ?, ?, ?, ?, ?)').run(body.name, body.phone, body.email || '', body.date || '', body.guests || '', body.message || '');
        return { statusCode: 200, body: JSON.stringify({ ok: true }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
      }
      if (method === 'GET') {
        if (!auth(event)) return { statusCode: 401, body: JSON.stringify({ error: 'Нет авторизации' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
        const bookings = db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all();
        return { statusCode: 200, body: JSON.stringify(bookings), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
      }
    }

    if (path.match(/^\/bookings\/\d+$/) && method === 'DELETE') {
      if (!auth(event)) return { statusCode: 401, body: JSON.stringify({ error: 'Нет авторизации' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
      const id = path.split('/')[2];
      db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
      return { statusCode: 200, body: JSON.stringify({ ok: true }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
    }

    // Reviews
    if (path === '/reviews') {
      if (method === 'GET') {
        const reviews = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
        return { statusCode: 200, body: JSON.stringify(reviews), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
      }
      if (method === 'POST') {
        if (!auth(event)) return { statusCode: 401, body: JSON.stringify({ error: 'Нет авторизации' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
        if (!body.author || !body.text) return { statusCode: 400, body: JSON.stringify({ error: 'Автор и текст обязательны' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
        db.prepare('INSERT INTO reviews (author, event, text, stars) VALUES (?, ?, ?, ?)').run(body.author, body.event || '', body.text, body.stars || 5);
        return { statusCode: 200, body: JSON.stringify({ ok: true }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
      }
    }

    if (path.match(/^\/reviews\/\d+$/) && method === 'DELETE') {
      if (!auth(event)) return { statusCode: 401, body: JSON.stringify({ error: 'Нет авторизации' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
      const id = path.split('/')[2];
      db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
      return { statusCode: 200, body: JSON.stringify({ ok: true }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
    }

    // Services
    if (path === '/services' && method === 'GET') {
      const services = db.prepare('SELECT * FROM services ORDER BY id').all();
      return { statusCode: 200, body: JSON.stringify(services), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
    }

    if (path.match(/^\/services\/\d+$/) && method === 'PUT') {
      if (!auth(event)) return { statusCode: 401, body: JSON.stringify({ error: 'Нет авторизации' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
      const id = path.split('/')[2];
      db.prepare('UPDATE services SET name=?, price=?, badge=?, features=?, is_featured=? WHERE id=?')
        .run(body.name, body.price, body.badge, JSON.stringify(body.features || []), body.is_featured ? 1 : 0, id);
      return { statusCode: 200, body: JSON.stringify({ ok: true }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
    }

    return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };

  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
  }
}
