import express from 'express';
import cors from 'cors';
import initSqlJs from 'sql.js';

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

let db;

async function initDb() {
  try {
    const SQL = await initSqlJs();
    db = new SQL.Database();
    
    // Create urls table if it doesn't exist
    db.run(`
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

// Add root route handler
app.get('/', (req, res) => {
  res.json({ message: 'URL Shortener API is running' });
});

app.post('/shorten', (req, res) => {
  const { originalUrl, customUrl, title, user_id, qr } = req.body;
  
  if (!originalUrl) {
    return res.status(400).json({ error: 'originalUrl is required' });
  }

  const shortId = Math.random().toString(36).substring(2, 8);

  try {
    // Check if custom URL already exists
    if (customUrl) {
      const stmt = db.prepare('SELECT id FROM urls WHERE custom_url = ?');
      const exists = stmt.step();
      stmt.free();
      
      if (exists) {
        return res.status(400).json({ error: 'Custom URL already taken' });
      }
    }

    db.run(
      'INSERT INTO urls (shortId, originalUrl, title, custom_url, user_id, qr) VALUES (?, ?, ?, ?, ?, ?)',
      [shortId, originalUrl, title, customUrl, user_id, qr]
    );

    const stmt = db.prepare('SELECT * FROM urls WHERE shortId = ?');
    const result = stmt.getAsObject([shortId]);
    stmt.free();

    res.json(result);
  } catch (error) {
    console.error('Error creating URL:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/:shortId', (req, res) => {
  const { shortId } = req.params;
  try {
    const stmt = db.prepare('SELECT * FROM urls WHERE shortId = ? OR custom_url = ?');
    const result = stmt.getAsObject([shortId, shortId]);
    stmt.free();

    if (result.originalUrl) {
      res.redirect(result.originalUrl);
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
    const stmt = db.prepare('SELECT * FROM urls WHERE user_id = ? ORDER BY created_at DESC');
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    res.json(results);
  } catch (error) {
    console.error('Error retrieving URLs:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/urls/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.run('DELETE FROM urls WHERE id = ?', [id]);
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