const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// --- تنظیمات مهم ---
app.use(cors()); // به همه دامنه‌ها اجازه دسترسی می‌دهد
app.use(express.json()); // اجازه خواندن داده‌های JSON را می‌دهد
// --------------------

const PORT = process.env.PORT || 5000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const initializeDatabase = async () => { /* این بخش بدون تغییر است */ };

// === API Routes for Books ===
app.get('/api/books', async (req, res) => {
  const query = req.query._admin ? 'SELECT * FROM books ORDER BY id DESC' : 'SELECT * FROM books WHERE "isActive" = true ORDER BY id DESC';
  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: "Error fetching books" }); }
});
app.get('/api/books/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Book not found' });
        res.json(result.rows[0]);
    } catch (err) { console.error(err); res.status(500).json({ message: "Error fetching book" }); }
});
app.post('/api/books', async (req, res) => {
  const { title, author, category, price, coverImage, description } = req.body;
  if (!title || !author) {
    return res.status(400).json({ message: 'Title and author are required.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO books (title, author, category, price, coverImage, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, author, category, price, coverImage, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: "Error adding book to database" }); }
});
app.put('/api/books/:id', async (req, res) => { /* ... */ });
app.delete('/api/books/:id', async (req, res) => { /* ... */ });
app.patch('/api/books/:id/toggle', async (req, res) => { /* ... */ });

// === API Routes for Posts ===
app.get('/api/posts', async (req, res) => { /* ... */ });
app.post('/api/posts', async (req, res) => {
  const { title, author, coverImage, content } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Title is required.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO posts (title, author, coverImage, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, author, coverImage, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: "Error adding post" }); }
});
// ... بقیه API های پست‌ها ...


app.listen(PORT, () => {
  initializeDatabase();
  console.log(`Server is running successfully on port ${PORT}`);
});