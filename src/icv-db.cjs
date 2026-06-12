// Read-only lookup against the ICVdb torrent database (same VPS, different DB).
// Used by the DMV library to auto-match a TorBox torrent + file to an IMDb id.
const { Pool } = require('pg');

let icvPool = null;
let initialized = false;

function getIcvPool() {
  if (initialized) return icvPool;
  initialized = true;
  const host = process.env.ICV_DB_HOST;
  const database = process.env.ICV_DB_NAME;
  if (!host || !database) return null;
  icvPool = new Pool({
    host,
    port: Number(process.env.ICV_DB_PORT || 5432),
    database,
    user: process.env.ICV_DB_USER,
    password: process.env.ICV_DB_PASSWORD,
    max: 3,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 5000
  });
  icvPool.on('error', (e) => console.error('[ICV DB] pool error:', e.message));
  return icvPool;
}

function normalizeHash(h) {
  const v = String(h || '').trim().toLowerCase();
  return /^[a-f0-9]{40}$/.test(v) ? v : '';
}

// Returns torrent-level metadata from ICVdb (or null if hash unknown / pool absent).
async function lookupTorrentByHash(infoHash) {
  const db = getIcvPool();
  if (!db) return null;
  const hash = normalizeHash(infoHash);
  if (!hash) return null;
  const r = await db.query(
    `SELECT info_hash, title, type, imdb_id, tmdb_id, is_torrent_pack, size
     FROM torrents WHERE info_hash = $1 LIMIT 1`,
    [hash]
  );
  return r.rows[0] || null;
}

// Returns rows from `files` (series episodes) — only useful when the torrent is a series pack.
async function lookupSeriesFiles(infoHash) {
  const db = getIcvPool();
  if (!db) return [];
  const hash = normalizeHash(infoHash);
  if (!hash) return [];
  const r = await db.query(
    `SELECT file_index, title, size, imdb_id, imdb_season, imdb_episode
     FROM files WHERE info_hash = $1 ORDER BY file_index`,
    [hash]
  );
  return r.rows || [];
}

// Returns rows from `pack_files` (multi-movie packs).
async function lookupPackFiles(infoHash) {
  const db = getIcvPool();
  if (!db) return [];
  const hash = normalizeHash(infoHash);
  if (!hash) return [];
  const r = await db.query(
    `SELECT file_index, file_path, file_size, imdb_id
     FROM pack_files WHERE pack_hash = $1 ORDER BY file_index`,
    [hash]
  );
  return r.rows || [];
}

// Parse SxxExx / xXyy from filename. Mirrors routes.cjs helper, duplicated here
// to keep this module independent.
function parseSEFromName(name) {
  const s = String(name || '');
  if (!s) return { season: 0, episode: 0 };
  let m = s.match(/[Ss](\d{1,2})[._\s-]?[Ee](\d{1,3})/);
  if (m) return { season: Number(m[1]), episode: Number(m[2]) };
  m = s.match(/(?:^|[^\d])(\d{1,2})[xX](\d{1,3})(?!\d)/);
  if (m) return { season: Number(m[1]), episode: Number(m[2]) };
  m = s.match(/[Ss]eason[._\s-]?(\d{1,2})[._\s-]+[Ee]pisode[._\s-]?(\d{1,3})/i);
  if (m) return { season: Number(m[1]), episode: Number(m[2]) };
  return { season: 0, episode: 0 };
}

// Best-effort match for the file inside the torrent. `targetName` is the TorBox
// file name (already cleaned of leading path) or full path. Returns one of:
//   { ok:true, type, imdbId, tmdbId, season, episode, source }
//   { ok:false, reason }
async function matchFileToImdb(infoHash, targetName, tbFileSize) {
  const torrent = await lookupTorrentByHash(infoHash);
  if (!torrent) return { ok: false, reason: 'hash_not_in_icvdb' };

  const type = String(torrent.type || '').toLowerCase();
  const tName = String(targetName || '');
  const tBase = tName.split('/').pop();

  // Movie (single-file or pack):
  if (type === 'movie' || type === 'other') {
    // Try pack_files first; pick the row whose filename best matches.
    const pack = await lookupPackFiles(infoHash);
    if (pack.length > 0) {
      const hit = bestPathMatch(pack.map(p => ({ key: p.file_path, row: p })), tName, tbFileSize);
      if (hit && hit.row.imdb_id) {
        return {
          ok: true, type: 'movie',
          imdbId: hit.row.imdb_id, tmdbId: null,
          season: 0, episode: 0,
          source: 'icv:pack_files'
        };
      }
    }
    // Single-movie torrent — torrent.imdb_id covers all files.
    if (torrent.imdb_id) {
      return {
        ok: true, type: 'movie',
        imdbId: torrent.imdb_id, tmdbId: torrent.tmdb_id || null,
        season: 0, episode: 0,
        source: 'icv:torrents'
      };
    }
    return { ok: false, reason: 'imdb_missing_in_icvdb' };
  }

  // Series (episode pack):
  if (type === 'series' || type === 'anime') {
    const files = await lookupSeriesFiles(infoHash);
    if (files.length > 0) {
      // Match by filename (most reliable), fallback by S/E parsed from torrent file name
      const hit = bestPathMatch(files.map(f => ({ key: f.title, row: f })), tBase, tbFileSize);
      if (hit && hit.row && (hit.row.imdb_season || hit.row.imdb_episode)) {
        return {
          ok: true, type: 'series',
          imdbId: hit.row.imdb_id || torrent.imdb_id || null,
          tmdbId: torrent.tmdb_id || null,
          season: Number(hit.row.imdb_season) || 0,
          episode: Number(hit.row.imdb_episode) || 0,
          source: 'icv:files'
        };
      }
    }
    // Fallback: parse SxxExx from filename, IMDb from torrent-level
    const se = parseSEFromName(tBase || tName);
    if (torrent.imdb_id && se.season && se.episode) {
      return {
        ok: true, type: 'series',
        imdbId: torrent.imdb_id, tmdbId: torrent.tmdb_id || null,
        season: se.season, episode: se.episode,
        source: 'icv:torrents+filename'
      };
    }
    if (!torrent.imdb_id) return { ok: false, reason: 'imdb_missing_in_icvdb' };
    return { ok: false, reason: 'se_unknown' };
  }

  return { ok: false, reason: 'unknown_type' };
}

// Find ICVdb torrents that hold a given IMDb id.
// For series with season/episode, returns one row per matching file:
//   { info_hash, type, title, file_index, file_title, file_size, season, episode, is_pack }
// For movies, returns one row per torrent (file_index null):
//   { info_hash, type, title, file_index, file_title, file_size, is_pack }
async function findTorrentsByImdb(imdbId, kind /* 'movie'|'series' */, season, episode) {
  const db = getIcvPool();
  if (!db) return [];
  const imdb = String(imdbId || '').trim();
  if (!/^tt\d+$/.test(imdb)) return [];

  if (kind === 'series') {
    const s = Number(season) || 0;
    const e = Number(episode) || 0;
    if (!s || !e) return [];
    const r = await db.query(`
      SELECT
        f.info_hash,
        t.type,
        t.title,
        f.file_index,
        f.title       AS file_title,
        f.size        AS file_size,
        f.imdb_season AS season,
        f.imdb_episode AS episode,
        COALESCE(t.is_torrent_pack, false) AS is_pack
      FROM files f
      JOIN torrents t ON t.info_hash = f.info_hash
      WHERE f.imdb_id = $1 AND f.imdb_season = $2 AND f.imdb_episode = $3
      ORDER BY f.size DESC NULLS LAST
      LIMIT 200
    `, [imdb, s, e]);
    return r.rows;
  }

  if (kind === 'movie') {
    const rows = [];
    const r1 = await db.query(`
      SELECT info_hash, type, title, NULL::int AS file_index,
             NULL::text AS file_title, size AS file_size,
             COALESCE(is_torrent_pack, false) AS is_pack
      FROM torrents
      WHERE imdb_id = $1 AND type IN ('movie','other')
      ORDER BY size DESC NULLS LAST
      LIMIT 200
    `, [imdb]);
    rows.push(...r1.rows);
    const r2 = await db.query(`
      SELECT p.pack_hash AS info_hash, t.type, t.title,
             p.file_index, p.file_path AS file_title, p.file_size,
             true AS is_pack
      FROM pack_files p
      JOIN torrents t ON t.info_hash = p.pack_hash
      WHERE p.imdb_id = $1
      ORDER BY p.file_size DESC NULLS LAST
      LIMIT 200
    `, [imdb]);
    rows.push(...r2.rows);
    return rows;
  }

  return [];
}

// Best filename match: exact equality > basename equality > substring > similarity (size proximity)
function bestPathMatch(candidates, targetName, targetSize) {
  if (!candidates.length || !targetName) return null;
  const t = String(targetName).toLowerCase();
  const tBase = t.split('/').pop();
  // 1. Exact
  let hit = candidates.find(c => String(c.key).toLowerCase() === t);
  if (hit) return hit;
  // 2. Basename equal
  hit = candidates.find(c => String(c.key).toLowerCase().split('/').pop() === tBase);
  if (hit) return hit;
  // 3. Substring
  hit = candidates.find(c => {
    const k = String(c.key).toLowerCase();
    return k.includes(tBase) || tBase.includes(k.split('/').pop());
  });
  if (hit) return hit;
  // 4. Size proximity (if both sides have a meaningful size)
  const ts = Number(targetSize) || 0;
  if (ts > 0) {
    const withSize = candidates.filter(c => Number(c.row?.size || c.row?.file_size || 0) > 0);
    if (withSize.length) {
      withSize.sort((a, b) =>
        Math.abs(Number(a.row.size || a.row.file_size) - ts) -
        Math.abs(Number(b.row.size || b.row.file_size) - ts)
      );
      const cand = withSize[0];
      const sz = Number(cand.row.size || cand.row.file_size);
      // accept if within 0.5%
      if (Math.abs(sz - ts) / ts < 0.005) return cand;
    }
  }
  // 5. Single candidate — accept
  if (candidates.length === 1) return candidates[0];
  return null;
}

// Bulk: given a list of hashes, returns a Map(hash -> {imdb_id, type, tmdb_id, is_torrent_pack, title}).
// Hashes without ICVdb entry are simply omitted from the Map.
async function lookupImdbForHashes(infoHashes) {
  const db = getIcvPool();
  if (!db) return new Map();
  const hashes = Array.from(new Set(
    (infoHashes || [])
      .map(h => String(h || '').trim().toLowerCase())
      .filter(h => /^[a-f0-9]{40}$/.test(h))
  ));
  if (hashes.length === 0) return new Map();
  const r = await db.query(
    `SELECT info_hash, imdb_id, tmdb_id, type, COALESCE(is_torrent_pack, false) AS is_pack, title
     FROM torrents
     WHERE info_hash = ANY($1::varchar[])`,
    [hashes]
  );
  const out = new Map();
  for (const row of r.rows) out.set(row.info_hash, row);
  return out;
}

// Search the ICVdb `torrents` table by title / hash / IMDb / TMDB id with
// dbmanager-style filters. Only returns rows that have an imdb_id (since DMV
// can only cast IMDb-tagged torrents). Returns at most `limit` rows.
async function searchTorrents(opts) {
  const db = getIcvPool();
  if (!db) return { rows: [], total: 0 };
  const q = String(opts && opts.q || '').trim();
  const type = String(opts && opts.type || 'all'); // movie | series | all
  const provider = String(opts && opts.provider || 'all');
  const cache = String(opts && opts.cache || 'all'); // tb_cached | uncached | all
  const lang = String(opts && opts.lang || 'all'); // ita | all
  const sort = String(opts && opts.sort || 'seeders'); // seeders | date | size | title
  const limit = Math.min(Math.max(Number(opts && opts.limit) || 50, 1), 200);

  const where = ['imdb_id IS NOT NULL'];
  const params = [];
  let i = 1;
  if (q) {
    const magnet = q.match(/magnet:\?xt=urn:btih:([a-fA-F0-9]{40})/i);
    if (magnet) { where.push(`info_hash = $${i++}`); params.push(magnet[1].toLowerCase()); }
    else if (/^[a-fA-F0-9]{40}$/.test(q)) { where.push(`info_hash = $${i++}`); params.push(q.toLowerCase()); }
    else if (/^tt\d+$/i.test(q)) { where.push(`imdb_id = $${i++}`); params.push(q.toLowerCase()); }
    else if (/^\d{1,9}$/.test(q)) {
      where.push(`(tmdb_id = $${i} OR title ILIKE $${i + 1})`);
      params.push(q, '%' + q + '%');
      i += 2;
    } else {
      const pattern = '%' + q.replace(/\s+/g, '%') + '%';
      where.push(`title ILIKE $${i++}`); params.push(pattern);
    }
  }
  if (type !== 'all') { where.push(`type = $${i++}`); params.push(type); }
  if (provider !== 'all') { where.push(`provider = $${i++}`); params.push(provider); }
  if (cache === 'tb_cached') where.push('cached_tb = true');
  else if (cache === 'uncached') where.push('(cached_tb IS NULL OR cached_tb = false)');
  if (lang === 'ita') { where.push(`title ILIKE $${i++}`); params.push('%ita%'); }

  let orderBy = 'ORDER BY seeders DESC NULLS LAST, upload_date DESC NULLS LAST';
  if (sort === 'date') orderBy = 'ORDER BY upload_date DESC NULLS LAST';
  else if (sort === 'size') orderBy = 'ORDER BY size DESC NULLS LAST';
  else if (sort === 'title') orderBy = 'ORDER BY title ASC';

  const whereClause = 'WHERE ' + where.join(' AND ');
  const sql = `
    SELECT info_hash, title, type, imdb_id, tmdb_id, seeders, size,
           provider, cached_tb, COALESCE(is_torrent_pack, false) AS is_pack
    FROM torrents
    ${whereClause}
    ${orderBy}
    LIMIT $${i}
  `;
  params.push(limit);
  const r = await db.query(sql, params);
  return { rows: r.rows, total: r.rows.length };
}

// Distinct list of providers in the torrents table (for the search-form dropdown).
async function listProviders() {
  const db = getIcvPool();
  if (!db) return [];
  const r = await db.query(`SELECT DISTINCT provider FROM torrents WHERE provider IS NOT NULL ORDER BY provider`);
  return r.rows.map(row => row.provider);
}

module.exports = {
  getIcvPool,
  lookupTorrentByHash,
  lookupSeriesFiles,
  lookupPackFiles,
  matchFileToImdb,
  findTorrentsByImdb,
  lookupImdbForHashes,
  parseSEFromName,
  searchTorrents,
  listProviders
};
