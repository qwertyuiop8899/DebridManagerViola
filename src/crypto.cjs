const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const secret = process.env.TORBOX_CAST_ENCRYPTION_KEY;
  if (!secret) throw new Error('Missing TORBOX_CAST_ENCRYPTION_KEY');
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptText(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

function decryptText(payload) {
  const raw = Buffer.from(payload, 'base64url');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

function createUserId(email) {
  const salt = process.env.TORBOX_CAST_USER_SALT || process.env.TORBOX_CAST_ENCRYPTION_KEY;
  if (!salt) throw new Error('Missing TORBOX_CAST_USER_SALT or TORBOX_CAST_ENCRYPTION_KEY');
  return crypto.createHmac('sha256', salt).update(`torbox:${String(email).toLowerCase()}`).digest('base64url').slice(0, 16);
}

function hashEmail(email) {
  return crypto.createHash('sha256').update(String(email).toLowerCase()).digest('hex');
}

// scrypt-based password hashing (no external deps). Format: scrypt$N$salt_b64$hash_b64
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const N = 16384; // cost
  const hash = crypto.scryptSync(String(password), salt, 64, { N, r: 8, p: 1 });
  return `scrypt$${N}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

function verifyPassword(password, stored) {
  try {
    if (!stored || typeof stored !== 'string') return false;
    const parts = stored.split('$');
    if (parts.length !== 4 || parts[0] !== 'scrypt') return false;
    const N = Number(parts[1]);
    const salt = Buffer.from(parts[2], 'base64');
    const expected = Buffer.from(parts[3], 'base64');
    const actual = crypto.scryptSync(String(password), salt, expected.length, { N, r: 8, p: 1 });
    return crypto.timingSafeEqual(actual, expected);
  } catch (_) { return false; }
}

const USERNAME_ADJECTIVES = [
  'viola','rapido','astuto','silente','dorato','elettrico','solare','lunare',
  'cosmico','epico','sereno','nobile','agile','furtivo','mistico','allegro'
];
const USERNAME_NOUNS = [
  'corsaro','pirata','falco','tigre','drago','lupo','volpe','orso',
  'aquila','squalo','leone','pantera','mago','cavaliere','pilota','navigatore'
];
function generateUsername() {
  const a = USERNAME_ADJECTIVES[Math.floor(Math.random() * USERNAME_ADJECTIVES.length)];
  const n = USERNAME_NOUNS[Math.floor(Math.random() * USERNAME_NOUNS.length)];
  const suffix = Math.floor(Math.random() * 9000) + 1000; // 4-digit
  return `${a}-${n}-${suffix}`;
}

function isValidUsername(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_.-]{3,32}$/.test(value);
}

function isValidPassword(value) {
  return typeof value === 'string' && value.length >= 6 && value.length <= 128;
}

module.exports = {
  encryptText,
  decryptText,
  createUserId,
  hashEmail,
  hashPassword,
  verifyPassword,
  generateUsername,
  isValidUsername,
  isValidPassword
};
