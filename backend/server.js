import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;
const JWT_SECRET = 'schastie-secret-key-2026';

app.use(cors());
app.use(express.json());

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Нет авторизации' });
  try {
    const decoded = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Неверный токен' });
  }
}

// ===== Auth =====
app.post('/api/login', (req, res) => {
  const { login, password } = req.body;
  const admin = db.prepare('SELECT id FROM admins WHERE login = ? AND password = ?').get(login, password);
  if (!admin) return res.status(401).json({ error: 'Неверный логин или пароль' });
  const token = jwt.sign({ id: admin.id, login }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

// ===== Bookings =====
app.get('/api/bookings', auth, (req, res) => {
  const bookings = db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all();
  res.json(bookings);
});

app.delete('/api/bookings/:id', auth, (req, res) => {
  db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.post('/api/bookings', (req, res) => {
  const { name, phone, email, date, guests, message } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Имя и телефон обязательны' });
  db.prepare('INSERT INTO bookings (name, phone, email, date, guests, message) VALUES (?, ?, ?, ?, ?, ?)')
    .run(name, phone, email || '', date || '', guests || '', message || '');
  res.json({ ok: true });
});

// ===== Reviews =====
app.get('/api/reviews', (req, res) => {
  const reviews = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
  res.json(reviews);
});

app.post('/api/reviews', auth, (req, res) => {
  const { author, event, text, stars } = req.body;
  if (!author || !text) return res.status(400).json({ error: 'Автор и текст обязательны' });
  db.prepare('INSERT INTO reviews (author, event, text, stars) VALUES (?, ?, ?, ?)')
    .run(author, event || '', text, stars || 5);
  res.json({ ok: true });
});

app.delete('/api/reviews/:id', auth, (req, res) => {
  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ===== Services =====
app.get('/api/services', (req, res) => {
  const services = db.prepare('SELECT * FROM services ORDER BY id').all();
  res.json(services);
});

app.put('/api/services/:id', auth, (req, res) => {
  const { name, price, badge, features, is_featured } = req.body;
  db.prepare('UPDATE services SET name=?, price=?, badge=?, features=?, is_featured=? WHERE id=?')
    .run(name, price, badge, JSON.stringify(features || []), is_featured ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

// Serve static files from parent directory (the site)
app.use(express.static(join(__dirname, '..')));

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
