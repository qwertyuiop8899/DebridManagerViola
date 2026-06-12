const express = require('express');
const http = require('http');

const { encryptText, decryptText, createUserId, hashEmail, hashPassword, verifyPassword, generateUsername, isValidUsername, isValidPassword } = require('./crypto.cjs');
const { validateApiKey, createTorrent, requestDownloadLink, getTorrentInfo, listMyTorrents, pickBestVideoFileId, controlTorrent } = require('./torbox-service.cjs');
const { buildManifest, buildCatalogMeta, parseStremioId, buildStreamFromCast, buildStreamFromLibrary } = require('./stremio-addon.cjs');
const { renderHomePage, renderLoginPage, renderCastPage, renderLibraryPage, renderSettingsPage } = require('./ui.cjs');
const icvDb = require('./icv-db.cjs');
const {
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
} = require('./db.cjs');

// In-memory cache: user_id -> { fetched: epoch_ms, list: [...] }
const LIBRARY_CACHE = new Map();
const LIBRARY_TTL_MS = 60 * 1000;
async function getCachedLibrary(userId, apiKey) {
  const now = Date.now();
  const hit = LIBRARY_CACHE.get(userId);
  if (hit && (now - hit.fetched) < LIBRARY_TTL_MS) return hit.list;
  const list = await listMyTorrents(apiKey);
  LIBRARY_CACHE.set(userId, { fetched: now, list });

  // 🧹 Clean up ghost casts in the background (non-blocking)
  const activeIds = list.map(t => String(t.id)).filter(Boolean);
  const activeHashes = list.map(t => String(t.hash || '').toLowerCase()).filter(Boolean);
  cleanupGhostCasts(userId, activeIds, activeHashes).then(removed => {
    if (removed.length > 0) {
      console.log(`[Cleanup] Removed ${removed.length} ghost casts for user ${userId}:`, removed.map(c => c.title || c.filename || c.id));
    }
  }).catch(err => {
    console.error(`[Cleanup] Error cleaning up ghost casts for user ${userId}:`, err.message);
  });

  return list;
}
function invalidateLibraryCache(userId) { LIBRARY_CACHE.delete(userId); }

// Build "library streams" for a Stremio request by combining:
//   - the list of torrents in the user's TorBox account
//   - ICVdb's mapping of (info_hash, file) -> imdb id (+ season/episode)
// `excludeCastStreams` lets us skip files already represented by a cast.
async function resolveLibraryStreams(profile, parsedId, type, baseUrl, castStreams, opts = {}) {
  if (!parsedId.imdbId) return [];
  const apiKey = decryptText(profile.api_key_encrypted);
  const torrents = await getCachedLibrary(profile.user_id, apiKey);
  if (!torrents.length) return [];

  // Index user library by hash for quick lookup.
  const byHash = new Map();
  for (const t of torrents) {
    const h = String(t.hash || '').toLowerCase();
    if (h) byHash.set(h, t);
  }

  // Query ICVdb for ALL hashes that match this IMDb (+ S/E for series).
  const matches = await icvDb.findTorrentsByImdb(parsedId.imdbId, type, parsedId.season, parsedId.episode);
  if (!matches.length) return [];

  // Set of (torrentId|fileId) keys already covered by casts, to avoid duplicates.
  const castKeys = new Set();
  for (const s of castStreams) {
    const m = s.url && s.url.match(/\/play\/[^\/]+/);
    if (m) castKeys.add(m[0]);
  }

  const streams = [];
  const seen = new Set();
  const videoRe = /\.(mkv|mp4|avi|mov|m4v|webm|ts|wmv)$/i;
  const sampleRe = /sample|trailer|extra|featurette/i;

  for (const m of matches) {
    const h = String(m.info_hash || '').toLowerCase();
    const t = byHash.get(h);
    if (!t) continue;
    // Find the right file in the TorBox torrent listing.
    const tbFiles = Array.isArray(t.files) ? t.files : [];
    let chosen = null;

    if (type === 'series') {
      const target = String(m.file_title || '').split('/').pop().toLowerCase();
      // Try by basename equality first
      chosen = tbFiles.find(f => String(f.short_name || f.name || '').split('/').pop().toLowerCase() === target);
      // Try by substring
      if (!chosen) chosen = tbFiles.find(f => String(f.name || '').toLowerCase().includes(target));
      // Try by size proximity (within 0.5%)
      if (!chosen && m.file_size) {
        const targetSize = Number(m.file_size);
        const candidate = tbFiles
          .filter(f => videoRe.test(f.name || '') && !sampleRe.test(f.name || ''))
          .map(f => ({ f, diff: Math.abs(Number(f.size || 0) - targetSize) }))
          .sort((a, b) => a.diff - b.diff)[0];
        if (candidate && (candidate.diff / targetSize) < 0.005) chosen = candidate.f;
      }
      if (!chosen) continue;
    } else {
      // movie or other: pick the largest video file (or pack_files matching)
      if (m.file_title) {
        const target = String(m.file_title).split('/').pop().toLowerCase();
        chosen = tbFiles.find(f => String(f.name || '').toLowerCase().includes(target));
      }
      if (!chosen) {
        chosen = tbFiles
          .filter(f => videoRe.test(f.name || '') && !sampleRe.test(f.name || ''))
          .sort((a, b) => Number(b.size || 0) - Number(a.size || 0))[0];
      }
      if (!chosen) continue;
    }

    const fileId = chosen.id !== undefined && chosen.id !== null ? String(chosen.id) : 'auto';
    const fname = chosen.name || chosen.short_name || '';
    const dedupKey = `${t.id}|${fileId}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    // Skip if a cast already serves this exact torrent+file.
    const castUrlFrag = `/play/`;
    const dupCast = castStreams.some(s =>
      String(s.behaviorHints?.filename || '').toLowerCase() === String(fname).split('/').pop().toLowerCase()
    );
    if (dupCast) continue;

    streams.push(buildStreamFromLibrary(baseUrl, profile.user_id, {
      torrentId: t.id,
      infoHash: h,
      fileId,
      filename: fname,
      size: Number(chosen.size || m.file_size || 0),
      type,
      season: parsedId.season,
      episode: parsedId.episode
    }, { aioMode: !!opts.aioMode }));
  }

  return streams;
}

function streamSizeOf(s) {
  return Number(s?.behaviorHints?.videoSize || 0);
}
function streamQualityRank(s) {
  const q = (s?.name || '').match(/2160p|1440p|1080p|720p|480p|360p/i);
  const order = { '2160p': 6, '1440p': 5, '1080p': 4, '720p': 3, '480p': 2, '360p': 1 };
  return q ? order[q[0].toLowerCase()] || 0 : 0;
}
function sortStreams(arr, mode) {
  if (mode === 'size-asc') return arr.slice().sort((a, b) => streamSizeOf(a) - streamSizeOf(b));
  if (mode === 'quality') return arr.slice().sort((a, b) => streamQualityRank(b) - streamQualityRank(a) || streamSizeOf(b) - streamSizeOf(a));
  // default size-desc
  return arr.slice().sort((a, b) => streamSizeOf(b) - streamSizeOf(a));
}
function mergeStreams(casts, library, order, sort) {
  const sortedCasts = sortStreams(casts, sort);
  const sortedLib = sortStreams(library, sort);
  if (order === 'library-first') return [...sortedLib, ...sortedCasts];
  if (order === 'mixed') {
    // interleave: cast, lib, cast, lib...
    const out = [];
    const a = sortedCasts, b = sortedLib;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (i < a.length) out.push(a[i]);
      if (i < b.length) out.push(b[i]);
    }
    return out;
  }
  return [...sortedCasts, ...sortedLib];
}

function getBaseUrl(req) {
  const configured = process.env.BASE_URL || process.env.PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

// ─── Italian poster resolution (TMDB) ────────────────────────────────
// Tries TMDB IT-localized poster/backdrop; falls back to default; final
// fallback metahub. Single in-memory cache shared across requests (24h TTL,
// 5000 entries max with simple FIFO eviction). Per-imdb resolution is gated
// behind `enrichMetasWithItalianPosters` which runs with concurrency=8 so a
// 500-item catalog turns into ~60 sequential TMDB calls.
const _TMDB_KEY_POSTER = process.env.TMDB_API_KEY || '5462f78469f3d80bf5201645294c16e4';
const _TMDB_BASE_POSTER = 'https://api.themoviedb.org/3';
const _POSTER_TTL_MS = 24 * 60 * 60 * 1000;
const _POSTER_MAX = 5000;
const _posterCache = new Map();

function _metahubFallback(imdbId) {
  return {
    poster: `https://images.metahub.space/poster/medium/${imdbId}/img`,
    background: `https://images.metahub.space/background/medium/${imdbId}/img`
  };
}

function _putPosterCache(imdbId, value) {
  if (_posterCache.size >= _POSTER_MAX) {
    const dropCount = Math.floor(_POSTER_MAX * 0.2);
    const it = _posterCache.keys();
    for (let i = 0; i < dropCount; i++) {
      const k = it.next().value;
      if (!k) break;
      _posterCache.delete(k);
    }
  }
  _posterCache.set(imdbId, { ts: Date.now(), poster: value.poster, background: value.background });
}

async function _resolvePosterIt(imdbId, type, tmdbIdHint) {
  if (!imdbId) return null;
  const cached = _posterCache.get(imdbId);
  if (cached && (Date.now() - cached.ts) < _POSTER_TTL_MS) {
    return { poster: cached.poster, background: cached.background };
  }
  const tmdbType = type === 'series' ? 'tv' : 'movie';
  let tmdbId = tmdbIdHint || null;
  try {
    if (!tmdbId) {
      const r = await fetch(`${_TMDB_BASE_POSTER}/find/${imdbId}?api_key=${_TMDB_KEY_POSTER}&external_source=imdb_id`);
      if (r.ok) {
        const j = await r.json();
        const arr = type === 'series' ? j.tv_results : j.movie_results;
        if (Array.isArray(arr) && arr[0]) tmdbId = arr[0].id;
      }
    }
    if (!tmdbId) {
      const out = _metahubFallback(imdbId);
      _putPosterCache(imdbId, out);
      return out;
    }
    // include_image_language=it,null → returns IT-tagged images AND
    // language-less ("international") images. We then prefer IT, then
    // language-less, then the default poster_path returned alongside.
    const r2 = await fetch(`${_TMDB_BASE_POSTER}/${tmdbType}/${tmdbId}?api_key=${_TMDB_KEY_POSTER}&language=it-IT&append_to_response=images&include_image_language=it,null`);
    if (!r2.ok) {
      const out = _metahubFallback(imdbId);
      _putPosterCache(imdbId, out);
      return out;
    }
    const data = await r2.json();
    const posters = (data.images && Array.isArray(data.images.posters)) ? data.images.posters : [];
    const backdrops = (data.images && Array.isArray(data.images.backdrops)) ? data.images.backdrops : [];
    const pickByLang = (arr) => {
      const it = arr.filter(p => p.iso_639_1 === 'it').sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
      if (it[0]) return it[0].file_path;
      const intl = arr.filter(p => !p.iso_639_1).sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
      if (intl[0]) return intl[0].file_path;
      return null;
    };
    const posterPath = pickByLang(posters) || data.poster_path;
    const backdropPath = pickByLang(backdrops) || data.backdrop_path;
    const fb = _metahubFallback(imdbId);
    const out = {
      poster: posterPath ? `https://image.tmdb.org/t/p/w342${posterPath}` : fb.poster,
      background: backdropPath ? `https://image.tmdb.org/t/p/w780${backdropPath}` : fb.background
    };
    _putPosterCache(imdbId, out);
    return out;
  } catch (_) {
    const out = _metahubFallback(imdbId);
    _putPosterCache(imdbId, out);
    return out;
  }
}

async function enrichMetasWithItalianPosters(metas, hintsByImdb = new Map(), concurrency = 8) {
  if (!Array.isArray(metas) || metas.length === 0) return metas;
  const queue = metas.slice();
  return new Promise(resolve => {
    let active = 0;
    let done = 0;
    const total = queue.length;
    const next = () => {
      while (active < concurrency && queue.length > 0) {
        const meta = queue.shift();
        active++;
        const hint = hintsByImdb.get(meta.id) || {};
        _resolvePosterIt(meta.id, meta.type, hint.tmdbId)
          .then(p => { if (p) { meta.poster = p.poster; meta.background = p.background; } })
          .catch(() => {})
          .finally(() => {
            active--;
            done++;
            if (done === total) resolve(metas);
            else next();
          });
      }
    };
    next();
  });
}

function renderTorboxWaitPage({ title, state, seeds, progress, retryUrl, castUrl }) {
  const safe = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  return `<!doctype html>
<html lang="it"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TorBox sta preparando il file...</title>
<meta http-equiv="refresh" content="10">
<style>
  body{margin:0;background:#0a0014;color:#e0e0e0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center}
  .card{max-width:540px;padding:32px;background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.35);border-radius:14px;text-align:center}
  h1{margin:0 0 12px;font-size:20px;color:#d8b4fe}
  .row{display:flex;justify-content:space-between;margin:6px 0;font-size:13px;color:#cbd5e1}
  .row b{color:#fff}
  .bar{height:8px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;margin:14px 0}
  .bar i{display:block;height:100%;background:linear-gradient(90deg,#a855f7,#ec4899);width:${Math.max(2, Math.min(100, Number(progress) || 0))}%}
  a{color:#a855f7;text-decoration:none;margin:0 8px}
  small{color:#94a3b8}
</style></head><body>
<div class="card">
  <h1>TorBox sta preparando il file...</h1>
  <div class="row"><span>Titolo</span><b>${safe(title)}</b></div>
  <div class="row"><span>Stato</span><b>${safe(state)}</b></div>
  <div class="row"><span>Seeds</span><b>${safe(seeds)}</b></div>
  <div class="row"><span>Progresso</span><b>${safe(progress)}%</b></div>
  <div class="bar"><i></i></div>
  <p><small>Questa pagina si aggiorna ogni 10 secondi. Quando TorBox avrà i file, partirà il redirect verso lo stream.</small></p>
  <p><a href="${safe(retryUrl)}">Riprova ora</a> &middot; <a href="${safe(castUrl)}">Torna al manager</a></p>
</div>
</body></html>`;
}

function normalizeInfoHash(value) {
  const clean = String(value || '').trim().toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(clean)) throw new Error('infoHash non valido');
  return clean;
}

function parseOptionalInteger(value) {
  if (value === undefined || value === null || value === '') return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

// Best-effort SxxExx / xXyy parser used as a fallback when the row-level Cast TB
// button does not know the episode (single-file episode torrents).
function parseSeasonEpisodeFromName(name) {
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

function pickTorrentId(data) {
  const payload = data && data.data ? data.data : data;
  return payload?.torrent_id || payload?.id || null;
}

// Sets a non-httpOnly cookie so JS pages (e.g. /cast) can recover the user
// when localStorage is empty (Safari ITP, partitioned storage, new tab in
// private mode, etc.). Not security-critical: actual auth still uses the
// userId in localStorage / URL on every API call, the cookie is only a hint.
function setDmvUidCookie(res, userId) {
  if (!userId) return;
  const oneYear = 60 * 60 * 24 * 365;
  res.cookie('dmv_uid', String(userId), {
    maxAge: oneYear * 1000,
    httpOnly: false,
    sameSite: 'lax',
    secure: true,
    path: '/'
  });
}

async function handleProfileSetup(req, res) {
  try {
    const body = req.body || {};
    const apiKey = String(body.apiKey || '').trim();
    if (!apiKey) return res.status(400).json({ error: 'apiKey mancante' });

    const validation = await validateApiKey(apiKey);
    const userId = createUserId(validation.email);
    let profile = await upsertProfile({
      userId,
      emailHash: hashEmail(validation.email),
      apiKeyEncrypted: encryptText(apiKey),
      apiKeyLast4: apiKey.slice(-4),
      movieMaxSizeGb: Number(body.movieMaxSizeGb || 0),
      episodeMaxSizeGb: Number(body.episodeMaxSizeGb || 0),
      showOtherStreams: Boolean(body.showOtherStreams),
      otherStreamsLimit: Number(body.otherStreamsLimit || 0)
    });

    // Auto-assign a username on first setup (preserved across re-login by upsertProfile,
    // which doesn't touch the username column).
    if (!profile.username) {
      for (let i = 0; i < 8; i++) {
        const candidate = generateUsername();
        const taken = await findProfileByUsername(candidate);
        if (!taken) {
          const updated = await setProfileUsername(profile.user_id, candidate);
          if (updated) profile = updated;
          break;
        }
      }
    }

    setDmvUidCookie(res, profile.user_id);
    return res.json({
      ok: true,
      userId: profile.user_id,
      username: profile.username || null,
      hasPassword: Boolean(profile.password_hash),
      apiKeyLast4: profile.api_key_last4,
      manifestUrl: `${getBaseUrl(req)}/torbox/${encodeURIComponent(profile.user_id)}/manifest.json`
    });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
}

function createRouter() {
  const router = express.Router();

  router.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'dmv-debrid-manager-viola' });
  });

  // DMV logo: violet Cast icon (Lucide-style) served as SVG. Stremio supports SVG
  // manifest logos and this avoids depending on imgur.
  router.get(['/logo.svg', '/logo.png'], (_req, res) => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0a0014"/>
  <g transform="translate(96,96) scale(13.33)" fill="none" stroke="#a855f7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="1" y="2" width="22" height="20" rx="3" ry="3"/>
    <path d="M5 17.1a4 4 0 0 1 3.9 3.9"/>
    <path d="M5 13.05A8 8 0 0 1 12.95 21"/>
    <path d="M5 9a12 12 0 0 1 12 12"/>
  </g>
</svg>`;
    res.set('Cache-Control', 'public, max-age=86400');
    res.type('image/svg+xml').send(svg);
  });

  router.get('/', (_req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.type('html').send(renderHomePage());
  });

  // ─── DB MANAGER PROXY (read-only direct access) ────────────────────────────
  // Forwards /db/* → http://127.0.0.1:3031/* so users can browse the legacy
  // dbmanager from the DMV home without exposing port 3031 publicly.
  // /db (and /db/) lands directly in read-only mode via /auto-readonly.
  const DBMGR_HOST = '127.0.0.1';
  const DBMGR_PORT = Number(process.env.DBMGR_PORT || 3031);
  const DB_PREFIX = '/db';

  // Rewrite absolute-path URLs ("/foo") inside HTML to "/db/foo".
  function rewriteDbHtml(html) {
    const isProxied = (s) => s.startsWith('//') || s === DB_PREFIX || s.startsWith(DB_PREFIX + '/');
    const rw = (s) => isProxied(s) ? s : (DB_PREFIX + s);
    let out = html
      .replace(/(\s(?:href|src|action|formaction)\s*=\s*)(["'])(\/[^"'>\s]*)\2/gi,
        (_, attr, q, p) => `${attr}${q}${rw(p)}${q}`)
      .replace(/(\bfetch\s*\(\s*)(["'`])(\/[^"'`]*)\2/g,
        (_, fn, q, p) => `${fn}${q}${rw(p)}${q}`)
      .replace(/(\bXMLHttpRequest\.prototype\.open\.call\([^,]+,\s*[^,]+,\s*)(["'`])(\/[^"'`]*)\2/g,
        (_, pre, q, p) => `${pre}${q}${rw(p)}${q}`)
      .replace(/(\.open\s*\(\s*["'][A-Z]+["']\s*,\s*)(["'`])(\/[^"'`]*)\2/g,
        (_, pre, q, p) => `${pre}${q}${rw(p)}${q}`)
      .replace(/(\blocation\b(?:\.(?:href|assign|replace))?\s*[=(]\s*)(["'`])(\/[^"'`]*)\2/g,
        (_, pre, q, p) => `${pre}${q}${rw(p)}${q}`)
      .replace(/(\bwindow\.open\s*\(\s*)(["'`])(\/[^"'`]*)\2/g,
        (_, pre, q, p) => `${pre}${q}${rw(p)}${q}`)
      .replace(/(\burl\(\s*)(["']?)(\/[^"'\)]*)\2(\s*\))/g,
        (_, pre, q, p, post) => `${pre}${q}${rw(p)}${q}${post}`);

    // Inject a small runtime shim that rewrites fetch / XHR / form / navigation
    // requests built dynamically with template literals or string concat.
    const shim = `<script>(function(){var P='${DB_PREFIX}';function R(u){if(typeof u!=='string')return u;if(u.charAt(0)!=='/')return u;if(u.indexOf('//')===0)return u;if(u===P||u.indexOf(P+'/')===0)return u;return P+u;}var of=window.fetch;if(of){window.fetch=function(i,o){try{if(typeof i==='string')i=R(i);else if(i&&typeof i.url==='string'&&i.url.charAt(0)==='/'){i=new Request(R(i.url),i);}}catch(e){}return of.call(this,i,o);};}var oo=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){if(arguments.length>=2)arguments[1]=R(u);return oo.apply(this,arguments);};var rh=window.location.href;Object.defineProperty(window,'__dbProxyPrefix',{value:P});var oa=window.location.assign?window.location.assign.bind(window.location):null;var orpl=window.location.replace?window.location.replace.bind(window.location):null;if(oa){try{window.location.assign=function(u){return oa(R(u));};}catch(e){}}if(orpl){try{window.location.replace=function(u){return orpl(R(u));};}catch(e){}}document.addEventListener('submit',function(e){try{var f=e.target;if(f&&f.tagName==='FORM'&&f.action){var u=f.getAttribute('action');if(u&&u.charAt(0)==='/'&&u.indexOf('//')!==0&&u!==P&&u.indexOf(P+'/')!==0){f.setAttribute('action',P+u);}}}catch(_){}}, true);})();</script>`;
    if (/<head[^>]*>/i.test(out)) {
      out = out.replace(/<head[^>]*>/i, (m) => m + shim);
    } else {
      out = shim + out;
    }
    return out;
  }

  function dbProxyHandler(req, res) {
    // First-time entry: if the user hits /db or /db/, or the upstream redirected
    // them to /login (stale cookie / wiped server session), always grant
    // read-only access automatically — the proxy is the public entry point.
    const path = req.url || '/';
    if (path === '/login' || path.startsWith('/login?')) {
      return res.redirect(DB_PREFIX + '/auto-readonly');
    }
    const hasSession = /connect\.sid=/.test(String(req.headers.cookie || ''));
    if (!hasSession && (path === '/' || path === '')) {
      return res.redirect(DB_PREFIX + '/auto-readonly');
    }

    const upstreamPath = path;
    const headers = { ...req.headers };
    delete headers['accept-encoding']; // force identity so we can rewrite HTML
    delete headers['host'];
    delete headers['content-length'];
    // Forward real client IP so dbmanager's rate limiter doesn't bucket
    // every user under 127.0.0.1.
    const clientIp = (req.ip || req.connection?.remoteAddress || '').replace(/^::ffff:/, '');
    if (clientIp) {
      const prev = headers['x-forwarded-for'];
      headers['x-forwarded-for'] = prev ? `${prev}, ${clientIp}` : clientIp;
      headers['x-real-ip'] = clientIp;
    }

    const opts = {
      hostname: DBMGR_HOST,
      port: DBMGR_PORT,
      method: req.method,
      path: upstreamPath,
      headers,
    };

    const upReq = http.request(opts, (upRes) => {
      const status = upRes.statusCode || 502;
      const respHeaders = { ...upRes.headers };

      // Rewrite Location for redirects.
      if (respHeaders.location && typeof respHeaders.location === 'string') {
        const loc = respHeaders.location;
        if (loc.startsWith('/') && !loc.startsWith('//') && !loc.startsWith(DB_PREFIX + '/') && loc !== DB_PREFIX) {
          respHeaders.location = DB_PREFIX + loc;
        }
      }

      // Scope Set-Cookie to /db so dbmanager cookies don't leak to dmv root.
      if (respHeaders['set-cookie']) {
        const cookies = Array.isArray(respHeaders['set-cookie'])
          ? respHeaders['set-cookie']
          : [respHeaders['set-cookie']];
        respHeaders['set-cookie'] = cookies.map((c) => {
          if (/;\s*path=/i.test(c)) return c.replace(/;\s*path=[^;]*/i, '; Path=' + DB_PREFIX);
          return c + '; Path=' + DB_PREFIX;
        });
      }

      const ct = String(respHeaders['content-type'] || '');
      const isHtml = /text\/html/i.test(ct);
      if (isHtml) {
        delete respHeaders['content-length'];
        const chunks = [];
        upRes.on('data', (c) => chunks.push(c));
        upRes.on('end', () => {
          try {
            const body = rewriteDbHtml(Buffer.concat(chunks).toString('utf8'));
            const buf = Buffer.from(body, 'utf8');
            respHeaders['content-length'] = String(buf.length);
            res.writeHead(status, respHeaders);
            res.end(buf);
          } catch (err) {
            console.error('[db-proxy] rewrite error:', err.message);
            if (!res.headersSent) res.status(502).type('text').send('DB manager error');
          }
        });
        upRes.on('error', () => { try { if (!res.headersSent) res.status(502).end(); } catch (_) {} });
      } else {
        res.writeHead(status, respHeaders);
        upRes.pipe(res);
      }
    });

    upReq.on('error', (err) => {
      console.error('[db-proxy] upstream error:', err.message);
      if (!res.headersSent) res.status(502).type('text').send('DB manager non raggiungibile');
    });

    if (req.readable && req.method !== 'GET' && req.method !== 'HEAD') {
      req.pipe(upReq);
    } else {
      upReq.end();
    }
  }

  // Entry point: read-only access is granted automatically inside dbProxyHandler
  // when no dbmanager session cookie is present.
  router.use(DB_PREFIX, dbProxyHandler);
  // ───────────────────────────────────────────────────────────────────────────

  router.get('/login', (req, res) => {
    const raw = typeof req.query.return === 'string' ? req.query.return : '';
    const safeReturn = raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.type('html').send(renderLoginPage(safeReturn));
  });

  router.get('/cast', (_req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.type('html').send(renderCastPage());
  });

  // Search the ICV torrent DB from the /cast landing page. Requires an
  // authenticated DMV user (profile must exist) so this isn't a public scrape
  // endpoint.
  router.get('/icvdb/search', async (req, res) => {
    try {
      const userId = String(req.query.userId || '').trim();
      if (!userId) return res.status(400).json({ error: 'userId mancante' });
      const profile = await getProfile(userId);
      if (!profile) return res.status(404).json({ error: 'Profilo non trovato' });
      const result = await icvDb.searchTorrents({
        q: req.query.q,
        type: req.query.type,
        provider: req.query.provider,
        cache: req.query.cache,
        lang: req.query.lang,
        sort: req.query.sort,
        limit: req.query.limit
      });
      return res.json({ ok: true, results: result.rows, total: result.total });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.get('/icvdb/providers', async (_req, res) => {
    try {
      const providers = await icvDb.listProviders();
      return res.json({ ok: true, providers });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  // Returns the list of episode files (with parsed season/episode) for a series
  // torrent. Used by /cast to render a dropdown of available episodes instead
  // of asking the user to type season+episode by hand.
  router.get('/icvdb/files', async (req, res) => {
    try {
      const userId = String(req.query.userId || '').trim();
      if (!userId) return res.status(400).json({ error: 'userId mancante' });
      const profile = await getProfile(userId);
      if (!profile) return res.status(404).json({ error: 'Profilo non trovato' });
      const infoHash = String(req.query.infoHash || '').trim().toLowerCase();
      if (!/^[a-f0-9]{40}$/.test(infoHash)) return res.status(400).json({ error: 'infoHash non valido' });
      const files = await icvDb.lookupSeriesFiles(infoHash);
      return res.json({ ok: true, files });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.post('/setup/torbox', handleProfileSetup);
  router.post('/torbox/profile', handleProfileSetup);

  // Unified login: accepts {apiKey} OR {username, password}.
  router.post('/auth/login', async (req, res) => {
    try {
      const body = req.body || {};
      const apiKey = String(body.apiKey || '').trim();
      if (apiKey) {
        return handleProfileSetup(req, res);
      }
      const username = String(body.username || '').trim();
      const password = String(body.password || '');
      if (!username || !password) {
        return res.status(400).json({ error: 'Inserisci API Key oppure username e password' });
      }
      const profile = await findProfileByUsername(username);
      if (!profile || !profile.password_hash) {
        return res.status(401).json({ error: 'Credenziali non valide' });
      }
      if (!verifyPassword(password, profile.password_hash)) {
        return res.status(401).json({ error: 'Credenziali non valide' });
      }
      setDmvUidCookie(res, profile.user_id);
      return res.json({
        ok: true,
        userId: profile.user_id,
        username: profile.username || null,
        hasPassword: true,
        apiKeyLast4: profile.api_key_last4,
        manifestUrl: `${getBaseUrl(req)}/torbox/${encodeURIComponent(profile.user_id)}/manifest.json`
      });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  });

  // Set/change username and/or password for a userId.
  // Auth: if the profile already has a password, must provide currentPassword;
  // otherwise (first-time set) the apiKey is required to prove ownership.
  router.post('/torbox/:userId/credentials', async (req, res) => {
    try {
      const profile = await getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ error: 'Profilo TorBox non trovato' });

      const body = req.body || {};
      const nextUsername = body.username !== undefined ? String(body.username).trim() : null;
      const nextPassword = body.password !== undefined ? String(body.password) : null;

      // Authorize change.
      if (profile.password_hash) {
        const currentPassword = String(body.currentPassword || '');
        if (!currentPassword || !verifyPassword(currentPassword, profile.password_hash)) {
          return res.status(401).json({ error: 'Password attuale non corretta' });
        }
      } else {
        const apiKey = String(body.apiKey || '').trim();
        if (!apiKey) {
          return res.status(401).json({ error: 'Conferma con la tua TorBox API Key' });
        }
        try {
          const decrypted = decryptText(profile.api_key_encrypted);
          if (decrypted !== apiKey) return res.status(401).json({ error: 'API Key non corrispondente' });
        } catch (_) {
          return res.status(401).json({ error: 'API Key non corrispondente' });
        }
      }

      let updated = profile;

      if (nextUsername !== null && nextUsername !== profile.username) {
        if (!isValidUsername(nextUsername)) {
          return res.status(400).json({ error: 'Username non valido (3-32 caratteri: a-z, 0-9, . _ -)' });
        }
        const taken = await findProfileByUsername(nextUsername);
        if (taken && taken.user_id !== profile.user_id) {
          return res.status(409).json({ error: 'Username già in uso' });
        }
        const u = await setProfileUsername(profile.user_id, nextUsername);
        if (u) updated = u;
      }

      if (nextPassword !== null && nextPassword !== '') {
        if (!isValidPassword(nextPassword)) {
          return res.status(400).json({ error: 'Password troppo corta (minimo 6 caratteri)' });
        }
        const p = await setProfilePassword(profile.user_id, hashPassword(nextPassword));
        if (p) updated = p;
      }

      return res.json({
        ok: true,
        userId: updated.user_id,
        username: updated.username || null,
        hasPassword: Boolean(updated.password_hash)
      });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  });

  router.get('/torbox/:userId/profile', async (req, res) => {
    try {
      const profile = await getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ error: 'Profilo TorBox non trovato' });
      // Auto-refresh the dmv_uid cookie on every profile fetch so already-logged-in
      // users (who won't re-hit /auth/login) still get the cookie populated and can
      // visit /cast in a partitioned context.
      setDmvUidCookie(res, profile.user_id);
      return res.json({
        ok: true,
        userId: profile.user_id,
        username: profile.username || null,
        hasPassword: Boolean(profile.password_hash),
        apiKeyLast4: profile.api_key_last4,
        movieMaxSizeGb: Number(profile.movie_max_size_gb || 0),
        episodeMaxSizeGb: Number(profile.episode_max_size_gb || 0),
        showOtherStreams: Boolean(profile.show_other_streams),
        otherStreamsLimit: Number(profile.other_streams_limit || 0),
        manifestUrl: `${getBaseUrl(req)}/torbox/${encodeURIComponent(profile.user_id)}/manifest.json`,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.get('/torbox/:userId/manifest.json', async (req, res) => {
    try {
      const profile = await getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ error: 'Profilo TorBox non trovato' });
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.json(buildManifest(req.params.userId, getBaseUrl(req), profile.username, {
        catalogMode: profile.catalog_mode || 'full',
        catalogSource: profile.catalog_source || 'both-merged'
      }));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  // Variant manifest that forces no catalogs (independent of the profile preference).
  // Used by users who want a "pure stream" install.
  router.get('/torbox/:userId/no-catalog/manifest.json', async (req, res) => {
    try {
      const profile = await getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ error: 'Profilo TorBox non trovato' });
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.json(buildManifest(req.params.userId, getBaseUrl(req), profile.username, {
        catalogMode: 'off'
      }));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.get('/torbox/:userId/stream/:type/:id.json', async (req, res) => {
    try {
      const type = req.params.type;
      console.log('[STREAM]', new Date().toISOString(), req.params.userId, type, req.params.id, 'UA:', String(req.get('user-agent') || '').slice(0, 80));
      if (!['movie', 'series'].includes(type)) return res.json({ streams: [] });

      const profile = await getProfile(req.params.userId);
      if (!profile) { console.log('[STREAM] no profile'); return res.json({ streams: [] }); }

      const parsedId = parseStremioId(type, req.params.id);
      const baseUrl = getBaseUrl(req);
      const aioMode = profile.aiostreams_mode === true;

      // (1) Existing casts.
      const casts = await listCastsForItem(req.params.userId, parsedId, type);
      const castStreams = casts.map((cast) => buildStreamFromCast(baseUrl, req.params.userId, cast, { aioMode }));

      // (2) Live merge: also look up the user's TorBox library via ICVdb.
      let libStreams = [];
      if (profile.include_library_streams !== false) {
        try {
          libStreams = await resolveLibraryStreams(profile, parsedId, type, baseUrl, castStreams, { aioMode });
        } catch (e) {
          console.log('[STREAM] library merge error:', e.message);
        }
      }

      // (3) Order + sort.
      const merged = mergeStreams(castStreams, libStreams, profile.stream_order || 'cast-first', profile.stream_sort || 'size-desc');
      console.log('[STREAM] parsed', JSON.stringify(parsedId), '->', casts.length, 'casts +', libStreams.length, 'library =', merged.length);
      return res.json({ streams: merged });
    } catch (error) {
      console.log('[STREAM] ERROR:', error.message);
      return res.json({ streams: [] });
    }
  });

  // Same stream resource path on the "no-catalog" variant.
  router.get('/torbox/:userId/no-catalog/stream/:type/:id.json', (req, res, next) => {
    req.url = `/torbox/${encodeURIComponent(req.params.userId)}/stream/${encodeURIComponent(req.params.type)}/${encodeURIComponent(req.params.id)}.json`;
    router.handle(req, res, next);
  });

  // Live resolve: streams a TorBox library file by torrentId+fileId without needing a cast row.
  // Mirrors /play/:castId but works on raw library coordinates.
  router.get('/torbox/:userId/lib-play/:torrentId/:fileId', async (req, res) => {
    try {
      const profile = await getProfile(req.params.userId);
      if (!profile) return res.status(404).send('Profilo non trovato');
      const apiKey = decryptText(profile.api_key_encrypted);
      const torrentId = String(req.params.torrentId);
      let fileId = req.params.fileId;
      if (fileId === 'auto' || fileId === '' || fileId === '-1') {
        // pick best video file from torrent info
        const info = await getTorrentInfo(torrentId, apiKey);
        fileId = pickBestVideoFileId(info);
        if (fileId === null || fileId === undefined) return res.status(404).send('Nessun file video nel torrent');
      }
      const link = await requestDownloadLink(torrentId, fileId, apiKey);
      const url = (link && (link.data || link)) || '';
      const finalUrl = typeof url === 'string' ? url : (url.url || url.data || '');
      if (!finalUrl) return res.status(502).send('TorBox non ha restituito un URL valido');
      return res.redirect(302, finalUrl);
    } catch (error) {
      console.log('[LIB-PLAY] error:', error.message);
      return res.status(500).send('Errore nel resolve dello stream: ' + error.message);
    }
  });

  router.post('/torbox/:userId/cast', async (req, res) => {
    try {
      const profile = await getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ error: 'Profilo TorBox non trovato' });

      const body = req.body || {};
      const type = String(body.type || 'movie');
      if (!['movie', 'series'].includes(type)) return res.status(400).json({ error: 'type non valido' });

      const imdbId = String(body.imdbId || '').trim();
      if (!/^tt\d+$/.test(imdbId)) return res.status(400).json({ error: 'imdbId non valido' });

      const infoHash = normalizeInfoHash(body.infoHash);
      const apiKey = decryptText(profile.api_key_encrypted);
      let torrentId = body.torrentId || null;

      if (!torrentId && body.createOnTorBox !== false) {
        const torrent = await createTorrent(infoHash, apiKey);
        torrentId = pickTorrentId(torrent);
      }

      let season = parseOptionalInteger(body.season);
      let episode = parseOptionalInteger(body.episode);
      if (type === 'series' && (season <= 0 || episode <= 0)) {
        const guess = parseSeasonEpisodeFromName(body.filename || body.title);
        if (guess.season > 0 && guess.episode > 0) {
          season = guess.season;
          episode = guess.episode;
        }
      }

      const cast = await upsertCast({
        userId: req.params.userId,
        imdbId,
        tmdbId: body.tmdbId || null,
        type,
        season,
        episode,
        infoHash,
        torrentId,
        fileId: body.fileId,
        fileIndex: parseOptionalInteger(body.fileIndex),
        filename: body.filename || null,
        title: body.title || null,
        size: Number(body.size || 0)
      });

      return res.json({ ok: true, cast });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  });

  router.get('/torbox/:userId/casts', async (req, res) => {
    try {
      const profile = await getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ error: 'Profilo TorBox non trovato' });

      const casts = await listCastsForUser(req.params.userId, req.query.limit);
      return res.json({ ok: true, casts });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.delete('/torbox/:userId/cast/:castId', async (req, res) => {
    try {
      const deleted = await deleteCastForUser(req.params.userId, req.params.castId);
      if (!deleted) return res.status(404).json({ error: 'Cast non trovato' });
      return res.json({ ok: true, cast: deleted });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  // Bulk-delete every cast for a user. Does NOT touch TorBox: the torrents stay
  // in the user's TB library, only the DMV cast rows are wiped so Stremio stops
  // listing them as cast streams.
  router.delete('/torbox/:userId/casts', async (req, res) => {
    try {
      const profile = await getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ error: 'Profilo TorBox non trovato' });
      const removed = await deleteAllCastsForUser(req.params.userId);
      invalidateLibraryCache(req.params.userId);
      return res.json({ ok: true, removed: removed.length });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.get('/torbox/:userId/play/:castId', async (req, res) => {
    try {
      const [profile, cast] = await Promise.all([
        getProfile(req.params.userId),
        getCastForUser(req.params.userId, req.params.castId)
      ]);

      if (!profile || !cast) return res.status(404).send('Cast non trovato');
      if (!cast.torrent_id) return res.status(409).send('Cast incompleto: torrent_id mancante');

      const cachedStream = typeof cast.stream_url === 'string' ? cast.stream_url : '';
      const cachedStreamIsValid = /^https?:\/\//i.test(cachedStream);
      if (cachedStreamIsValid && (!cast.stream_url_expires_at || new Date(cast.stream_url_expires_at) > new Date())) {
        return res.redirect(cachedStream);
      }

      const apiKey = decryptText(profile.api_key_encrypted);

      // TorBox requestdl needs a file_id; if we don't have one yet, poll TorBox until the
      // torrent files appear (TorBox needs a few seconds even for cached torrents).
      // Mirror ICV behavior: poll for up to ~30s with 2.5s intervals.
      let fileId = cast.file_id;
      let lastInfo = null;
      if (!fileId) {
        const maxAttempts = 12;
        const intervalMs = 2500;
        for (let i = 0; i < maxAttempts; i++) {
          lastInfo = await getTorrentInfo(cast.torrent_id, apiKey);
          if (lastInfo && Array.isArray(lastInfo.files) && lastInfo.files.length > 0) break;
          if (i < maxAttempts - 1) await new Promise((r) => setTimeout(r, intervalMs));
        }
        if (!lastInfo || !Array.isArray(lastInfo.files) || lastInfo.files.length === 0) {
          const state = lastInfo && lastInfo.download_state ? lastInfo.download_state : 'sconosciuto';
          const seeds = lastInfo && typeof lastInfo.seeds === 'number' ? lastInfo.seeds : '?';
          const progress = lastInfo && typeof lastInfo.progress === 'number' ? Math.round(lastInfo.progress * 100) : 0;
          return res.status(202).type('html').send(renderTorboxWaitPage({
            title: cast.title || cast.filename || 'Cast TorBox',
            state, seeds, progress,
            retryUrl: `${getBaseUrl(req)}/torbox/${encodeURIComponent(req.params.userId)}/play/${encodeURIComponent(cast.id)}`,
            castUrl: `${getBaseUrl(req)}/`
          }));
        }
        const picked = pickBestVideoFileId(lastInfo);
        if (picked === null || picked === undefined) {
          return res.status(409).send('Nessun file video idoneo trovato in questo torrent su TorBox.');
        }
        fileId = String(picked);
        await updateCastFileId(cast.id, fileId).catch(() => {});
      }

      const link = await requestDownloadLink(cast.torrent_id, fileId, apiKey);
      await updateCastStreamUrl(cast.id, link.url, link.expiresAt || null);
      return res.redirect(link.url);
    } catch (error) {
      return res.status(error.status || 500).send(error.message);
    }
  });

  // ---- TorBox personal library (browse + cast) ----

  // HTML page: client fetches /library/data and renders.
  router.get('/torbox/:userId/library', async (_req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.type('html').send(renderLibraryPage());
  });

  // JSON list of torrents on the user's TorBox account.
  // Uses the shared 60s in-memory cache so refreshing the page is instant.
  // Pass ?refresh=1 to bypass the cache (button ↻ does this).
  // The `files[]` array is stripped from each torrent to keep the payload small
  // (was ~13 MB → ~200 KB). Use /library/torrent/:id/files to load files on demand.
  router.get('/torbox/:userId/library/data', async (req, res) => {
    try {
      const profile = await getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ error: 'Profilo TorBox non trovato' });
      const apiKey = decryptText(profile.api_key_encrypted);
      if (req.query.refresh === '1') invalidateLibraryCache(req.params.userId);
      const torrents = await getCachedLibrary(req.params.userId, apiKey);
      const videoRe = /\.(mkv|mp4|avi|mov|m4v|webm|ts|wmv)$/i;
      const sampleRe = /sample|trailer|extra|featurette/i;
      const slim = torrents.map(t => {
        const files = Array.isArray(t.files) ? t.files : [];
        const videos = files.filter(f => {
          const n = f?.name || f?.short_name || '';
          return videoRe.test(n) && !sampleRe.test(n);
        });
        const out = { ...t };
        delete out.files;
        delete out.magnet;
        delete out.torrent_file;
        delete out.alternative_hashes;
        out.file_count = files.length;
        out.video_count = videos.length;
        if (videos.length === 1) {
          out.single_video = {
            id: videos[0].id ?? videos[0].file_id ?? null,
            name: videos[0].name || videos[0].short_name || '',
            size: videos[0].size || 0
          };
        }
        return out;
      });
      return res.json({ ok: true, torrents: slim, cached: req.query.refresh !== '1' });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  });

  // Cast a file that already lives on the user's TorBox account.
  // Differs from /cast: never calls /createtorrent (torrent_id + file_id are known).
  // Lazy-load files for a single torrent. Used by the library UI when the user
  // expands a torrent row; keeps /library/data tiny.
  router.get('/torbox/:userId/library/torrent/:torrentId/files', async (req, res) => {
    try {
      const profile = await getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ error: 'Profilo TorBox non trovato' });
      const apiKey = decryptText(profile.api_key_encrypted);
      const info = await getTorrentInfo(req.params.torrentId, apiKey);
      const files = info && Array.isArray(info.files) ? info.files : [];
      return res.json({ ok: true, files, hash: info?.hash || null });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  });

  router.post('/torbox/:userId/library/cast', async (req, res) => {
    try {
      const profile = await getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ error: 'Profilo TorBox non trovato' });

      const body = req.body || {};
      const type = String(body.type || 'movie');
      if (!['movie', 'series'].includes(type)) return res.status(400).json({ error: 'type non valido' });

      const imdbId = String(body.imdbId || '').trim();
      if (!/^tt\d+$/.test(imdbId)) return res.status(400).json({ error: 'imdbId non valido' });

      const torrentId = body.torrentId;
      if (torrentId === undefined || torrentId === null || String(torrentId).trim() === '') {
        return res.status(400).json({ error: 'torrentId mancante' });
      }

      const infoHash = normalizeInfoHash(body.infoHash);
      const fileId = body.fileId !== undefined && body.fileId !== null ? String(body.fileId) : '';

      let season = parseOptionalInteger(body.season);
      let episode = parseOptionalInteger(body.episode);
      if (type === 'series' && (season <= 0 || episode <= 0)) {
        const guess = parseSeasonEpisodeFromName(body.filename || body.title);
        if (guess.season > 0 && guess.episode > 0) {
          season = guess.season;
          episode = guess.episode;
        }
        if (season <= 0 || episode <= 0) {
          return res.status(400).json({ error: 'Stagione ed episodio obbligatori per le serie' });
        }
      }

      const cast = await upsertCast({
        userId: req.params.userId,
        imdbId,
        tmdbId: body.tmdbId || null,
        type,
        season,
        episode,
        infoHash,
        torrentId: String(torrentId),
        fileId,
        fileIndex: parseOptionalInteger(body.fileIndex),
        filename: body.filename || null,
        title: body.title || null,
        size: Number(body.size || 0)
      });

      return res.json({ ok: true, cast });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  });

  // ---- Auto-cast: lookup IMDb via ICVdb hash database ----

  // Try to auto-match a single file. Body: { torrentId, infoHash, fileId, filename, size }
  // Returns { ok:true, cast } on success, or { ok:false, reason } on failure.
  router.post('/torbox/:userId/library/auto-cast', async (req, res) => {
    try {
      const profile = await getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ error: 'Profilo TorBox non trovato' });

      const body = req.body || {};
      const infoHash = normalizeInfoHash(body.infoHash);
      const torrentId = body.torrentId;
      if (torrentId === undefined || torrentId === null || String(torrentId).trim() === '') {
        return res.status(400).json({ ok: false, reason: 'missing_torrent_id' });
      }

      const match = await icvDb.matchFileToImdb(infoHash, body.filename, body.size);
      if (!match.ok) return res.json({ ok: false, reason: match.reason });

      const cast = await upsertCast({
        userId: req.params.userId,
        imdbId: match.imdbId,
        tmdbId: match.tmdbId,
        type: match.type,
        season: match.season,
        episode: match.episode,
        infoHash,
        torrentId: String(torrentId),
        fileId: body.fileId !== undefined && body.fileId !== null ? String(body.fileId) : '',
        fileIndex: parseOptionalInteger(body.fileIndex),
        filename: body.filename || null,
        title: body.title || null,
        size: Number(body.size || 0)
      });
      return res.json({ ok: true, cast, source: match.source });
    } catch (error) {
      return res.status(error.status || 500).json({ ok: false, reason: error.message });
    }
  });

  // Bulk auto-cast: iterate every torrent in the user's TorBox account, run
  // ICVdb lookup per video file, upsert any successful match. Returns a summary.
  // For pack torrents (series) it tries to cast every episode file individually.
  router.post('/torbox/:userId/library/auto-sync', async (req, res) => {
    try {
      const profile = await getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ error: 'Profilo TorBox non trovato' });
      const apiKey = decryptText(profile.api_key_encrypted);
      const torrents = await listMyTorrents(apiKey);

      const summary = {
        torrentsScanned: torrents.length,
        torrentsMatched: 0,
        torrentsUnmatched: 0,
        castsCreated: 0,
        reasons: {}
      };
      const videoRe = /\.(mkv|mp4|avi|mov|m4v|webm|ts|wmv)$/i;
      const sampleRe = /sample|trailer|extra|featurette/i;

      for (const t of torrents) {
        const hash = String(t.hash || '').toLowerCase();
        const torrentId = t.id;
        if (!hash || !torrentId) continue;
        const files = Array.isArray(t.files) ? t.files : [];
        const videoFiles = files.filter((f) => {
          const n = f.name || f.short_name || '';
          return videoRe.test(n) && !sampleRe.test(n);
        });
        // If no individual files listed, treat the torrent as a single item.
        const items = videoFiles.length > 0 ? videoFiles : [{ name: t.name, size: t.size, id: null }];

        let matchedAny = false;
        for (const f of items) {
          const fname = f.name || f.short_name || t.name || '';
          const match = await icvDb.matchFileToImdb(hash, fname, f.size);
          if (!match.ok) {
            summary.reasons[match.reason] = (summary.reasons[match.reason] || 0) + 1;
            continue;
          }
          try {
            await upsertCast({
              userId: req.params.userId,
              imdbId: match.imdbId,
              tmdbId: match.tmdbId,
              type: match.type,
              season: match.season,
              episode: match.episode,
              infoHash: hash,
              torrentId: String(torrentId),
              fileId: f.id !== undefined && f.id !== null ? String(f.id) : '',
              fileIndex: Number.isInteger(f.id) ? f.id : 0,
              filename: fname || null,
              title: t.name || null,
              size: Number(f.size || t.size || 0)
            });
            summary.castsCreated++;
            matchedAny = true;
          } catch (_) { /* duplicates / constraints */ }
        }
        if (matchedAny) summary.torrentsMatched++;
        else summary.torrentsUnmatched++;
      }

      return res.json({ ok: true, summary });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  });

  // ---- Stremio catalog endpoints ----
  // Catalog IDs:
  //   dmv-tb-movies          / dmv-tb-series          → merged (cast + library), dedup
  //   dmv-tb-movies-casts    / dmv-tb-series-casts    → only manual/auto casts
  //   dmv-tb-movies-library  / dmv-tb-series-library  → only library (ICVdb-resolved)
  router.get('/torbox/:userId/catalog/:type/:catalogId.json', async (req, res) => {
    try {
      const { type, catalogId } = req.params;
      if (!['movie', 'series'].includes(type)) return res.json({ metas: [] });
      const profile = await getProfile(req.params.userId);
      if (!profile) return res.json({ metas: [] });

      const isMovieId = (id) => ['dmv-tb-movies','dmv-tb-movies-casts','dmv-tb-movies-library'].includes(id);
      const isSeriesId = (id) => ['dmv-tb-series','dmv-tb-series-casts','dmv-tb-series-library'].includes(id);
      const valid = (type === 'movie' && isMovieId(catalogId)) || (type === 'series' && isSeriesId(catalogId));
      if (!valid) return res.json({ metas: [] });

      const wantCasts   = catalogId.endsWith('-casts')   || (!catalogId.endsWith('-library') && !catalogId.endsWith('-casts'));
      const wantLibrary = catalogId.endsWith('-library') || (!catalogId.endsWith('-library') && !catalogId.endsWith('-casts'));
      const isMerged = !catalogId.endsWith('-casts') && !catalogId.endsWith('-library');

      const castSort = profile.catalog_sort_casts || 'recent';
      const libSort = profile.catalog_sort_library || 'recent';
      const metasMap = new Map(); // imdb_id → meta (keeps the first occurrence to preserve order)
      const hintsByImdb = new Map(); // imdb_id → { tmdbId } for the IT-poster resolver

      // (a) Casts.
      let castMetas = [];
      if (wantCasts) {
        const castRows = await listCastsCatalogForUser(req.params.userId, type, castSort);
        for (const row of castRows) {
          const meta = buildCatalogMeta(row);
          if (meta) {
            castMetas.push(meta);
            if (row.tmdb_id && !hintsByImdb.has(meta.id)) hintsByImdb.set(meta.id, { tmdbId: row.tmdb_id });
          }
        }
      }

      // (b) Library (live TorBox + ICVdb lookup).
      let libMetas = [];
      if (wantLibrary) {
        try {
          const apiKey = decryptText(profile.api_key_encrypted);
          const torrents = await getCachedLibrary(req.params.userId, apiKey);
          const hashes = torrents.map(t => String(t.hash || '').toLowerCase()).filter(Boolean);
          const icvMap = await icvDb.lookupImdbForHashes(hashes);
          const tIndex = new Map();
          for (const t of torrents) tIndex.set(String(t.hash || '').toLowerCase(), t);
          // collect one entry per imdb_id; keep the torrent representative used for sort
          const byImdb = new Map();
          for (const [hash, row] of icvMap) {
            if (!row.imdb_id) continue;
            const rowType = String(row.type || '').toLowerCase();
            if (type === 'series' && rowType !== 'series' && rowType !== 'anime') continue;
            if (type === 'movie' && rowType !== 'movie' && rowType !== 'other') continue;
            const t = tIndex.get(hash);
            if (!t) continue;
            const existing = byImdb.get(row.imdb_id);
            const candSize = Number(t.size || 0);
            const candDate = new Date(t.created_at || t.updated_at || 0).getTime();
            if (!existing) { byImdb.set(row.imdb_id, { torrent: t, row, size: candSize, date: candDate }); continue; }
            // representative pick mirrors the sort, so the displayed item is the "right" one
            if (libSort === 'biggest' && candSize > existing.size) byImdb.set(row.imdb_id, { torrent: t, row, size: candSize, date: candDate });
            else if (libSort === 'smallest' && candSize > 0 && (existing.size === 0 || candSize < existing.size)) byImdb.set(row.imdb_id, { torrent: t, row, size: candSize, date: candDate });
            else if (libSort === 'oldest' && candDate > 0 && (existing.date === 0 || candDate < existing.date)) byImdb.set(row.imdb_id, { torrent: t, row, size: candSize, date: candDate });
            else if (libSort === 'recent' && candDate > existing.date) byImdb.set(row.imdb_id, { torrent: t, row, size: candSize, date: candDate });
          }
          // sort
          const arr = Array.from(byImdb.entries()).map(([imdb, v]) => ({ imdb, ...v }));
          arr.sort((a, b) => {
            if (libSort === 'biggest') return b.size - a.size;
            if (libSort === 'smallest') return (a.size || Infinity) - (b.size || Infinity);
            if (libSort === 'oldest') return (a.date || Infinity) - (b.date || Infinity);
            return b.date - a.date; // recent default
          });
          for (const e of arr) {
            const meta = buildCatalogMeta({
              imdb_id: e.imdb,
              type,
              title: (e.torrent && e.torrent.name) || e.row.title || e.imdb,
              filename: (e.torrent && e.torrent.name) || ''
            });
            if (meta) {
              libMetas.push(meta);
              if (e.row && e.row.tmdb_id && !hintsByImdb.has(meta.id)) hintsByImdb.set(meta.id, { tmdbId: e.row.tmdb_id });
            }
          }
        } catch (e) {
          console.log('[CATALOG] library lookup failed:', e.message);
        }
      }

      // Combine.
      const out = [];
      if (isMerged) {
        // Merged: cast first (in their order), then library (only IMDb not already shown).
        for (const m of castMetas) if (!metasMap.has(m.id)) { metasMap.set(m.id, m); out.push(m); }
        for (const m of libMetas)  if (!metasMap.has(m.id)) { metasMap.set(m.id, m); out.push(m); }
      } else if (wantCasts) {
        for (const m of castMetas) if (!metasMap.has(m.id)) { metasMap.set(m.id, m); out.push(m); }
      } else if (wantLibrary) {
        for (const m of libMetas) if (!metasMap.has(m.id)) { metasMap.set(m.id, m); out.push(m); }
      }

      console.log('[CATALOG]', type, catalogId, '→', out.length, 'metas (', castMetas.length, 'casts +', libMetas.length, 'library, merged=', isMerged, ')');

      // Resolve Italian posters with TMDB fallback. Best-effort: any error
      // leaves the metahub fallback poster untouched in the meta.
      try {
        await enrichMetasWithItalianPosters(out, hintsByImdb, 8);
      } catch (e) {
        console.log('[CATALOG] IT poster enrichment failed:', e.message);
      }

      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.json({ metas: out });
    } catch (error) {
      console.log('[CATALOG] error:', error.message);
      return res.json({ metas: [] });
    }
  });

  // Same catalog endpoint aliased under /no-catalog/ — Stremio shouldn't request it but
  // some addon resolvers do, and a 404 there would surface as an addon error.
  router.get('/torbox/:userId/no-catalog/catalog/:type/:catalogId.json', (req, res) => res.json({ metas: [] }));

  // ---- Library item actions ----

  // Auto-cast ALL video files of a single TorBox torrent (per-torrent flavour of
  // /library/auto-sync). Used by the "🪄 Tutto" button per row in the library UI.
  router.post('/torbox/:userId/library/auto-cast-torrent', async (req, res) => {
    try {
      const profile = await getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ error: 'Profilo TorBox non trovato' });
      const body = req.body || {};
      const torrentId = body.torrentId;
      const infoHash = body.infoHash;
      if (!torrentId || !infoHash) return res.status(400).json({ error: 'torrentId + infoHash richiesti' });
      const apiKey = decryptText(profile.api_key_encrypted);
      const info = await getTorrentInfo(torrentId, apiKey);
      const files = info && Array.isArray(info.files) ? info.files : [];
      const videoRe = /\.(mkv|mp4|avi|mov|m4v|webm|ts|wmv)$/i;
      const sampleRe = /sample|trailer|extra|featurette/i;
      const videoFiles = files.filter(f => {
        const n = f.name || f.short_name || '';
        return videoRe.test(n) && !sampleRe.test(n);
      });
      const items = videoFiles.length > 0 ? videoFiles : [{ name: info?.name, size: info?.size, id: null }];
      const hash = String(infoHash).toLowerCase();
      const summary = { scanned: items.length, matched: 0, errors: 0, reasons: {} };
      for (const f of items) {
        const fname = f.name || f.short_name || info?.name || '';
        const match = await icvDb.matchFileToImdb(hash, fname, f.size);
        if (!match.ok) { summary.reasons[match.reason] = (summary.reasons[match.reason] || 0) + 1; continue; }
        try {
          await upsertCast({
            userId: req.params.userId,
            imdbId: match.imdbId,
            tmdbId: match.tmdbId,
            type: match.type,
            season: match.season,
            episode: match.episode,
            infoHash: hash,
            torrentId: String(torrentId),
            fileId: f.id !== undefined && f.id !== null ? String(f.id) : '',
            fileIndex: Number.isInteger(f.id) ? f.id : 0,
            filename: fname || null,
            title: info?.name || null,
            size: Number(f.size || 0)
          });
          summary.matched++;
        } catch (_) { summary.errors++; }
      }
      invalidateLibraryCache(req.params.userId);
      return res.json({ ok: true, summary });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  });

  // Delete the torrent from TorBox AND wipe any casts referencing it.
  // Query: ?force=1 -> skip the TorBox call and only delete local casts (useful
  // when TB itself is in DATABASE_ERROR for that record and the user just wants
  // the casts cleaned up).
  router.delete('/torbox/:userId/library/torrent/:torrentId', async (req, res) => {
    const force = String(req.query.force || '') === '1' || String(req.query.force || '') === 'true';
    try {
      const profile = await getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ error: 'Profilo TorBox non trovato' });
      const tid = req.params.torrentId;
      let tbResult = null;
      let tbError = null;
      if (!force) {
        try {
          const apiKey = decryptText(profile.api_key_encrypted);
          tbResult = await controlTorrent(tid, 'delete', apiKey);
        } catch (e) {
          tbError = {
            message: e.message || 'TB error',
            status: e.status || 500,
            detail: e.data && e.data.detail || null
          };
          // If TB is in a bad state for this specific torrent, surface a friendly
          // hint to the client so the UI can offer a "force-clean local casts" flow.
          const isDbErr = tbError.detail === 'DATABASE_ERROR' || /database/i.test(tbError.message);
          return res.status(502).json({
            error: isDbErr
              ? 'TorBox non riesce a gestire questo torrent (errore interno DATABASE_ERROR). Riprova fra qualche minuto, oppure forza la pulizia dei cast locali.'
              : ('TorBox: ' + tbError.message),
            tbError,
            canForce: true
          });
        }
      }
      const removedCasts = await deleteCastsByTorrentId(req.params.userId, tid);
      invalidateLibraryCache(req.params.userId);
      return res.json({ ok: true, torbox: tbResult, torboxSkipped: !!force, removedCasts: removedCasts.length });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  });

  // Pause / resume / reannounce — passthrough.
  router.post('/torbox/:userId/library/torrent/:torrentId/control', async (req, res) => {
    try {
      const profile = await getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ error: 'Profilo TorBox non trovato' });
      const apiKey = decryptText(profile.api_key_encrypted);
      const op = String((req.body || {}).operation || '').toLowerCase();
      const result = await controlTorrent(req.params.torrentId, op, apiKey);
      invalidateLibraryCache(req.params.userId);
      return res.json({ ok: true, result });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  });

  // Delete just the casts attached to a torrent (without deleting the TB torrent itself).
  router.delete('/torbox/:userId/library/torrent/:torrentId/casts', async (req, res) => {
    try {
      const removed = await deleteCastsByTorrentId(req.params.userId, req.params.torrentId);
      return res.json({ ok: true, removed: removed.length });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  // ---- TMDB title search (used by the cast modal to find an IMDb id) ----
  // Public TMDB key reused from the rest of the codebase (dailyscraper / dbmanager).
  const TMDB_API_KEY = process.env.TMDB_API_KEY || '5462f78469f3d80bf5201645294c16e4';
  const TMDB_BASE = 'https://api.themoviedb.org/3';
  const tmdbCache = new Map(); // key=`${type}|${q}` → { ts, results }
  const TMDB_CACHE_TTL_MS = 5 * 60 * 1000;

  router.get('/torbox/:userId/tmdb-search', async (req, res) => {
    try {
      const q = String(req.query.q || '').trim();
      const type = req.query.type === 'series' ? 'series' : 'movie';
      if (q.length < 2) return res.json({ ok: true, results: [] });

      const cacheKey = `${type}|${q.toLowerCase()}`;
      const cached = tmdbCache.get(cacheKey);
      if (cached && (Date.now() - cached.ts) < TMDB_CACHE_TTL_MS) {
        return res.json({ ok: true, results: cached.results, cached: true });
      }

      const tmdbType = type === 'series' ? 'tv' : 'movie';
      const searchUrl = `${TMDB_BASE}/search/${tmdbType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=it-IT&include_adult=false`;
      const r = await fetch(searchUrl);
      if (!r.ok) return res.status(502).json({ error: 'TMDB search failed', status: r.status });
      const data = await r.json();
      const raw = Array.isArray(data.results) ? data.results.slice(0, 8) : [];

      // Resolve external_ids in parallel to get the IMDb id for each candidate.
      const results = await Promise.all(raw.map(async (row) => {
        const tmdbId = row.id;
        const title = row.title || row.name || '';
        const original = row.original_title || row.original_name || '';
        const dateStr = row.release_date || row.first_air_date || '';
        const year = (dateStr && /^\d{4}/.test(dateStr)) ? dateStr.slice(0, 4) : '';
        const poster = row.poster_path ? `https://image.tmdb.org/t/p/w185${row.poster_path}` : null;
        let imdbId = null;
        try {
          const ext = await fetch(`${TMDB_BASE}/${tmdbType}/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`);
          if (ext.ok) {
            const j = await ext.json();
            if (j && j.imdb_id && /^tt\d+$/.test(j.imdb_id)) imdbId = j.imdb_id;
          }
        } catch (_) {}
        return { tmdbId, imdbId, title, original, year, poster, type };
      }));

      tmdbCache.set(cacheKey, { ts: Date.now(), results });
      return res.json({ ok: true, results });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  // ---- Settings page ----
  router.get('/torbox/:userId/settings', async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.type('html').send(renderSettingsPage());
  });

  router.get('/torbox/:userId/settings/data', async (req, res) => {
    try {
      const profile = await getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ error: 'Profilo non trovato' });
      const base = getBaseUrl(req);
      return res.json({
        ok: true,
        settings: {
          catalog_mode: profile.catalog_mode || 'full',
          catalog_source: profile.catalog_source || 'both-merged',
          catalog_sort_casts: profile.catalog_sort_casts || 'recent',
          catalog_sort_library: profile.catalog_sort_library || 'recent',
          include_library_streams: profile.include_library_streams !== false,
          stream_order: profile.stream_order || 'cast-first',
          stream_sort: profile.stream_sort || 'size-desc',
          show_uncached_library: profile.show_uncached_library !== false,
          movie_max_size_gb: Number(profile.movie_max_size_gb || 0),
          episode_max_size_gb: Number(profile.episode_max_size_gb || 0),
          aiostreams_mode: profile.aiostreams_mode === true
        },
        username: profile.username,
        manifestUrlFull: `${base}/torbox/${encodeURIComponent(req.params.userId)}/manifest.json`,
        manifestUrlNoCatalog: `${base}/torbox/${encodeURIComponent(req.params.userId)}/no-catalog/manifest.json`
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });

  router.post('/torbox/:userId/settings', async (req, res) => {
    try {
      const profile = await getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ error: 'Profilo non trovato' });
      const body = req.body || {};
      const upd = {};
      if (typeof body.catalog_mode === 'string' && ['full','off'].includes(body.catalog_mode)) upd.catalog_mode = body.catalog_mode;
      if (typeof body.catalog_source === 'string' && ['casts','library','both-merged','both-split'].includes(body.catalog_source)) upd.catalog_source = body.catalog_source;
      if (typeof body.catalog_sort_casts === 'string' && ['recent','oldest','biggest','smallest'].includes(body.catalog_sort_casts)) upd.catalog_sort_casts = body.catalog_sort_casts;
      if (typeof body.catalog_sort_library === 'string' && ['recent','oldest','biggest','smallest'].includes(body.catalog_sort_library)) upd.catalog_sort_library = body.catalog_sort_library;
      if (typeof body.include_library_streams === 'boolean') upd.include_library_streams = body.include_library_streams;
      if (typeof body.stream_order === 'string' && ['cast-first','library-first','mixed'].includes(body.stream_order)) upd.stream_order = body.stream_order;
      if (typeof body.stream_sort === 'string' && ['size-desc','size-asc','quality'].includes(body.stream_sort)) upd.stream_sort = body.stream_sort;
      if (typeof body.show_uncached_library === 'boolean') upd.show_uncached_library = body.show_uncached_library;
      if (typeof body.aiostreams_mode === 'boolean') upd.aiostreams_mode = body.aiostreams_mode;
      if (body.movie_max_size_gb !== undefined) upd.movie_max_size_gb = Number(body.movie_max_size_gb) || 0;
      if (body.episode_max_size_gb !== undefined) upd.episode_max_size_gb = Number(body.episode_max_size_gb) || 0;
      const updated = await updateProfileSettings(req.params.userId, upd);
      return res.json({ ok: true, profile: { user_id: updated.user_id, ...upd } });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });

  return router;
}

module.exports = { createRouter };
