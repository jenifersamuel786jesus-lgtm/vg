const express = require('express');
const { getPool } = require('../db');
const { hashPassword, isLegacyPassword, verifyPassword } = require('../lib/auth');
const { buildErrorResponse, logError } = require('../lib/logging');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const pool = getPool();
    const hashedPassword = await hashPassword(password);
    const [result] = await pool.query(
      'INSERT INTO orgs (name, email, password) VALUES (?, ?, ?)',
      [name, normalizedEmail, hashedPassword]
    );

    res.status(201).json({ id: result.insertId, name, email: normalizedEmail });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    logError('orgs.signup', err, { email: normalizedEmail, route: req.originalUrl });
    res.status(500).json(buildErrorResponse('Failed to create organization', err));
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
      'SELECT id, name, email, password FROM orgs WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid login' });
    }

    const org = rows[0];
    const matches = await verifyPassword(password, org.password);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid login' });
    }

    if (isLegacyPassword(org.password)) {
      const upgradedPassword = await hashPassword(password);
      await pool.query('UPDATE orgs SET password = ? WHERE id = ?', [upgradedPassword, org.id]);
    }

    res.json({ id: org.id, name: org.name, email: org.email });
  } catch (err) {
    logError('orgs.login', err, { email: normalizedEmail, route: req.originalUrl });
    res.status(500).json(buildErrorResponse('Failed to login', err));
  }
});

module.exports = router;
