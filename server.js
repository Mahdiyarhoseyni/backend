const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

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
    // ساخت جدول کتاب‌ها اگر وجود نداشت
    await client.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, author VARCHAR(255) NOT NULL,
        category VARCHAR(255), price NUMERIC, coverImage TEXT, description TEXT,
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ساخت جدول پست‌ها اگر وجود نداشت
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, author VARCHAR(255),
        coverImage TEXT, content TEXT, "isActive" BOOLEAN DEFAULT true,
        publishDate TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // چک کردن و اضافه کردن ستون 'isActive' به جدول کتاب‌ها
    const booksColumns = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='books' AND column_name='isActive';");
    if (booksColumns.rowCount === 0) {
      await client.query('ALTER TABLE books ADD COLUMN "isActive" BOOLEAN DEFAULT true;');
      console.log("Column 'isActive' added to 'books' table.");
    }
    
    console.log("Database tables are checked and ready.");
  } catch (err) {
    console.error("Error during database initialization:", err);
  } finally {
    client.release();
  }
};


app.use(cors());
app.use(express.json());

// === API Routes for Books ===
// فقط کتاب‌های فعال را به سایت اصلی می‌فرستد
app.get('/api/books', async (req, res) => {
  const query = req.query._admin ? 'SELECT * FROM books ORDER BY id DESC' : 'SELECT * FROM books WHERE "isActive" = true ORDER BY id DESC';
  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: "Error fetching books" }); }
});

// API جدید برای تغییر وضعیت فعال/غیرفعال کتاب
app.patch('/api/books/:id/toggle', async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    try {
        const result = await pool.query('UPDATE books SET "isActive" = $1 WHERE id = $2 RETURNING *', [isActive, id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: "Error updating status" });}
});

// ... بقیه API های کتاب‌ها (POST, PUT, DELETE, GET by ID) در اینجا قرار می‌گیرند ...


// === API Routes for Posts ===
app.get('/api/posts', async (req, res) => {
  const query = req.query._admin ? 'SELECT * FROM posts ORDER BY id DESC' : 'SELECT * FROM posts WHERE "isActive" = true ORDER BY id DESC';
  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: "Error fetching posts" }); }
});

// ... API های دیگر برای پست‌ها (POST, PUT, DELETE, PATCH) در اینجا قرار می‌گیرند ...


// اجرای سرور و آماده‌سازی پایگاه داده
app.listen(PORT, () => {
  initializeDatabase();
  console.log(`Server is running successfully on port ${PORT}`);
});