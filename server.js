const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // ابزار جدید برای اتصال به PostgreSQL

const app = express();
const PORT = process.env.PORT || 5000; // استفاده از پورت Render یا پورت محلی

// تنظیمات اتصال به پایگاه داده از طریق متغیر محیطی که بعداً در Render تنظیم می‌کنیم
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// تابعی برای ساختن جدول در صورت عدم وجود
const createTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      category VARCHAR(255),
      price NUMERIC,
      coverImage TEXT,
      description TEXT,
      createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(createTableQuery);
    console.log("Table 'books' is checked and ready.");
  } catch (err) {
    console.error("Error creating or checking table:", err);
  }
};

app.use(cors());
app.use(express.json());

// API: گرفتن لیست تمام کتاب‌ها
app.get('/api/books', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching books from database" });
  }
});

// API: اضافه کردن یک کتاب جدید
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
  } catch (err) {
    res.status(500).json({ message: "Error adding book to database" });
  }
});

// API: آپدیت کردن یک کتاب
app.put('/api/books/:id', async (req, res) => {
    const { id } = req.params;
    const { title, author, category, price, coverImage, description } = req.body;
    try {
        const result = await pool.query(
            'UPDATE books SET title = $1, author = $2, category = $3, price = $4, coverImage = $5, description = $6 WHERE id = $7 RETURNING *',
            [title, author, category, price, coverImage, description, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Book not found.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Error updating book" });
    }
});

// API: حذف کردن یک کتاب
app.delete('/api/books/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM books WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Book not found.' });
        }
        res.status(200).json({ message: 'Book deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: "Error deleting book" });
    }
});

// اجرای سرور و ساختن جدول
app.listen(PORT, () => {
  createTable();
  console.log(`Server is running successfully on port ${PORT}`);
});