import express from 'express';
import cors from 'cors';
import { db } from './db.js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔒 Middleware de protection via JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ✅ Route : Login utilisateur
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(401).json({ error: "Utilisateur non trouvé" });

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: "Mot de passe incorrect" });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 🛠 CRUD articles – accessibles sans login
app.get('/api/articles', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM articles ORDER BY date DESC');
  res.json(rows);
});

app.get('/api/articles/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM articles WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Non trouvé' });
  res.json(rows[0]);
});

// ✏️ Routes protégées (création, modification, suppression)
app.post('/api/articles', authenticateToken, async (req, res) => {
  const { title, slug, category, summary, content, imageUrl, imageAlt } = req.body;
  const [result] = await db.query(
    'INSERT INTO articles (title, slug, category, summary, content, imageUrl, imageAlt, date) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
    [title, slug, category, summary, content, imageUrl, imageAlt]
  );
  res.json({ id: result.insertId });
});

app.put('/api/articles/:id', authenticateToken, async (req, res) => {
  const { title, slug, category, summary, content, imageUrl, imageAlt } = req.body;
  await db.query(
    'UPDATE articles SET title = ?, slug = ?, category = ?, summary = ?, content = ?, imageUrl = ?, imageAlt = ? WHERE id = ?',
    [title, slug, category, summary, content, imageUrl, imageAlt, req.params.id]
  );
  res.json({ success: true });
});

app.delete('/api/articles/:id', authenticateToken, async (req, res) => {
  await db.query('DELETE FROM articles WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// 🚀 Lancer le serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API lancée sur http://localhost:${PORT}`);
});
