const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const orgsRouter = require('./routes/orgs');
const volunteersRouter = require('./routes/volunteers');
const eventsRouter = require('./routes/events');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/orgs', orgsRouter);
app.use('/api/volunteers', volunteersRouter);
app.use('/api/events', eventsRouter);

const port = Number(process.env.PORT || 4000);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
