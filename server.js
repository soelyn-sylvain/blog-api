import express from 'express';
import cors from 'cors';
import { db } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/articles', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM articles ORDER BY date DESC');
  res.json(rows);
});

app.get('/api/articles/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM articles WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Non trouvé' });
  res.json(rows[0]);
});

app.post('/api/articles', async (req, res) => {
  const { title, slug, category, summary, content, imageUrl, imageAlt } = req.body;
  const [result] = await db.query(
    'INSERT INTO articles (title, slug, category, summary, content, imageUrl, imageAlt, date) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
    [title, slug, category, summary, content, imageUrl, imageAlt]
  );
  res.json({ id: result.insertId });
});

app.put('/api/articles/:id', async (req, res) => {
  const { title, slug, category, summary, content, imageUrl, imageAlt } = req.body;
  await db.query(
    'UPDATE articles SET title = ?, slug = ?, category = ?, summary = ?, content = ?, imageUrl = ?, imageAlt = ? WHERE id = ?',
    [title, slug, category, summary, content, imageUrl, imageAlt, req.params.id]
  );
  res.json({ success: true });
});

app.delete('/api/articles/:id', async (req, res) => {
  await db.query('DELETE FROM articles WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur backend en écoute sur http://localhost:${PORT}`);
});
