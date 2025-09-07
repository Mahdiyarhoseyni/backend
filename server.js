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

const initializeDatabase = async () => { /* ... (این بخش بدون تغییر است) ... */ };

// === API Routes for Books ===
app.get('/api/books', async (req, res) => {
  const query = req.query._admin ? 'SELECT * FROM books ORDER BY id DESC' : 'SELECT * FROM books WHERE "isActive" = true ORDER BY id DESC';
  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: "Error fetching books" }); }
});

app.get('/api/books/:id', async (req, res) => { /* ... */ });
app.post('/api/books', async (req, res) => { /* ... */ });
app.put('/api/books/:id', async (req, res) => { /* ... */ });
app.delete('/api/books/:id', async (req, res) => { /* ... */ });
app.patch('/api/books/:id/toggle', async (req, res) => { /* ... */ });


// === API Routes for Posts (کامل شده) ===
app.get('/api/posts', async (req, res) => {
  const query = req.query._admin ? 'SELECT * FROM posts ORDER BY id DESC' : 'SELECT * FROM posts WHERE "isActive" = true ORDER BY id DESC';
  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: "Error fetching posts" }); }
});

app.get('/api/posts/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Post not found' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: "Error fetching post" }); }
});

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
  } catch (err) { res.status(500).json({ message: "Error adding post to database" }); }
});

app.put('/api/posts/:id', async (req, res) => {
    const { id } = req.params;
    const { title, author, coverImage, content } = req.body;
    try {
        const result = await pool.query(
            'UPDATE posts SET title = $1, author = $2, coverImage = $3, content = $4 WHERE id = $5 RETURNING *',
            [title, author, coverImage, content, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Post not found.' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: "Error updating post" }); }
});

app.delete('/api/posts/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM posts WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Post not found.' });
        res.status(200).json({ message: 'Post deleted successfully.' });
    } catch (err) { res.status(500).json({ message: "Error deleting post" }); }
});

app.patch('/api/posts/:id/toggle', async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    try {
        const result = await pool.query('UPDATE posts SET "isActive" = $1 WHERE id = $2 RETURNING *', [isActive, id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: "Error updating status" });}
});


app.listen(PORT, () => {
  initializeDatabase();
  console.log(`Server is running successfully on port ${PORT}`);
});