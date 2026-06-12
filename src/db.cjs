const { Pool } = require('pg');

let pool = null;

function initDatabase(config = {}) {
  if (pool) return pool;

  const poolConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
      host: config.host || process.env.DB_HOST,
      port: config.port || process.env.DB_PORT,
      database: config.database || process.env.DB_NAME,
      user: config.user || process.env.DB_USER,
      password: config.password || process.env.DB_PASSWORD
    };

  pool = new Pool({
    ...poolConfig,
    max: Number(process.env.DB_POOL_MAX || 5),
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 5000
  });

  pool.on('error', (error) => {
    console.error('[DMV DB] Unexpected PostgreSQL error:', error.message);
  });

  return pool;
}

function getPool() {
  if (!pool) return initDatabase();
  return pool;
}

function normalizeSeasonEpisode(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeFileId(value) {
  if (value === undefined || value === null || value === '') return '';
  return String(value);
}

async function upsertProfile(profile) {
  const db = getPool();
  const result = await db.query(`
    INSERT INTO torbox_profiles (
      user_id,
      email_hash,
      api_key_encrypted,
      api_key_last4,
      movie_max_size_gb,
      episode_max_size_gb,
      show_other_streams,
      other_streams_limit,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      email_hash = EXCLUDED.email_hash,
      api_key_encrypted = EXCLUDED.api_key_encrypted,
      api_key_last4 = EXCLUDED.api_key_last4,
      movie_max_size_gb = EXCLUDED.movie_max_size_gb,
      episode_max_size_gb = EXCLUDED.episode_max_size_gb,
      show_other_streams = EXCLUDED.show_other_streams,
      other_streams_limit = EXCLUDED.other_streams_limit,
      updated_at = NOW()
    RETURNING *
  `, [
    profile.userId,
    profile.emailHash,
    profile.apiKeyEncrypted,
    profile.apiKeyLast4,
    profile.movieMaxSizeGb || 0,
    profile.episodeMaxSizeGb || 0,
    Boolean(profile.showOtherStreams),
    profile.otherStreamsLimit || 0
  ]);

  return result.rows[0];
}

async function getProfile(userId) {
  const db = getPool();
  const result = await db.query('SELECT * FROM torbox_profiles WHERE user_id = $1 LIMIT 1', [userId]);
  return result.rows[0] || null;
}

async function upsertCast(cast) {
  const season = normalizeSeasonEpisode(cast.season);
  const episode = normalizeSeasonEpisode(cast.episode);
  const fileId = normalizeFileId(cast.fileId);
  const db = getPool();

  const result = await db.query(`
    INSERT INTO torbox_casts (
      user_id,
      imdb_id,
      tmdb_id,
      type,
      season,
      episode,
      info_hash,
      torrent_id,
      file_id,
      file_index,
      filename,
      title,
      size,
      stream_url,
      stream_url_expires_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, LOWER($7), $8, $9, $10, $11, $12, $13, $14, $15, NOW())
    ON CONFLICT (user_id, imdb_id, season, episode, info_hash, file_id) DO UPDATE SET
      tmdb_id = COALESCE(EXCLUDED.tmdb_id, torbox_casts.tmdb_id),
      type = EXCLUDED.type,
      torrent_id = COALESCE(EXCLUDED.torrent_id, torbox_casts.torrent_id),
      file_index = COALESCE(EXCLUDED.file_index, torbox_casts.file_index),
      filename = COALESCE(EXCLUDED.filename, torbox_casts.filename),
      title = COALESCE(EXCLUDED.title, torbox_casts.title),
      size = COALESCE(NULLIF(EXCLUDED.size, 0), torbox_casts.size),
      stream_url = COALESCE(EXCLUDED.stream_url, torbox_casts.stream_url),
      stream_url_expires_at = COALESCE(EXCLUDED.stream_url_expires_at, torbox_casts.stream_url_expires_at),
      updated_at = NOW()
    RETURNING *
  `, [
    cast.userId,
    cast.imdbId,
    cast.tmdbId || null,
    cast.type,
    season,
    episode,
    cast.infoHash,
    cast.torrentId || null,
    fileId,
    cast.fileIndex === undefined || cast.fileIndex === null ? null : Number(cast.fileIndex),
    cast.filename || null,
    cast.title || null,
    cast.size || 0,
    cast.streamUrl || null,
    cast.streamUrlExpiresAt || null
  ]);

  return result.rows[0];
}

async function listCastsForItem(userId, parsedId, type) {
  const db = getPool();
  const result = await db.query(`
    SELECT *
    FROM torbox_casts
    WHERE user_id = $1
      AND imdb_id = $2
      AND type = $3
      AND season = $4
      AND episode = $5
    ORDER BY updated_at DESC, created_at DESC
    LIMIT 30
  `, [
    userId,
    parsedId.imdbId,
    type,
    normalizeSeasonEpisode(parsedId.season),
    normalizeSeasonEpisode(parsedId.episode)
  ]);

  return result.rows;
}

async function listCastsForUser(userId, limit = 100) {
  const db = getPool();
  const safeLimit = Math.max(1, Math.min(Number.parseInt(limit, 10) || 100, 250));
  const result = await db.query(`
    SELECT *
    FROM torbox_casts
    WHERE user_id = $1
    ORDER BY updated_at DESC, created_at DESC
    LIMIT $2
  `, [userId, safeLimit]);

  return result.rows;
}

async function getCastForUser(userId, castId) {
  const db = getPool();
  const result = await db.query(
    'SELECT * FROM torbox_casts WHERE user_id = $1 AND id = $2 LIMIT 1',
    [userId, castId]
  );
  return result.rows[0] || null;
}

async function updateCastStreamUrl(castId, streamUrl, expiresAt = null) {
  const db = getPool();
  const result = await db.query(`
    UPDATE torbox_casts
    SET stream_url = $2,
        stream_url_expires_at = $3,
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [castId, streamUrl, expiresAt]);

  return result.rows[0] || null;
}

async function updateCastFileId(castId, fileId) {
  const db = getPool();
  const result = await db.query(`
    UPDATE torbox_casts
    SET file_id = $2,
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [castId, String(fileId)]);
  return result.rows[0] || null;
}

async function deleteCastForUser(userId, castId) {
  const db = getPool();
  const result = await db.query(
    'DELETE FROM torbox_casts WHERE user_id = $1 AND id = $2 RETURNING *',
    [userId, castId]
  );
  return result.rows[0] || null;
}

async function deleteCastsByTorrentId(userId, torrentId) {
  const db = getPool();
  const r = await db.query(
    'DELETE FROM torbox_casts WHERE user_id = $1 AND torrent_id = $2 RETURNING *',
    [userId, String(torrentId)]
  );
  return r.rows;
}

async function deleteCastsByInfoHash(userId, infoHash) {
  const db = getPool();
  const r = await db.query(
    'DELETE FROM torbox_casts WHERE user_id = $1 AND info_hash = $2 RETURNING *',
    [userId, String(infoHash).toLowerCase()]
  );
  return r.rows;
}

async function deleteAllCastsForUser(userId) {
  const db = getPool();
  const r = await db.query(
    'DELETE FROM torbox_casts WHERE user_id = $1 RETURNING id',
    [userId]
  );
  return r.rows;
}

async function findProfileByUsername(username) {
  if (!username) return null;
  const db = getPool();
  const result = await db.query(
    'SELECT * FROM torbox_profiles WHERE LOWER(username) = LOWER($1) LIMIT 1',
    [String(username).trim()]
  );
  return result.rows[0] || null;
}

async function setProfileUsername(userId, username) {
  const db = getPool();
  const result = await db.query(
    'UPDATE torbox_profiles SET username = $2, updated_at = NOW() WHERE user_id = $1 RETURNING *',
    [userId, username]
  );
  return result.rows[0] || null;
}

async function setProfilePassword(userId, passwordHash) {
  const db = getPool();
  const result = await db.query(
    'UPDATE torbox_profiles SET password_hash = $2, updated_at = NOW() WHERE user_id = $1 RETURNING *',
    [userId, passwordHash]
  );
  return result.rows[0] || null;
}

// Distinct catalog rows for a user: one row per (imdb_id, type), picking the most
// recently updated cast. Used by the Stremio catalog endpoints.
async function listCastsCatalogForUser(userId, type, sortMode = 'recent') {
  // Pick the representative row per imdb_id according to the requested sort:
  //   recent  → ORDER BY updated_at DESC
  //   oldest  → ORDER BY updated_at ASC
  //   biggest → ORDER BY size DESC NULLS LAST
  //   smallest→ ORDER BY size ASC NULLS LAST
  let pickOrder = 'updated_at DESC';
  let finalOrder = 'representative_at DESC';
  if (sortMode === 'oldest') { pickOrder = 'updated_at ASC'; finalOrder = 'representative_at ASC'; }
  else if (sortMode === 'biggest') { pickOrder = 'size DESC NULLS LAST'; finalOrder = 'representative_size DESC NULLS LAST'; }
  else if (sortMode === 'smallest') { pickOrder = 'size ASC NULLS LAST'; finalOrder = 'representative_size ASC NULLS LAST'; }
  const db = getPool();
  const result = await db.query(`
    SELECT DISTINCT ON (imdb_id)
      imdb_id, tmdb_id, type, title, filename, size, season, episode,
      updated_at AS representative_at,
      size AS representative_size
    FROM torbox_casts
    WHERE user_id = $1 AND type = $2 AND imdb_id IS NOT NULL
    ORDER BY imdb_id, ${pickOrder}
  `, [userId, type]);
  // Sort the deduplicated set according to the requested global order.
  const rows = result.rows.slice();
  rows.sort((a, b) => {
    if (sortMode === 'biggest') return (Number(b.representative_size) || 0) - (Number(a.representative_size) || 0);
    if (sortMode === 'smallest') return (Number(a.representative_size) || 0) - (Number(b.representative_size) || 0);
    if (sortMode === 'oldest') return new Date(a.representative_at) - new Date(b.representative_at);
    return new Date(b.representative_at) - new Date(a.representative_at); // recent default
  });
  return rows;
}

// Update display / behavior preferences for a profile.
// Only updates keys provided; ignores others. Returns the updated row.
async function updateProfileSettings(userId, settings) {
  const allowed = ['catalog_mode', 'catalog_source', 'catalog_sort_casts', 'catalog_sort_library', 'include_library_streams', 'stream_order', 'stream_sort', 'show_uncached_library', 'movie_max_size_gb', 'episode_max_size_gb', 'show_other_streams', 'other_streams_limit', 'aiostreams_mode'];
  const sets = [];
  const vals = [userId];
  let i = 2;
  for (const k of allowed) {
    if (settings[k] !== undefined) {
      sets.push(`${k} = $${i++}`);
      vals.push(settings[k]);
    }
  }
  if (sets.length === 0) return null;
  const db = getPool();
  const r = await db.query(
    `UPDATE torbox_profiles SET ${sets.join(', ')}, updated_at = NOW()
     WHERE user_id = $1 RETURNING *`,
    vals
  );
  return r.rows[0] || null;
}

async function cleanupGhostCasts(userId, activeIds, activeHashes) {
  const db = getPool();
  const result = await db.query(`
    DELETE FROM torbox_casts
    WHERE user_id = $1
      AND (
        (torrent_id IS NOT NULL AND torrent_id != '' AND NOT (torrent_id = ANY($2::text[])))
        OR
        (torrent_id IS NULL OR torrent_id = '')
      )
      AND (
        (info_hash IS NOT NULL AND info_hash != '' AND NOT (info_hash = ANY($3::text[])))
        OR
        (info_hash IS NULL OR info_hash = '')
      )
    RETURNING id, title, filename, info_hash
  `, [
    userId,
    activeIds.map(String),
    activeHashes.map(h => String(h).toLowerCase())
  ]);
  return result.rows;
}

module.exports = {
  initDatabase,
  getProfile,
  upsertProfile,
  upsertCast,
  listCastsForItem,
  listCastsForUser,
  listCastsCatalogForUser,
  getCastForUser,
  updateCastStreamUrl,
  updateCastFileId,
  deleteCastForUser,
  deleteCastsByTorrentId,
  deleteCastsByInfoHash,
  deleteAllCastsForUser,
  findProfileByUsername,
  setProfileUsername,
  setProfilePassword,
  updateProfileSettings,
  cleanupGhostCasts
};
