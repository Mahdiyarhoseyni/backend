const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// --- این دو خط حیاتی در کد شما وجود نداشت ---
app.use(cors());
app.use(express.json());
// -----------------------------------------

const PORT = process.env.PORT || 5000;

// تنظیمات اتصال به پایگاه داده از طریق متغیر محیطی
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// تابع هوشمند برای آماده‌سازی پایگاه داده
const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    // ساخت جدول کتاب‌ها
    await client.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, author VARCHAR(255) NOT NULL,
        category VARCHAR(255), price NUMERIC, coverImage TEXT, description TEXT,
        "isActive" BOOLEAN DEFAULT true,
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // ساخت جدول پست‌ها
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, author VARCHAR(255),
        coverImage TEXT, content TEXT, "isActive" BOOLEAN DEFAULT true,
        publishDate TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Database tables are checked and ready.");
  } catch (err) {
    console.error("Error during database initialization:", err);
  } finally {
    client.release();
  }
};

// === API Routes for Books ===
app.get('/api/books', async (req, res) => {
  const query = req.query._admin ? 'SELECT * FROM books ORDER BY id DESC' : 'SELECT * FROM books WHERE "isActive" = true ORDER BY id DESC';
  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: "Error fetching books" }); }
});

app.get('/api/books/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Book not found' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: "Error fetching book" }); }
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
  } catch (err) { res.status(500).json({ message: "Error adding book to database" }); }
});

app.put('/api/books/:id', async (req, res) => {
    const { id } = req.params;
    const { title, author, category, price, coverImage, description } = req.body;
    try {
        const result = await pool.query(
            'UPDATE books SET title = $1, author = $2, category = $3, price = $4, coverImage = $5, description = $6 WHERE id = $7 RETURNING *',
            [title, author, category, price, coverImage, description, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Book not found.' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: "Error updating book" }); }
});

app.delete('/api/books/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM books WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Book not found.' });
        res.status(200).json({ message: 'Book deleted successfully.' });
    } catch (err) { res.status(500).json({ message: "Error deleting book" }); }
});

app.patch('/api/books/:id/toggle', async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    try {
        const result = await pool.query('UPDATE books SET "isActive" = $1 WHERE id = $2 RETURNING *', [isActive, id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: "Error updating status" });}
});

// === API Routes for Posts (شما می‌توانید این بخش را کامل کنید) ===
app.get('/api/posts', async (req, res) => {
  // ...
});

// اجرای سرور
app.listen(PORT, () => {
  initializeDatabase();
  console.log(`Server is running successfully on port ${PORT}`);
});