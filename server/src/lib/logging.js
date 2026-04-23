function redactConfig(value) {
  if (!value) {
    return value;
  }

  if (typeof value === 'string' && value.length > 12) {
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
  }

  return '***';
}

function serializeError(error) {
  if (!error) {
    return { message: 'Unknown error' };
  }

  return {
    name: error.name,
    message: error.message,
    code: error.code,
    errno: error.errno,
    sqlState: error.sqlState,
    sqlMessage: error.sqlMessage
  };
}

function logError(scope, error, extra = {}) {
  console.error(
    `[${new Date().toISOString()}] ${scope}`,
    JSON.stringify({
      error: serializeError(error),
      extra
    })
  );
}

function buildErrorResponse(message, error) {
  const response = { error: message };

  if (process.env.NODE_ENV !== 'production' || process.env.EXPOSE_INTERNAL_ERRORS === 'true') {
    response.details = serializeError(error);
  }

  return response;
}

module.exports = {
  buildErrorResponse,
  logError,
  redactConfig
};
