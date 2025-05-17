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
  connection = await mysql.createConnection(dbConfig);
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS urls (
      id INT AUTO_INCREMENT PRIMARY KEY,
      shortId VARCHAR(10) UNIQUE NOT NULL,
      customUrl VARCHAR(50) UNIQUE,
      originalUrl TEXT NOT NULL
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS custom_url_mappings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      backend_url VARCHAR(255) NOT NULL,
      custom_url VARCHAR(50) UNIQUE NOT NULL
    )
  `);
}

app.post('/shorten', async (req, res) => {
  const { originalUrl, customUrl } = req.body;
  if (!originalUrl) {
    return res.status(400).json({ error: 'originalUrl is required' });
  }
  const shortId = Math.random().toString(36).substring(2, 8);
  try {
    console.log('Received customUrl:', customUrl);
    await connection.execute(
      'INSERT INTO urls (shortId, originalUrl) VALUES (?, ?)',
      [shortId, originalUrl]
    );

    if (customUrl) {
      try {
        await connection.execute(
          'INSERT INTO custom_url_mappings (backend_url, custom_url) VALUES (?, ?)',
          [shortId, customUrl]
        );
      } catch (err) {
        console.error('Error inserting custom URL mapping:', err);
        return res.status(500).json({ error: 'Custom URL mapping error' });
      }
    }

    res.json({ shortId, shortUrl: `http://localhost:${port}/${customUrl || shortId}` });
  } catch (error) {
    console.error('Error inserting URL:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/:shortId', async (req, res) => {
  const { shortId } = req.params;
  try {
    const [rows] = await connection.execute(
      'SELECT originalUrl FROM urls WHERE shortId = ?',
      [shortId]
    );
    if (rows.length > 0) {
      res.redirect(rows[0].originalUrl);
    } else {
      res.status(404).send('Short URL not found');
    }
  } catch (error) {
    console.error('Error querying URL:', error);
    res.status(500).send('Database error');
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
