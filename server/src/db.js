const mysql = require('mysql2/promise');
const { logError, redactConfig } = require('./lib/logging');

let pool;

function shouldUseSsl() {
  return process.env.DB_SSL === 'true' || process.env.DB_SSL === '1';
}

function getSslConfig() {
  if (!shouldUseSsl()) {
    return undefined;
  }

  const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';
  const ca = process.env.DB_SSL_CA_BASE64
    ? Buffer.from(process.env.DB_SSL_CA_BASE64, 'base64').toString('utf8')
    : undefined;

  return ca ? { ca, rejectUnauthorized } : { rejectUnauthorized };
}

function buildPoolConfig() {
  if (process.env.DATABASE_URL) {
    const databaseUrl = new URL(process.env.DATABASE_URL);
    return {
      host: databaseUrl.hostname,
      port: Number(databaseUrl.port || 3306),
      user: decodeURIComponent(databaseUrl.username),
      password: decodeURIComponent(databaseUrl.password),
      database: databaseUrl.pathname.replace(/^\//, ''),
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
      queueLimit: 0,
      ssl: getSslConfig()
    };
  }

  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    ssl: getSslConfig()
  };
}

function validatePoolConfig(config) {
  const missing = ['host', 'user', 'database'].filter(key => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing database configuration: ${missing.join(', ')}`);
  }
}

function getPool() {
  if (!pool) {
    const config = buildPoolConfig();
    validatePoolConfig(config);

    try {
      pool = mysql.createPool(config);
    } catch (error) {
      logError('db.createPool', error, {
        host: redactConfig(config.host),
        database: config.database,
        port: config.port,
        usingDatabaseUrl: Boolean(process.env.DATABASE_URL),
        ssl: Boolean(config.ssl)
      });
      throw error;
    }
  }

  return pool;
}

module.exports = { getPool };
