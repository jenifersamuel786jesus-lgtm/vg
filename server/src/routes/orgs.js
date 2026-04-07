const express = require('express');
const { getPool } = require('../db');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO orgs (name, email, password) VALUES (?, ?, ?)',
      [name, normalizedEmail, password]
    );

    res.status(201).json({ id: result.insertId, name, email: normalizedEmail });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT id, name, email FROM orgs WHERE email = ? AND password = ? LIMIT 1',
      [normalizedEmail, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid login' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

module.exports = router;
