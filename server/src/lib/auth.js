const crypto = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(crypto.scrypt);
const KEY_LENGTH = 64;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P
  });

  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${Buffer.from(derivedKey).toString('hex')}`;
}

async function verifyPassword(password, storedPassword) {
  if (!storedPassword) {
    return false;
  }

  if (!storedPassword.startsWith('scrypt$')) {
    return password === storedPassword;
  }

  const parts = storedPassword.split('$');
  if (parts.length !== 6) {
    return false;
  }

  const [, n, r, p, salt, expectedKey] = parts;
  const derivedKey = await scryptAsync(password, salt, expectedKey.length / 2, {
    N: Number(n),
    r: Number(r),
    p: Number(p)
  });

  const expectedBuffer = Buffer.from(expectedKey, 'hex');
  const actualBuffer = Buffer.from(derivedKey);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function isLegacyPassword(storedPassword) {
  return Boolean(storedPassword) && !storedPassword.startsWith('scrypt$');
}

module.exports = {
  hashPassword,
  verifyPassword,
  isLegacyPassword
};
