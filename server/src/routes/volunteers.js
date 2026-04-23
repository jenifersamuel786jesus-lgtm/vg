const express = require('express');
const { getPool } = require('../db');
const { hashPassword, isLegacyPassword, verifyPassword } = require('../lib/auth');
const { buildErrorResponse, logError } = require('../lib/logging');

const router = express.Router();

function parseBadges(badges) {
  if (Array.isArray(badges)) {
    return badges;
  }

  try {
    return JSON.parse(badges || '[]');
  } catch {
    return [];
  }
}

router.post('/signup', async (req, res) => {
  const { name, email, skills, password, photo } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const pool = getPool();
    const hashedPassword = await hashPassword(password);
    const [result] = await pool.query(
      'INSERT INTO volunteers (name, email, skills, password, photo, badges) VALUES (?, ?, ?, ?, ?, ?)',
      [name, normalizedEmail, skills || '', hashedPassword, photo || null, JSON.stringify([])]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      email: normalizedEmail,
      skills: skills || '',
      photo: photo || 'https://via.placeholder.com/100',
      badges: []
    });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    logError('volunteers.signup', err, { email: normalizedEmail, route: req.originalUrl });
    res.status(500).json(buildErrorResponse('Failed to create volunteer', err));
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
      'SELECT id, name, email, skills, photo, badges, password FROM volunteers WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid login' });
    }

    const volunteer = rows[0];
    const matches = await verifyPassword(password, volunteer.password);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid login' });
    }

    if (isLegacyPassword(volunteer.password)) {
      const upgradedPassword = await hashPassword(password);
      await pool.query('UPDATE volunteers SET password = ? WHERE id = ?', [upgradedPassword, volunteer.id]);
    }

    volunteer.badges = parseBadges(volunteer.badges);
    volunteer.photo = volunteer.photo || 'https://via.placeholder.com/100';
    delete volunteer.password;

    res.json(volunteer);
  } catch (err) {
    logError('volunteers.login', err, { email: normalizedEmail, route: req.originalUrl });
    res.status(500).json(buildErrorResponse('Failed to login', err));
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
    volunteer.badges = parseBadges(volunteer.badges);
    volunteer.photo = volunteer.photo || 'https://via.placeholder.com/100';

    res.json(volunteer);
  } catch (err) {
    logError('volunteers.get', err, { volunteerId: req.params.id, route: req.originalUrl });
    res.status(500).json(buildErrorResponse('Failed to fetch volunteer', err));
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
    volunteer.badges = parseBadges(volunteer.badges);
    volunteer.photo = volunteer.photo || 'https://via.placeholder.com/100';

    res.json(volunteer);
  } catch (err) {
    logError('volunteers.update', err, { volunteerId: req.params.id, route: req.originalUrl });
    res.status(500).json(buildErrorResponse('Failed to update volunteer', err));
  }
});

module.exports = router;
