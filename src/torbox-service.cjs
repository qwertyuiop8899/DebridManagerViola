const TORBOX_API_BASE = process.env.TORBOX_API_BASE || 'https://api.torbox.app/v1/api';

function parseTorboxPayload(data) {
  return data && data.data ? data.data : data;
}

function parseJsonMaybe(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch (_) {
    return { raw: text };
  }
}

async function torboxFetch(path, apiKey, options = {}) {
  const response = await fetch(`${TORBOX_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const data = parseJsonMaybe(text);

  if (!response.ok) {
    const message = data && (data.error || data.message) ? (data.error || data.message) : `TorBox HTTP ${response.status}`;
    try {
      const bodyPreview = (options && options.body) ? String(options.body).slice(0, 240) : '';
      const respPreview = (text || '').slice(0, 280);
      console.error(`[TB ERR] ${options.method || 'GET'} ${path} -> ${response.status} ${message} | req=${bodyPreview} | resp=${respPreview}`);
    } catch (_) {}
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function getUserMe(apiKey) {
  return torboxFetch('/user/me', apiKey);
}

async function validateApiKey(apiKey) {
  const data = await getUserMe(apiKey);
  const email = data && data.data && data.data.email;
  if (!email) throw new Error('TorBox API key validata ma email non trovata');
  return { email, raw: data };
}

async function checkCached(infoHash, apiKey) {
  return torboxFetch(`/torrents/checkcached?hash=${encodeURIComponent(infoHash)}`, apiKey);
}

async function createTorrent(infoHash, apiKey) {
  const magnet = `magnet:?xt=urn:btih:${infoHash}`;
  const form = new FormData();
  form.append('magnet', magnet);
  return torboxFetch('/torrents/createtorrent', apiKey, {
    method: 'POST',
    body: form
  });
}

async function getTorrentInfo(torrentId, apiKey) {
  // Returns the torrent (with `files` array). bypass_cache=true to get fresh data after createtorrent.
  const data = await torboxFetch(`/torrents/mylist?id=${encodeURIComponent(torrentId)}&bypass_cache=true`, apiKey);
  const payload = parseTorboxPayload(data);
  return payload || null;
}

// Lists the full TorBox library for a user. /torrents/mylist returns at most
// 1000 items per call, so we paginate with limit+offset until a short page comes
// back. Keeps a hard cap so an API bug can't loop forever.
async function listMyTorrents(apiKey) {
  const PAGE = 1000;
  const MAX_PAGES = 50; // safety: up to 50k torrents
  const out = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE;
    const data = await torboxFetch(
      `/torrents/mylist?bypass_cache=true&limit=${PAGE}&offset=${offset}`,
      apiKey
    );
    const payload = parseTorboxPayload(data);
    const items = Array.isArray(payload)
      ? payload
      : (payload && Array.isArray(payload.torrents) ? payload.torrents : []);
    if (items.length === 0) break;
    out.push(...items);
    if (items.length < PAGE) break;
  }
  return out;
}

function pickBestVideoFileId(torrent) {
  if (!torrent || !Array.isArray(torrent.files) || torrent.files.length === 0) return null;
  const videoRe = /\.(mkv|mp4|avi|mov|m4v|webm|ts|wmv)$/i;
  const sampleRe = /sample|trailer|extra|featurette/i;
  const candidates = torrent.files.filter((f) => {
    const name = String(f?.name || f?.short_name || f?.path || '');
    if (sampleRe.test(name)) return false;
    return videoRe.test(name);
  });
  const pool = candidates.length ? candidates : torrent.files.slice();
  pool.sort((a, b) => Number(b?.size || 0) - Number(a?.size || 0));
  const best = pool[0];
  if (!best) return null;
  return best.id ?? best.file_id ?? null;
}

async function requestDownloadLink(torrentId, fileId, apiKey) {
  if (!torrentId) throw new Error('torrent_id mancante per requestdl TorBox');
  // TorBox /torrents/requestdl REQUIRES the API key as `token` query param.
  // The Authorization header alone returns HTTP 422.
  const params = new URLSearchParams({
    token: apiKey,
    torrent_id: String(torrentId)
  });
  if (fileId !== undefined && fileId !== null && String(fileId) !== '') {
    params.set('file_id', String(fileId));
  }

  const response = await fetch(`${TORBOX_API_BASE}/torrents/requestdl?${params.toString()}`, {
    redirect: 'manual',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json'
    }
  });

  const location = response.headers.get('location');
  if (location && response.status >= 300 && response.status < 400) {
    return { url: location, expiresAt: null, raw: null };
  }

  const text = await response.text();
  const data = parseJsonMaybe(text);

  if (!response.ok) {
    const message = data && (data.error || data.message) ? (data.error || data.message) : `TorBox HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  const payload = parseTorboxPayload(data);
  // TorBox /torrents/requestdl returns { success, detail, data: "<url>" }, so payload is a string.
  // Do NOT use payload?.link on a string: String.prototype.link is the legacy <a> helper and would
  // be returned as a function reference, which then becomes "function link() { [native code] }".
  let url = null;
  if (typeof payload === 'string') {
    url = payload;
  } else if (payload && typeof payload === 'object') {
    url = payload.url || payload.download_url || (typeof payload.link === 'string' ? payload.link : null);
  }
  if (!url) throw new Error('TorBox non ha restituito un link di download');

  return {
    url,
    expiresAt: payload?.expires_at || payload?.expiresAt || null,
    raw: data
  };
}

// Control a torrent on TorBox: delete, stop_seeding, resume, reannounce.
// POST /torrents/controltorrent body { torrent_id, operation }
// NOTE: TorBox only accepts: reannounce, delete, resume, stop_seeding. 'pause' is NOT valid.
async function controlTorrent(torrentId, operation, apiKey) {
  if (!torrentId) throw new Error('torrent_id mancante');
  const op = String(operation || '').toLowerCase();
  if (!['delete', 'stop_seeding', 'resume', 'reannounce'].includes(op)) {
    throw new Error('operation non valida');
  }
  return torboxFetch('/torrents/controltorrent', apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ torrent_id: Number(torrentId) || torrentId, operation: op })
  });
}

module.exports = {
  getUserMe,
  validateApiKey,
  checkCached,
  createTorrent,
  getTorrentInfo,
  listMyTorrents,
  pickBestVideoFileId,
  requestDownloadLink,
  controlTorrent
};
