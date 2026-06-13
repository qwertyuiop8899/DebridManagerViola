function normalizePositiveInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function buildManifest(userId, baseUrl, username, options = {}) {
  const logo = baseUrl
    ? `${String(baseUrl).replace(/\/$/, '')}/logo.svg`
    : 'https://dmv.stremio-italia.eu/logo.svg';
  const safeUserId = String(userId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const displayName = username
    ? `DMV🟣 Cast ▶️ — ${username}`
    : `DMV🟣 Cast ▶️`;
  const catalogMode = options.catalogMode || 'full';
  const includeCatalog = catalogMode !== 'off';
  const source = options.catalogSource || 'both-merged'; // 'casts' | 'library' | 'both-merged' | 'both-split'
  const idSuffix = includeCatalog ? '' : '.nc';

  let catalogs = [];
  if (includeCatalog) {
    if (source === 'casts') {
      catalogs = [
        { type: 'movie', id: 'dmv-tb-movies-casts', name: 'DMV🟣 Cast — Film' },
        { type: 'series', id: 'dmv-tb-series-casts', name: 'DMV🟣 Cast — Serie TV' }
      ];
    } else if (source === 'library') {
      catalogs = [
        { type: 'movie', id: 'dmv-tb-movies-library', name: 'DMV🟣 Libreria — Film' },
        { type: 'series', id: 'dmv-tb-series-library', name: 'DMV🟣 Libreria — Serie TV' }
      ];
    } else if (source === 'both-split') {
      catalogs = [
        { type: 'movie', id: 'dmv-tb-movies-casts', name: 'DMV🟣 Cast — Film' },
        { type: 'movie', id: 'dmv-tb-movies-library', name: 'DMV🟣 Libreria — Film' },
        { type: 'series', id: 'dmv-tb-series-casts', name: 'DMV🟣 Cast — Serie TV' },
        { type: 'series', id: 'dmv-tb-series-library', name: 'DMV🟣 Libreria — Serie TV' }
      ];
    } else { // both-merged (default)
      catalogs = [
        { type: 'movie', id: 'dmv-tb-movies', name: 'DMV🟣 TorBox Film' },
        { type: 'series', id: 'dmv-tb-series', name: 'DMV🟣 TorBox Serie TV' }
      ];
    }
  }
  const resources = includeCatalog ? ['stream', 'catalog'] : ['stream'];
  return {
    id: `org.ilcorsaroviola.dmv.cast.torbox.${safeUserId}${idSuffix}`,
    version: '0.5.0',
    name: displayName,
    description: 'Casts e libreria TorBox personali, da IlCorsaroViola — Debrid Manager Viola',
    logo,
    icon: logo,
    resources,
    types: ['movie', 'series'],
    idPrefixes: ['tt'],
    catalogs,
    behaviorHints: {
      adult: false,
      p2p: false,
      configurable: false,
      configurationRequired: false
    }
  };
}

// Build a single Stremio meta entry for the catalog. Uses metahub for posters
// (same source as Stremio's own catalog so coverage is consistent).
function buildCatalogMeta(cast) {
  const imdbId = String(cast.imdb_id || '').trim();
  if (!imdbId) return null;
  const type = cast.type === 'series' ? 'series' : 'movie';
  return {
    id: imdbId,
    type,
    name: cast.title || cast.filename || imdbId,
    poster: `https://images.metahub.space/poster/medium/${imdbId}/img`,
    posterShape: 'poster',
    background: `https://images.metahub.space/background/medium/${imdbId}/img`,
    logo: `https://images.metahub.space/logo/medium/${imdbId}/img`
  };
}

function parseStremioId(type, id) {
  const parts = String(id || '').split(':');
  return {
    imdbId: parts[0],
    season: type === 'series' ? normalizePositiveInteger(parts[1]) : 0,
    episode: type === 'series' ? normalizePositiveInteger(parts[2]) : 0
  };
}

// Lite version of ICV's generateBingeGroup (api/index.js). Format kept identical so
// Stremio groups DMV casts with ICV streams for Auto-Play Next Episode.
// Extracts: resolution, HDR/DV tag, release group from the filename/title.
function generateBingeGroupLite(title, service) {
  if (!title) return `icv|${service}|unknown`;
  const t = String(title);

  const resMatch = t.match(/\b(2160p|1440p|1080p|720p|480p|360p)\b/i);
  const quality = resMatch ? resMatch[1].toLowerCase() : 'unknown';

  let hdr = 'SDR';
  const hasDV = /\b(DV|DoVi|Dolby[ .]?Vision)\b/i.test(t);
  const hasHDR10Plus = /\bHDR10\+/i.test(t);
  const hasHDR10 = /\bHDR10\b/i.test(t);
  const hasHDR = /\bHDR\b/i.test(t);
  if (hasDV) hdr = (hasHDR10Plus || hasHDR10 || hasHDR) ? 'DV-HDR' : 'DV';
  else if (hasHDR10Plus) hdr = 'HDR10+';
  else if (hasHDR10) hdr = 'HDR10';
  else if (hasHDR) hdr = 'HDR';

  // Release group: last "-GROUP" before extension (NTb, MeM, FLUX, K83, etc.)
  const groupMatch = t.match(/-([A-Za-z0-9]{2,})(?:\.[A-Za-z0-9]{2,4})?$/);
  const group = groupMatch ? groupMatch[1] : '';

  const parts = ['icv', service, quality, hdr];
  if (group) parts.push(group);
  return parts.join('|');
}

function formatBytesLite(bytes) {
  const n = Number(bytes) || 0;
  if (n <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)} ${units[i]}`;
}

function extractQualityLite(title) {
  const t = String(title || '');
  const m = t.match(/\b(2160p|1440p|1080p|720p|480p|360p)\b/i);
  if (m) return m[1];
  if (/\b(4K|UHD)\b/i.test(t)) return '2160p';
  return '';
}

// AIOStreams-compatible formatter (lives next to this file).
let aioFmt = null;
try { aioFmt = require('./aiostreams-formatter.cjs'); } catch (_) { aioFmt = null; }

function buildStreamFromCast(baseUrl, userId, cast, opts = {}) {
  const filename = cast.filename || cast.title || '';
  const cleanFilename = String(filename).split('/').pop() || filename;
  const sizeBytes = Number(cast.size) || 0;
  const sizeStr = formatBytesLite(sizeBytes);
  const quality = extractQualityLite(cleanFilename || cast.title) || 'Unknown';

  const t = opts.torrent;
  let finished = true;
  let pct = 0;
  let state = '';
  let seeds = 0;
  if (t) {
    state = String(t.download_state || '').toLowerCase();
    finished = t.download_finished || t.cached || /completed|seeding|cached|finished|uploading/.test(state);
    pct = Math.round((Number(t.progress) || 0) * 100);
    seeds = Number(t.seeds || 0);
  }

  let statusSymbol = '⚡';
  let statusHeader = '';
  if (!finished) {
    statusSymbol = (pct === 0 && seeds === 0 && state === 'stalled') ? '⏳ Stallo' : `⏳ ${pct}%`;
    statusHeader = (pct === 0 && seeds === 0 && state === 'stalled')
      ? `⚠️ TORRENT IN STALLO (0 seeders)\n`
      : `⏳ DOWNLOAD IN CORSO: ${pct}% (👥 ${seeds} seeders)\n`;
  }

  let streamName, title;
  if (opts.aioMode && aioFmt) {
    streamName = aioFmt.formatStreamName({ addonName: 'DMV🟣', service: 'torbox', cached: finished, quality });
    const epLabel = (cast.type === 'series' && cast.season && cast.episode)
      ? `S${String(cast.season).padStart(2,'0')}E${String(cast.episode).padStart(2,'0')}` : '';
    title = statusHeader + aioFmt.formatStreamTitle({
      title: cleanFilename || 'TorBox cast',
      size: sizeStr || undefined,
      source: 'TorBox cast',
      episodeTitle: epLabel || undefined,
      isPack: Boolean(epLabel)
    });
  } else {
    // Stream name: DMV🟣 Cast ▶️ [⚡]\n{quality} — ICV-style two lines.
    streamName = `DMV🟣 Cast ▶️ [${statusSymbol}]\n${quality}`;
    // Title: line1 filename (🎬), line2 size+TB indicator. Mirrors ICV's single-file format.
    const titleLine1 = cleanFilename ? `🎬 ${cleanFilename}` : '🎬 TorBox cast';
    const sizeLine = sizeStr ? `💾 ${sizeStr} · 📦 TorBox` : `📦 TorBox`;
    const epLine = (cast.type === 'series' && cast.season && cast.episode)
      ? `\n📺 S${String(cast.season).padStart(2,'0')}E${String(cast.episode).padStart(2,'0')}`
      : '';
    title = `${statusHeader}${titleLine1}\n${sizeLine}${epLine}`;
  }

  const stream = {
    name: streamName,
    title,
    url: `${baseUrl}/torbox/${encodeURIComponent(userId)}/play/${encodeURIComponent(cast.id)}`,
    behaviorHints: {
      bingeGroup: generateBingeGroupLite(cleanFilename || cast.title || '', 'tb'),
      notWebReady: false
    }
  };
  if (sizeBytes > 0) {
    stream.behaviorHints.videoSize = sizeBytes;
  }
  if (cleanFilename) {
    stream.behaviorHints.filename = cleanFilename;
  }
  return stream;
}

// Build a stream for a TorBox library file that is NOT yet stored as a cast.
// Resolution happens lazily via /lib-play/:torrentId/:fileId (or -1 for auto).
// `match` shape: { torrentId, infoHash, fileId, filename, size, type, season?, episode? }
function buildStreamFromLibrary(baseUrl, userId, match, opts = {}) {
  const filename = match.filename || '';
  const cleanFilename = String(filename).split('/').pop() || filename;
  const sizeBytes = Number(match.size) || 0;
  const sizeStr = formatBytesLite(sizeBytes);
  const quality = extractQualityLite(cleanFilename) || 'Unknown';

  const t = opts.torrent;
  let finished = true;
  let pct = 0;
  let state = '';
  let seeds = 0;
  if (t) {
    state = String(t.download_state || '').toLowerCase();
    finished = t.download_finished || t.cached || /completed|seeding|cached|finished|uploading/.test(state);
    pct = Math.round((Number(t.progress) || 0) * 100);
    seeds = Number(t.seeds || 0);
  }

  let statusSymbol = '⚡';
  let statusHeader = '';
  if (!finished) {
    statusSymbol = (pct === 0 && seeds === 0 && state === 'stalled') ? '⏳ Stallo' : `⏳ ${pct}%`;
    statusHeader = (pct === 0 && seeds === 0 && state === 'stalled')
      ? `⚠️ TORRENT IN STALLO (0 seeders)\n`
      : `⏳ DOWNLOAD IN CORSO: ${pct}% (👥 ${seeds} seeders)\n`;
  }

  let streamName, title;
  if (opts.aioMode && aioFmt) {
    streamName = aioFmt.formatStreamName({ addonName: 'DMV🟣', service: 'torbox', cached: finished, quality });
    const epLabel = (match.type === 'series' && match.season && match.episode)
      ? `S${String(match.season).padStart(2,'0')}E${String(match.episode).padStart(2,'0')}` : '';
    title = statusHeader + aioFmt.formatStreamTitle({
      title: cleanFilename || 'TorBox library',
      size: sizeStr || undefined,
      source: 'TorBox library',
      episodeTitle: epLabel || undefined,
      isPack: Boolean(epLabel)
    });
  } else {
    streamName = `DMV🟣 Libreria ▶️ [${statusSymbol}]\n${quality}`;
    const titleLine1 = cleanFilename ? `🎬 ${cleanFilename}` : '🎬 TorBox library';
    const sizeLine = sizeStr ? `💾 ${sizeStr} · 📦 TorBox library` : `📦 TorBox library`;
    const epLine = (match.type === 'series' && match.season && match.episode)
      ? `\n📺 S${String(match.season).padStart(2,'0')}E${String(match.episode).padStart(2,'0')}`
      : '';
    title = `${statusHeader}${titleLine1}\n${sizeLine}${epLine}`;
  }

  const fileIdPart = match.fileId !== undefined && match.fileId !== null && match.fileId !== ''
    ? encodeURIComponent(String(match.fileId))
    : 'auto';

  const stream = {
    name: streamName,
    title,
    url: `${baseUrl}/torbox/${encodeURIComponent(userId)}/lib-play/${encodeURIComponent(String(match.torrentId))}/${fileIdPart}`,
    behaviorHints: {
      bingeGroup: generateBingeGroupLite(cleanFilename, 'tb'),
      notWebReady: false
    }
  };
  if (sizeBytes > 0) stream.behaviorHints.videoSize = sizeBytes;
  if (cleanFilename) stream.behaviorHints.filename = cleanFilename;
  return stream;
}

module.exports = {
  buildManifest,
  buildCatalogMeta,
  parseStremioId,
  buildStreamFromCast,
  buildStreamFromLibrary,
  extractQualityLite,
  generateBingeGroupLite,
  formatBytesLite
};
