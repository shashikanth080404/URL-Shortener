import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

const db = new Database('neural.db');

async function initDb() {
  try {
    // Create urls table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS urls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shortId TEXT UNIQUE NOT NULL,
        originalUrl TEXT NOT NULL,
        title TEXT,
        qr TEXT,
        custom_url TEXT UNIQUE,
        user_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

app.post('/shorten', (req, res) => {
  const { originalUrl, customUrl, title, user_id, qr } = req.body;
  
  if (!originalUrl) {
    return res.status(400).json({ error: 'originalUrl is required' });
  }

  const shortId = Math.random().toString(36).substring(2, 8);

  try {
    const stmt = db.prepare(
      'INSERT INTO urls (shortId, originalUrl, title, custom_url, user_id, qr) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(shortId, originalUrl, title, customUrl, user_id, qr);

    const newUrl = db.prepare('SELECT * FROM urls WHERE id = ?').get(result.lastInsertRowid);
    res.json(newUrl);
  } catch (error) {
    console.error('Error creating URL:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/:shortId', (req, res) => {
  const { shortId } = req.params;
  try {
    const row = db.prepare(
      'SELECT * FROM urls WHERE shortId = ? OR custom_url = ?'
    ).get(shortId, shortId);

    if (row) {
      res.redirect(row.originalUrl);
    } else {
      res.status(404).send('URL not found');
    }
  } catch (error) {
    console.error('Error retrieving URL:', error);
    res.status(500).send('Server error');
  }
});

app.get('/api/urls/:userId', (req, res) => {
  const { userId } = req.params;
  try {
    const rows = db.prepare(
      'SELECT * FROM urls WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);
    res.json(rows);
  } catch (error) {
    console.error('Error retrieving URLs:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/urls/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM urls WHERE id = ?').run(id);
    res.json({ message: 'URL deleted successfully' });
  } catch (error) {
    console.error('Error deleting URL:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`URL Shortener backend listening at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
  });