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

const initializeDatabase = async () => { /* ... */ };

// === API Routes for Books ===
app.get('/api/books', async (req, res) => { /* ... */ });
app.post('/api/books', async (req, res) => {
  const { title, author, category, price, coverimage } = req.body;
  // ...
  const result = await pool.query(
    'INSERT INTO books (title, author, category, price, coverimage) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [title, author, category, price, coverimage]
  );
  // ...
});
// ... ALL OTHER ENDPOINTS FOR BOOKS AND POSTS ...

app.listen(PORT, () => {
  initializeDatabase();
  console.log(`Server is running on port ${PORT}`);
});