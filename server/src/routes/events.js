const express = require('express');
const { getPool } = require('../db');
const { buildErrorResponse, logError } = require('../lib/logging');

const router = express.Router();

function mapEvents(events, volunteers) {
  const byEvent = new Map();
  events.forEach(ev => {
    byEvent.set(ev.id, { ...ev, volunteers: [] });
  });

  volunteers.forEach(v => {
    const target = byEvent.get(v.eventId);
    if (target) {
      target.volunteers.push({
        volunteerId: v.volunteerId,
        email: v.email,
        status: v.status,
        motivation: v.motivation
      });
    }
  });

  return Array.from(byEvent.values());
}

async function fetchEvents(pool, orgId) {
  const [events] = await pool.query(
    `SELECT e.id, e.title, e.skill, e.max_vol AS maxVol, e.image, e.status, e.org_id AS orgId, o.name AS orgName
     FROM events e
     JOIN orgs o ON o.id = e.org_id
     ${orgId ? 'WHERE e.org_id = ?' : ''}
     ORDER BY e.id DESC`,
    orgId ? [orgId] : []
  );

  if (events.length === 0) {
    return [];
  }

  const eventIds = events.map(ev => ev.id);
  const [volunteers] = await pool.query(
    `SELECT ev.event_id AS eventId, ev.volunteer_id AS volunteerId, v.email, ev.status, ev.motivation
     FROM event_volunteers ev
     JOIN volunteers v ON v.id = ev.volunteer_id
     WHERE ev.event_id IN (?)`,
    [eventIds]
  );

  return mapEvents(events, volunteers);
}

router.get('/', async (req, res) => {
  const orgId = req.query.orgId ? Number(req.query.orgId) : null;

  try {
    const pool = getPool();
    const payload = await fetchEvents(pool, orgId);
    res.json(payload);
  } catch (err) {
    logError('events.list', err, { orgId, route: req.originalUrl });
    res.status(500).json(buildErrorResponse('Failed to fetch events', err));
  }
});

router.get('/stream', async (req, res) => {
  const orgId = req.query.orgId ? Number(req.query.orgId) : null;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let lastPayload = '';
  let closed = false;

  const pool = getPool();

  const send = async () => {
    if (closed) return;
    try {
      const data = await fetchEvents(pool, orgId);
      const nextPayload = JSON.stringify(data);
      if (nextPayload !== lastPayload) {
        lastPayload = nextPayload;
        res.write(`data: ${nextPayload}\n\n`);
      }
    } catch (err) {
      logError('events.stream', err, { orgId, route: req.originalUrl });
      const payload = buildErrorResponse('Failed to stream events', err);
      res.write(`event: error\ndata: ${JSON.stringify(payload)}\n\n`);
    }
  };

  const heartbeat = () => {
    if (closed) return;
    res.write(`event: ping\ndata: ok\n\n`);
  };

  await send();
  const intervalId = setInterval(send, 2000);
  const heartbeatId = setInterval(heartbeat, 15000);

  req.on('close', () => {
    closed = true;
    clearInterval(intervalId);
    clearInterval(heartbeatId);
    res.end();
  });
});

router.post('/', async (req, res) => {
  const { title, skill, maxVol, image, orgId } = req.body || {};

  if (!title || !skill || !maxVol || !orgId) {
    return res.status(400).json({ error: 'Title, skill, maxVol, and orgId are required' });
  }

  try {
    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO events (title, skill, max_vol, image, org_id, status) VALUES (?, ?, ?, ?, ?, ?)',
      [title, skill, Number(maxVol), image || null, orgId, 'Open']
    );

    const [rows] = await pool.query(
      `SELECT e.id, e.title, e.skill, e.max_vol AS maxVol, e.image, e.status, e.org_id AS orgId, o.name AS orgName
       FROM events e
       JOIN orgs o ON o.id = e.org_id
       WHERE e.id = ? LIMIT 1`,
      [result.insertId]
    );

    res.status(201).json({ ...rows[0], volunteers: [] });
  } catch (err) {
    logError('events.create', err, { orgId, title, route: req.originalUrl });
    res.status(500).json(buildErrorResponse('Failed to create event', err));
  }
});

router.post('/:id/apply', async (req, res) => {
  const eventId = Number(req.params.id);
  const { volunteerId, motivation } = req.body || {};

  if (!volunteerId || !motivation) {
    return res.status(400).json({ error: 'VolunteerId and motivation are required' });
  }

  try {
    const pool = getPool();
    await pool.query(
      'INSERT INTO event_volunteers (event_id, volunteer_id, status, motivation) VALUES (?, ?, ?, ?)',
      [eventId, volunteerId, 'pending', motivation]
    );

    res.status(201).json({ status: 'pending' });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Already applied' });
    }
    logError('events.apply', err, { eventId, volunteerId, route: req.originalUrl });
    res.status(500).json(buildErrorResponse('Failed to apply', err));
  }
});

router.patch('/:id/volunteers/:volunteerId', async (req, res) => {
  const eventId = Number(req.params.id);
  const volunteerId = Number(req.params.volunteerId);
  const { status } = req.body || {};

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const pool = getPool();
    const [result] = await pool.query(
      'UPDATE event_volunteers SET status = ? WHERE event_id = ? AND volunteer_id = ?',
      [status, eventId, volunteerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Volunteer application not found' });
    }

    if (status === 'completed') {
      await pool.query('UPDATE events SET status = ? WHERE id = ?', ['Completed', eventId]);

      const [eventRows] = await pool.query('SELECT skill FROM events WHERE id = ? LIMIT 1', [eventId]);
      const skill = eventRows.length ? eventRows[0].skill : null;

      if (skill) {
        const [volRows] = await pool.query('SELECT badges FROM volunteers WHERE id = ? LIMIT 1', [volunteerId]);
        if (volRows.length) {
          let badges = volRows[0].badges;
          badges = Array.isArray(badges) ? badges : JSON.parse(badges || '[]');
          if (!badges.includes(skill)) {
            badges.push(skill);
            await pool.query('UPDATE volunteers SET badges = ? WHERE id = ?', [JSON.stringify(badges), volunteerId]);
          }
        }
      }
    }

    res.json({ status });
  } catch (err) {
    logError('events.updateVolunteerStatus', err, { eventId, volunteerId, status, route: req.originalUrl });
    res.status(500).json(buildErrorResponse('Failed to update status', err));
  }
});

module.exports = router;
