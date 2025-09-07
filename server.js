const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, author VARCHAR(255) NOT NULL,
        category VARCHAR(255), price NUMERIC, coverimage TEXT, description TEXT,
        "isActive" BOOLEAN DEFAULT true, createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, author VARCHAR(255),
        coverimage TEXT, content TEXT, "isActive" BOOLEAN DEFAULT true,
        publishDate TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`);
    
    const booksColumns = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='books' AND column_name='isActive';");
    if (booksColumns.rowCount === 0) {
      await client.query('ALTER TABLE books ADD COLUMN "isActive" BOOLEAN DEFAULT true;');
    }
    
    const postsColumns = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='posts' AND column_name='isActive';");
    if (postsColumns.rowCount === 0) {
      await client.query('ALTER TABLE posts ADD COLUMN "isActive" BOOLEAN DEFAULT true;');
    }

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
  } catch (err) { console.error(err); res.status(500).json({ message: "Error fetching books" }); }
});
app.get('/api/books/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
        res.json(result.rows[0]);
    } catch (err) { console.error(err); res.status(500).json({ message: "Error fetching book" }); }
});
app.post('/api/books', async (req, res) => {
  const { title, author, category, price, coverimage, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO books (title, author, category, price, coverimage, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, author, category, price, coverimage, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: "Error adding book" }); }
});
app.put('/api/books/:id', async (req, res) => {
    const { id } = req.params;
    const { title, author, category, price, coverimage, description } = req.body;
    try {
        const result = await pool.query(
            'UPDATE books SET title = $1, author = $2, category = $3, price = $4, coverimage = $5, description = $6 WHERE id = $7 RETURNING *',
            [title, author, category, price, coverimage, description, id]
        );
        res.json(result.rows[0]);
    } catch (err) { console.error(err); res.status(500).json({ message: "Error updating book" }); }
});
app.delete('/api/books/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM books WHERE id = $1', [id]);
        res.status(200).json({ message: 'Book deleted successfully.' });
    } catch (err) { console.error(err); res.status(500).json({ message: "Error deleting book" }); }
});
app.patch('/api/books/:id/toggle', async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    try {
        const result = await pool.query('UPDATE books SET "isActive" = $1 WHERE id = $2 RETURNING *', [isActive, id]);
        res.json(result.rows[0]);
    } catch (err) { console.error(err); res.status(500).json({ message: "Error updating status" });}
});

// === API Routes for Posts ===
app.get('/api/posts', async (req, res) => {
  const query = req.query._admin ? 'SELECT * FROM posts ORDER BY id DESC' : 'SELECT * FROM posts WHERE "isActive" = true ORDER BY id DESC';
  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: "Error fetching posts" }); }
});
app.get('/api/posts/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
        res.json(result.rows[0]);
    } catch (err) { console.error(err); res.status(500).json({ message: "Error fetching post" }); }
});
app.post('/api/posts', async (req, res) => {
  const { title, author, coverimage, content } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO posts (title, author, coverimage, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, author, coverimage, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: "Error adding post" }); }
});
app.put('/api/posts/:id', async (req, res) => {
    const { id } = req.params;
    const { title, author, coverimage, content } = req.body;
    try {
        const result = await pool.query(
            'UPDATE posts SET title = $1, author = $2, coverimage = $3, content = $4 WHERE id = $5 RETURNING *',
            [title, author, coverimage, content, id]
        );
        res.json(result.rows[0]);
    } catch (err) { console.error(err); res.status(500).json({ message: "Error updating post" }); }
});
app.delete('/api/posts/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM posts WHERE id = $1', [id]);
        res.status(200).json({ message: 'Post deleted successfully.' });
    } catch (err) { console.error(err); res.status(500).json({ message: "Error deleting post" }); }
});
app.patch('/api/posts/:id/toggle', async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    try {
        const result = await pool.query('UPDATE posts SET "isActive" = $1 WHERE id = $2 RETURNING *', [isActive, id]);
        res.json(result.rows[0]);
    } catch (err) { console.error(err); res.status(500).json({ message: "Error updating status" });}
});

app.listen(PORT, () => {
  initializeDatabase();
  console.log(`Server is running successfully on port ${PORT}`);
});