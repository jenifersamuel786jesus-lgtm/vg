const express = require('express');
const { getPool } = require('../db');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { name, email, skills, password, photo } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO volunteers (name, email, skills, password, photo, badges) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, skills || '', password, photo || null, JSON.stringify([])]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      email,
      skills: skills || '',
      photo: photo || 'https://via.placeholder.com/100',
      badges: []
    });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Failed to create volunteer' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT id, name, email, skills, photo, badges FROM volunteers WHERE email = ? AND password = ? LIMIT 1',
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid login' });
    }

    const volunteer = rows[0];
    volunteer.badges = Array.isArray(volunteer.badges)
      ? volunteer.badges
      : JSON.parse(volunteer.badges || '[]');
    volunteer.photo = volunteer.photo || 'https://via.placeholder.com/100';

    res.json(volunteer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT id, name, email, skills, photo, badges FROM volunteers WHERE id = ? LIMIT 1',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    const volunteer = rows[0];
    volunteer.badges = Array.isArray(volunteer.badges)
      ? volunteer.badges
      : JSON.parse(volunteer.badges || '[]');
    volunteer.photo = volunteer.photo || 'https://via.placeholder.com/100';

    res.json(volunteer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch volunteer' });
  }
});

router.put('/:id', async (req, res) => {
  const { name, skills, photo } = req.body || {};

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const pool = getPool();
    await pool.query(
      'UPDATE volunteers SET name = ?, skills = ?, photo = ? WHERE id = ?',
      [name, skills || '', photo || null, req.params.id]
    );

    const [rows] = await pool.query(
      'SELECT id, name, email, skills, photo, badges FROM volunteers WHERE id = ? LIMIT 1',
      [req.params.id]
    );

    const volunteer = rows[0];
    volunteer.badges = Array.isArray(volunteer.badges)
      ? volunteer.badges
      : JSON.parse(volunteer.badges || '[]');
    volunteer.photo = volunteer.photo || 'https://via.placeholder.com/100';

    res.json(volunteer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update volunteer' });
  }
});

module.exports = router;
