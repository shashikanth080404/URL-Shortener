import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'admin',
  database: 'neural',
};

let connection;

async function initDb() {
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Create urls table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS urls (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shortId VARCHAR(10) UNIQUE NOT NULL,
        originalUrl TEXT NOT NULL,
        title VARCHAR(255),
        qr TEXT,
        custom_url VARCHAR(50) UNIQUE,
        user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

app.post('/shorten', async (req, res) => {
  const { originalUrl, customUrl, title, user_id, qr } = req.body;
  
  if (!originalUrl) {
    return res.status(400).json({ error: 'originalUrl is required' });
  }

  const shortId = Math.random().toString(36).substring(2, 8);

  try {
    const [result] = await connection.execute(
      'INSERT INTO urls (shortId, originalUrl, title, custom_url, user_id, qr) VALUES (?, ?, ?, ?, ?, ?)',
      [shortId, originalUrl, title, customUrl, user_id, qr]
    );

    const [newUrl] = await connection.execute(
      'SELECT * FROM urls WHERE id = ?',
      [result.insertId]
    );

    res.json(newUrl);
  } catch (error) {
    console.error('Error creating URL:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/:shortId', async (req, res) => {
  const { shortId } = req.params;
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM urls WHERE shortId = ? OR custom_url = ?',
      [shortId, shortId]
    );

    if (rows.length > 0) {
      res.redirect(rows[0].originalUrl);
    } else {
      res.status(404).send('URL not found');
    }
  } catch (error) {
    console.error('Error retrieving URL:', error);
    res.status(500).send('Server error');
  }
});

// Get all URLs for a user
app.get('/api/urls/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM urls WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error retrieving URLs:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete a URL
app.delete('/api/urls/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await connection.execute('DELETE FROM urls WHERE id = ?', [id]);
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