const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { getPool } = require('./db');
const orgsRouter = require('./routes/orgs');
const volunteersRouter = require('./routes/volunteers');
const eventsRouter = require('./routes/events');
const { buildErrorResponse, logError } = require('./lib/logging');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health/db', async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('SELECT 1 AS ok');
    res.json({ status: 'ok', database: 'reachable', timestamp: new Date().toISOString() });
  } catch (err) {
    logError('health.db', err, { route: req.originalUrl });
    res.status(500).json(buildErrorResponse('Database health check failed', err));
  }
});

app.use('/api/orgs', orgsRouter);
app.use('/api/volunteers', volunteersRouter);
app.use('/api/events', eventsRouter);

app.use((err, req, res, next) => {
  logError('http.unhandled', err, { method: req.method, route: req.originalUrl });
  res.status(500).json(buildErrorResponse('Unexpected server error', err));
});

const port = Number(process.env.PORT || 4000);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
