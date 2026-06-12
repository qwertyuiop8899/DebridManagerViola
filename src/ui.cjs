function renderHomePage() {
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DMV Debrid Manager Viola</title>
  <link rel="icon" type="image/svg+xml" href="/logo.svg">
  <link rel="apple-touch-icon" href="/logo.svg">
  <meta name="theme-color" content="#a855f7">
  <style>
    :root {
      color-scheme: dark;
      --bg: #0a0014;
      --bg-2: #11071f;
      --panel: rgba(168,85,247,0.08);
      --panel-2: rgba(168,85,247,0.14);
      --text: #f5f3ff;
      --muted: #c4b5fd;
      --dim: #94a3b8;
      --line: rgba(168,85,247,0.25);
      --accent: #a855f7;
      --accent-2: #c084fc;
      --green: #34d399;
      --orange: #fbbf24;
      --red: #f87171;
    }
    * { box-sizing: border-box; }
    html, body { margin:0; min-height:100vh; }
    body {
      background:
        radial-gradient(1200px 600px at 50% -10%, rgba(168,85,247,0.18), transparent 70%),
        radial-gradient(800px 500px at 80% 120%, rgba(236,72,153,0.12), transparent 70%),
        var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 24px 16px 48px;
    }
    .wrap { max-width: 520px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 20px; }

    .logo { width: 96px; height: 96px; }
    h1 {
      margin: 0; font-size: 22px; font-weight: 750; color: #fff; text-align: center;
      display: flex; align-items: center; justify-content: center; gap: 10px;
    }
    .sub { color: var(--muted); font-size: 12.5px; text-align: center; margin-top: -8px; }

    .identity-bar {
      width: 100%;
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      padding: 10px 14px;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 10px;
      font-size: 13px;
    }
    .identity-bar .who { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width:0; }
    .identity-bar .who b { color: #fff; font-weight: 700; }
    .btn-logout {
      flex-shrink: 0;
      background: rgba(248,113,113,0.12);
      border: 1px solid rgba(248,113,113,0.4);
      color: #fecaca;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-logout:hover { background: rgba(248,113,113,0.2); }

    .grid-2 { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .grid-3 { width: 100%; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }

    .tile {
      display: flex; align-items: center; justify-content: center;
      gap: 8px; padding: 14px 10px;
      border: 2px solid var(--accent);
      background: rgba(168,85,247,0.15);
      color: #f3e8ff;
      border-radius: 10px;
      text-decoration: none;
      font-size: 13px; font-weight: 700;
      transition: background .15s;
      cursor: pointer;
      text-align: center;
    }
    .tile:hover { background: rgba(168,85,247,0.28); }
    .tile.green { border-color: #34d399; background: rgba(52,211,153,0.12); color: #d1fae5; }
    .tile.green:hover { background: rgba(52,211,153,0.22); }
    .tile.amber { border-color: #fbbf24; background: rgba(251,191,36,0.12); color: #fef3c7; }
    .tile.amber:hover { background: rgba(251,191,36,0.22); }
    .tile.blue { border-color: #60a5fa; background: rgba(96,165,250,0.12); color: #dbeafe; }
    .tile.blue:hover { background: rgba(96,165,250,0.22); }
    .tile.red { border-color: #f87171; background: rgba(248,113,113,0.12); color: #fee2e2; }
    .tile.red:hover { background: rgba(248,113,113,0.22); }

    .panel {
      width: 100%;
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 12px;
      padding: 14px;
    }
    .panel h2 { margin: 0 0 10px; font-size: 13px; font-weight: 800; color: var(--accent-2); letter-spacing: 0.4px; text-transform: uppercase; }

    .manifest-row { display: flex; gap: 8px; align-items: stretch; }
    .manifest-row input {
      flex: 1; min-width: 0;
      background: rgba(0,0,0,0.35);
      border: 1px solid var(--line);
      color: var(--text);
      padding: 9px 11px; border-radius: 8px;
      font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      outline: none;
    }
    .manifest-row input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(168,85,247,0.25); }
    .btn-mini {
      flex-shrink: 0;
      padding: 0 12px; border-radius: 8px;
      background: rgba(168,85,247,0.2);
      border: 1px solid var(--line);
      color: #fff; font-size: 12px; font-weight: 700; cursor: pointer;
      display: inline-flex; align-items: center; gap: 4px;
    }
    .btn-mini:hover { background: rgba(168,85,247,0.35); }
    .btn-mini.install { background: linear-gradient(135deg, #7c3aed, #ec4899); border: none; padding: 0 14px; }
    .btn-mini.install:hover { filter: brightness(1.1); }
    .btn-mini.install.alt { background: linear-gradient(135deg, rgba(124,58,237,0.55), rgba(168,85,247,0.45)); }

    .install-variant { display: grid; gap: 6px; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; background: rgba(0,0,0,0.25); }
    .install-variant + .install-variant { margin-top: 8px; }
    .install-variant .iv-label { display:flex; justify-content:space-between; align-items:center; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 800; color: var(--accent-2); }
    .install-variant .iv-label .iv-tag { color: var(--dim); font-weight: 600; letter-spacing: 0.2px; text-transform: none; font-size: 10.5px; }
    .install-variant.alt .iv-label { color: #cbd5e1; }
    .install-variant .iv-row { display:flex; gap:6px; align-items:stretch; }
    .install-variant .iv-row input { flex:1; min-width:0; background: rgba(0,0,0,0.4); border: 1px solid var(--line); color: var(--text); padding: 7px 9px; border-radius: 7px; font-size: 11px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; outline:none; }
    .install-variant .iv-row input:focus { border-color: var(--accent); }
    .install-variant .iv-row .btn-mini { padding: 0 10px; font-size: 11.5px; }

    .cast-list { display: grid; gap: 8px; }
    .cast-row {
      display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center;
      padding: 10px 12px;
      background: rgba(0,0,0,0.25);
      border: 1px solid var(--line);
      border-radius: 8px;
    }
    .cast-title {
      font-weight: 700; font-size: 13px; color: #fff;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .cast-meta { margin-top: 2px; color: var(--muted); font-size: 11.5px; overflow-wrap: anywhere; }
    .cast-row .danger {
      background: rgba(248,113,113,0.12);
      border: 1px solid rgba(248,113,113,0.4);
      color: #fecaca;
      padding: 6px 10px; border-radius: 6px;
      font-size: 11px; font-weight: 700; cursor: pointer;
    }
    .cast-row .danger:hover { background: rgba(248,113,113,0.22); }

    .status { font-size: 12px; color: var(--dim); min-height: 16px; margin-top: 8px; overflow-wrap: anywhere; }
    .status.ok { color: var(--green); }
    .status.err { color: var(--red); }

    .footer-note { color: var(--dim); font-size: 11.5px; text-align: center; padding: 4px 8px; }
    .footer-note a { color: var(--accent-2); }

    .toast {
      position: fixed; left: 50%; transform: translateX(-50%); bottom: 24px;
      background: rgba(0,0,0,0.85);
      border: 1px solid var(--line);
      color: #fff;
      padding: 10px 16px; border-radius: 10px;
      font-size: 13px; z-index: 9999;
      opacity: 0; pointer-events: none; transition: opacity .2s;
    }
    .toast.show { opacity: 1; }
    .toast.ok { border-color: rgba(52,211,153,0.5); }
    .toast.err { border-color: rgba(248,113,113,0.5); }

    @media (max-width: 480px) {
      .grid-3 { grid-template-columns: 1fr 1fr; }
      h1 { font-size: 19px; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <!-- Cast icon (Lucide-style, viola) -->
    <svg class="logo" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M2 16.1A5 5 0 0 1 5.9 20"/>
      <path d="M2 12.05A9 9 0 0 1 9.95 20"/>
      <path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/>
      <line x1="2" y1="20" x2="2.01" y2="20"/>
    </svg>
    <h1>DMV<span style="color:#a855f7;">🟣</span> Cast <span style="color:#a855f7;">▶️</span></h1>
    <div class="sub">Debrid Manager Viola · cast personali su TorBox per Stremio</div>

    <div class="identity-bar" id="identityBar" hidden>
      <div class="who">User: <b id="identUser"></b> · TB *<span id="identKey"></span></div>
      <button class="btn-logout" id="btnLogout" type="button">Esci</button>
    </div>

    <div class="panel" id="authPanel" hidden>
      <h2>🔑 Accedi</h2>
      <div class="tabs" role="tablist" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;background:rgba(0,0,0,0.3);padding:4px;border-radius:10px;border:1px solid var(--line);margin-bottom:14px;">
        <div class="tab" data-tab="user" role="tab" style="padding:9px 6px;text-align:center;font-size:12.5px;font-weight:700;color:var(--muted);border-radius:7px;cursor:pointer;">👤 Username + Password</div>
        <div class="tab tab-active" data-tab="key" role="tab" style="padding:9px 6px;text-align:center;font-size:12.5px;font-weight:700;color:#fff;border-radius:7px;cursor:pointer;background:linear-gradient(135deg,#7c3aed,#ec4899);">🔑 API Key</div>
      </div>
      <form id="loginUserForm" data-pane="user" style="display:none;gap:10px;">
        <label style="display:block;color:var(--muted);font-size:11.5px;text-transform:uppercase;letter-spacing:0.4px;font-weight:700;">Username
          <input id="loginUsername" autocomplete="username" style="margin-top:6px;width:100%;height:42px;background:rgba(0,0,0,0.35);border:1px solid var(--line);border-radius:8px;color:var(--text);padding:0 11px;font:inherit;outline:none;">
        </label>
        <label style="display:block;color:var(--muted);font-size:11.5px;text-transform:uppercase;letter-spacing:0.4px;font-weight:700;">Password
          <input id="loginPassword" type="password" autocomplete="current-password" style="margin-top:6px;width:100%;height:42px;background:rgba(0,0,0,0.35);border:1px solid var(--line);border-radius:8px;color:var(--text);padding:0 11px;font:inherit;outline:none;">
        </label>
        <button type="submit" style="height:44px;border:0;border-radius:9px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;font:inherit;font-weight:800;cursor:pointer;">Entra</button>
        <div class="status" id="loginUserStatus"></div>
      </form>
      <form id="loginKeyForm" data-pane="key" style="display:grid;gap:10px;">
        <label style="display:block;color:var(--muted);font-size:11.5px;text-transform:uppercase;letter-spacing:0.4px;font-weight:700;">TorBox API Key
          <input id="loginApiKey" type="password" autocomplete="off" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" style="margin-top:6px;width:100%;height:42px;background:rgba(0,0,0,0.35);border:1px solid var(--line);border-radius:8px;color:var(--text);padding:0 11px;font:inherit;outline:none;">
        </label>
        <button type="submit" style="height:44px;border:0;border-radius:9px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;font:inherit;font-weight:800;cursor:pointer;">Entra</button>
        <div class="status" id="loginKeyStatus"></div>
      </form>
      <div style="margin-top:14px;color:var(--dim);font-size:12px;text-align:center;line-height:1.5;">
        Prima volta? Accedi con la <a href="https://torbox.app/settings?section=account" target="_blank" rel="noopener" style="color:#c084fc;font-weight:700;">TorBox API Key</a>:<br>ti verrà assegnato uno username, poi potrai impostare anche una password.
      </div>
    </div>

    <div class="panel" id="manifestPanel" hidden>
      <h2>📦 Installa l'addon su Stremio</h2>
      <div class="install-variant">
        <div class="iv-label"><span>⚡ Versione completa</span><span class="iv-tag">con cataloghi</span></div>
        <div class="iv-row">
          <input id="manifestUrlFull" readonly>
          <button id="copyManifestFull" class="btn-mini" type="button">Copia</button>
          <a id="installManifestFull" class="btn-mini install" href="#">Installa</a>
        </div>
      </div>
      <div class="install-variant alt">
        <div class="iv-label"><span>🔇 Versione no-catalog</span><span class="iv-tag">solo stream</span></div>
        <div class="iv-row">
          <input id="manifestUrlNC" readonly>
          <button id="copyManifestNC" class="btn-mini" type="button">Copia</button>
          <a id="installManifestNC" class="btn-mini install alt" href="#">Installa</a>
        </div>
      </div>
      <div class="status" id="manifestStatus"></div>
    </div>

    <div class="panel" id="gestisciPanel" hidden>
      <h2>🎮 Gestisci</h2>
      <div class="grid-2" id="navTiles">
        <a class="tile" id="navCast" href="/cast" style="background:linear-gradient(135deg,rgba(168,85,247,.28),rgba(236,72,153,.20));border-color:var(--accent-2)">📡 DMV Cast <span style="display:block;font-size:10.5px;font-weight:600;color:var(--muted);margin-top:2px;">cast singolo veloce</span></a>
        <a class="tile" id="navLibrary" href="#" style="background:linear-gradient(135deg,rgba(168,85,247,.22),rgba(124,58,237,.16));border-color:var(--accent-2)">📚 Libreria <span style="display:block;font-size:10.5px;font-weight:600;color:var(--muted);margin-top:2px;">torrent · cast salvati · auto</span></a>
        <a class="tile" id="navCatalog" href="#" style="background:linear-gradient(135deg,rgba(124,58,237,.22),rgba(168,85,247,.14));border-color:var(--accent)">🗂️ Catalogo <span style="display:block;font-size:10.5px;font-weight:600;color:var(--muted);margin-top:2px;">modalità · sorgente · ordine</span></a>
        <a class="tile" id="navSettings" href="#" style="background:linear-gradient(135deg,rgba(168,85,247,.18),rgba(124,58,237,.12));border-color:var(--accent)">⚙️ Impostazioni <span style="display:block;font-size:10.5px;font-weight:600;color:var(--muted);margin-top:2px;">stream · install · AIOStreams</span></a>
      </div>
    </div>

    <div class="grid-3" id="extraTiles" hidden>
      <a class="tile blue" id="navDb" href="/db" style="grid-column:1 / -1;">🗄️ Database <span style="display:block;font-size:11px;font-weight:600;color:var(--muted);margin-top:2px;">accesso diretto</span></a>
      <div style="grid-column:1 / -1;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <a class="tile green" href="https://icv.stremio-italia.eu/" target="_blank" rel="noopener" style="padding:18px 14px;font-size:14px;">🎥 ICV Addon</a>
        <a class="tile amber" href="https://torbox.app/settings?section=account" target="_blank" rel="noopener" style="padding:18px 14px;font-size:14px;">🔑 TorBox API</a>
      </div>
    </div>

    <div class="panel" id="credentialsPanel" hidden>
      <h2>🔐 Credenziali</h2>
      <p style="margin:0 0 10px;color:var(--dim);font-size:12px;">
        Assegna username e password per accedere senza l'API Key. Modificabili in qualsiasi momento.
      </p>
      <form id="credForm" style="display:grid;gap:10px;">
        <label style="display:block;color:var(--muted);font-size:11.5px;text-transform:uppercase;letter-spacing:0.4px;font-weight:700;">
          Username
          <input id="credUsername" type="text" autocomplete="username" minlength="3" maxlength="32" pattern="[a-zA-Z0-9_.\-]{3,32}" style="margin-top:6px;width:100%;height:40px;background:rgba(0,0,0,0.35);border:1px solid var(--line);border-radius:8px;color:var(--text);padding:0 11px;font:inherit;outline:none;">
        </label>
        <label style="display:block;color:var(--muted);font-size:11.5px;text-transform:uppercase;letter-spacing:0.4px;font-weight:700;">
          Nuova password (min 6 caratteri)
          <input id="credPassword" type="password" autocomplete="new-password" minlength="6" maxlength="128" placeholder="Lascia vuoto per non cambiare" style="margin-top:6px;width:100%;height:40px;background:rgba(0,0,0,0.35);border:1px solid var(--line);border-radius:8px;color:var(--text);padding:0 11px;font:inherit;outline:none;">
        </label>
        <label id="credCurrentWrap" style="display:none;color:var(--muted);font-size:11.5px;text-transform:uppercase;letter-spacing:0.4px;font-weight:700;">
          Password attuale
          <input id="credCurrent" type="password" autocomplete="current-password" style="margin-top:6px;width:100%;height:40px;background:rgba(0,0,0,0.35);border:1px solid var(--line);border-radius:8px;color:var(--text);padding:0 11px;font:inherit;outline:none;">
        </label>
        <label id="credApiKeyWrap" style="display:none;color:var(--muted);font-size:11.5px;text-transform:uppercase;letter-spacing:0.4px;font-weight:700;">
          Conferma con TorBox API Key (solo prima volta)
          <input id="credApiKey" type="password" autocomplete="off" placeholder="La tua TorBox API Key" style="margin-top:6px;width:100%;height:40px;background:rgba(0,0,0,0.35);border:1px solid var(--line);border-radius:8px;color:var(--text);padding:0 11px;font:inherit;outline:none;">
        </label>
        <button type="submit" style="height:40px;border:0;border-radius:8px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;font:inherit;font-weight:800;cursor:pointer;">Salva credenziali</button>
        <div class="status" id="credStatus"></div>
      </form>
    </div>

    <div class="panel" id="castsPanel" hidden>
      <h2 style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <span>🎬 Cast salvati</span>
        <span style="display:inline-flex;gap:6px;">
          <button id="refreshCasts" class="btn-mini" type="button" style="font-size:11px;padding:4px 10px;">↻</button>
          <button id="deleteAllCasts" class="btn-mini" type="button" title="Elimina tutti i cast salvati (i torrent restano su TorBox)" style="font-size:11px;padding:4px 10px;background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.35);color:#fecaca;">🗑️ Elimina tutti</button>
        </span>
      </h2>
      <div id="savedCasts" class="cast-list"></div>
      <div class="status" id="listStatus"></div>
    </div>

    <div class="footer-note">
      Apri il <a href="/db" target="_blank" rel="noopener">Database Manager (sola lettura)</a> e usa "Cast TB" su un torrent per aggiungerlo qui.
    </div>
    <div class="footer-note" style="font-size:10px;opacity:0.55;margin-top:6px;">build ${new Date().toISOString().replace('T',' ').slice(0,19)} UTC</div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    const $ = (id) => document.getElementById(id);
    const toast = $('toast');
    function showToast(msg, kind) {
      toast.textContent = msg;
      toast.className = 'toast show ' + (kind || '');
      clearTimeout(showToast._t);
      showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
    }
    function setStatus(el, msg, ok) {
      el.textContent = msg || '';
      el.className = ok === undefined ? 'status' : 'status ' + (ok ? 'ok' : 'err');
    }

    function buildInstallHref(manifestUrl) {
      if (!manifestUrl) return '#';
      // Stremio web/desktop accepts stremio:// scheme; protocol part stripped.
      // Avoid regex with escaped slashes — template literals collapse \/ to / and break it.
      const sep = manifestUrl.indexOf('://');
      const stripped = sep >= 0 ? manifestUrl.slice(sep + 3) : manifestUrl;
      return 'stremio://' + stripped;
    }

    async function copyToClipboard(text) {
      if (!text) return false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch (_) {}
      // Fallback for non-https or unsupported clipboard API.
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch (_) { return false; }
    }

    function applyProfile(data) {
      if (!data || !data.userId) return false;
      localStorage.setItem('dmvUserId', data.userId);
      if (data.manifestUrl) localStorage.setItem('dmvManifestUrl', data.manifestUrl);
      if (data.apiKeyLast4) localStorage.setItem('dmvApiKeyLast4', data.apiKeyLast4);
      if (data.username) localStorage.setItem('dmvUsername', data.username);
      paintIdentity(data);
      return true;
    }

    let currentProfile = null;

    function paintIdentity(p) {
      if (!p) return;
      const display = p.username || p.userId || '';
      const last4 = p.apiKeyLast4 || '????';
      $('identityBar').hidden = false;
      $('identUser').textContent = display;
      $('identKey').textContent = last4;
      $('manifestPanel').hidden = false;
      const manifestFull = p.manifestUrl || '';
      // Derive the no-catalog manifest by injecting /no-catalog before /manifest.json.
      // Avoid a regex (template literals collapse \/ to / and break the slash).
      let manifestNC = '';
      if (manifestFull) {
        const sfx = '/manifest.json';
        manifestNC = manifestFull.endsWith(sfx)
          ? manifestFull.slice(0, -sfx.length) + '/no-catalog/manifest.json'
          : manifestFull;
      }
      $('manifestUrlFull').value = manifestFull;
      $('installManifestFull').href = buildInstallHref(manifestFull);
      $('manifestUrlNC').value = manifestNC;
      $('installManifestNC').href = buildInstallHref(manifestNC);
      $('castsPanel').hidden = false;
      $('credentialsPanel').hidden = false;
      // Show the management + extras tiles only once authenticated
      $('gestisciPanel').hidden = false;
      $('extraTiles').hidden = false;
      // Tiles -> user-scoped routes
      if (p.userId) {
        const u = encodeURIComponent(p.userId);
        const libTile = $('navLibrary');     if (libTile)  libTile.href  = '/torbox/' + u + '/library';
        const catTile = $('navCatalog');     if (catTile)  catTile.href  = '/torbox/' + u + '/settings#catalogCard';
        const setTile = $('navSettings');    if (setTile)  setTile.href  = '/torbox/' + u + '/settings';
      }
      // Credentials form: prefill username; toggle currentPassword vs apiKey based on hasPassword.
      $('credUsername').value = p.username || '';
      $('credCurrentWrap').style.display = p.hasPassword ? 'block' : 'none';
      $('credApiKeyWrap').style.display = p.hasPassword ? 'none' : 'block';
    }

    async function renderIdentity() {
      const userId = localStorage.getItem('dmvUserId') || '';
      if (!userId) {
        // Not authenticated: show inline auth panel instead of redirecting.
        // The /login page still exists as fallback (e.g. for /cast deep links).
        showAuthPanel();
        return;
      }
      // Always refresh profile from server so identity bar, manifest URL and credentials
      // state reflect the latest DB state (and to detect a stale/deleted profile).
      try {
        const r = await fetch('/torbox/' + encodeURIComponent(userId) + '/profile');
        if (r.status === 404) {
          // Stale local userId: clear and show inline auth (no full reload).
          localStorage.removeItem('dmvUserId');
          localStorage.removeItem('dmvManifestUrl');
          localStorage.removeItem('dmvApiKeyLast4');
          localStorage.removeItem('dmvUsername');
          showAuthPanel();
          return;
        }
        const data = await r.json();
        if (!r.ok) {
          // Render with whatever we have locally so the page is not blank.
          paintIdentity({
            userId,
            username: localStorage.getItem('dmvUsername') || null,
            apiKeyLast4: localStorage.getItem('dmvApiKeyLast4') || '',
            manifestUrl: localStorage.getItem('dmvManifestUrl') || '',
            hasPassword: false
          });
          return;
        }
        currentProfile = data;
        if (data.username) localStorage.setItem('dmvUsername', data.username);
        if (data.apiKeyLast4) localStorage.setItem('dmvApiKeyLast4', data.apiKeyLast4);
        if (data.manifestUrl) localStorage.setItem('dmvManifestUrl', data.manifestUrl);
        paintIdentity(data);
        loadCasts();
      } catch (_) {
        paintIdentity({
          userId,
          username: localStorage.getItem('dmvUsername') || null,
          apiKeyLast4: localStorage.getItem('dmvApiKeyLast4') || '',
          manifestUrl: localStorage.getItem('dmvManifestUrl') || '',
          hasPassword: false
        });
        loadCasts();
      }
    }

    function logout() {
      localStorage.removeItem('dmvUserId');
      localStorage.removeItem('dmvManifestUrl');
      localStorage.removeItem('dmvApiKeyLast4');
      localStorage.removeItem('dmvUsername');
      // Stay on the same page and show inline auth instead of bouncing through /login.
      currentProfile = null;
      $('identityBar').hidden = true;
      $('manifestPanel').hidden = true;
      $('credentialsPanel').hidden = true;
      $('castsPanel').hidden = true;
      $('gestisciPanel').hidden = true;
      $('extraTiles').hidden = true;
      showAuthPanel();
      showToast('Disconnesso', 'ok');
      try { $('authPanel').scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_) {}
    }

    function showAuthPanel() {
      $('authPanel').hidden = false;
      // Default: API Key tab (first-time users need this; user+pwd only works after credentials are set).
      document.querySelectorAll('#authPanel .tab').forEach((t) => {
        const isKey = t.dataset.tab === 'key';
        t.classList.toggle('tab-active', isKey);
        t.style.background = isKey ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : '';
        t.style.color = isKey ? '#fff' : 'var(--muted)';
      });
      $('loginUserForm').style.display = 'none';
      $('loginKeyForm').style.display = 'grid';
    }

    function formatCast(cast) {
      const ep = cast.type === 'series' && cast.season && cast.episode
        ? ' · S' + String(cast.season).padStart(2,'0') + 'E' + String(cast.episode).padStart(2,'0')
        : '';
      const size = cast.size ? ' · ' + (Number(cast.size) / (1024 ** 3)).toFixed(2) + ' GB' : '';
      return {
        title: (cast.filename || cast.title || cast.info_hash || 'Cast TorBox'),
        meta: (cast.type || 'movie') + ep + ' · ' + (cast.imdb_id || '') + size
      };
    }

    function renderCasts(casts) {
      const wrap = $('savedCasts');
      wrap.innerHTML = '';
      if (!casts.length) {
        wrap.innerHTML = '<div class="status">Nessun cast salvato.</div>';
        return;
      }
      casts.forEach((cast) => {
        const info = formatCast(cast);
        const row = document.createElement('div');
        row.className = 'cast-row';
        const detail = document.createElement('div');
        detail.style.minWidth = '0';
        const t = document.createElement('div'); t.className = 'cast-title'; t.textContent = info.title; t.title = info.title;
        const m = document.createElement('div'); m.className = 'cast-meta'; m.textContent = info.meta;
        detail.append(t, m);
        const del = document.createElement('button');
        del.className = 'danger'; del.type = 'button'; del.textContent = 'Elimina';
        del.addEventListener('click', () => deleteCast(cast.id));
        row.append(detail, del);
        wrap.append(row);
      });
    }

    async function loadCasts() {
      const userId = localStorage.getItem('dmvUserId');
      if (!userId) return;
      setStatus($('listStatus'), 'Caricamento...');
      try {
        const r = await fetch('/torbox/' + encodeURIComponent(userId) + '/casts');
        const data = await r.json();
        if (!r.ok) return setStatus($('listStatus'), data.error || 'Errore lista cast', false);
        renderCasts(data.casts || []);
        setStatus($('listStatus'), data.casts && data.casts.length ? '' : 'Nessun cast salvato', undefined);
      } catch (e) {
        setStatus($('listStatus'), 'Errore di rete', false);
      }
    }

    async function deleteCast(castId) {
      const userId = localStorage.getItem('dmvUserId');
      if (!userId || !castId) return;
      if (!confirm('Eliminare questo cast?')) return;
      const r = await fetch('/torbox/' + encodeURIComponent(userId) + '/cast/' + encodeURIComponent(castId), { method: 'DELETE' });
      const data = await r.json();
      if (!r.ok) return showToast(data.error || 'Errore eliminazione', 'err');
      showToast('Cast eliminato', 'ok');
      loadCasts();
    }

    $('btnLogout').addEventListener('click', logout);
    $('refreshCasts').addEventListener('click', loadCasts);
    $('deleteAllCasts').addEventListener('click', async () => {
      const userId = localStorage.getItem('dmvUserId');
      if (!userId) return;
      if (!confirm('Eliminare TUTTI i cast salvati?\\n\\nI torrent resteranno nella tua libreria TorBox, ma Stremio non li vedrà più come stream DMV🟣 Cast.')) return;
      const btn = $('deleteAllCasts');
      const orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '⏳ Elimino...';
      try {
        const r = await fetch('/torbox/' + encodeURIComponent(userId) + '/casts', { method: 'DELETE' });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) { showToast(data.error || 'Errore eliminazione massiva', 'err'); return; }
        showToast('🧹 ' + (data.removed || 0) + ' cast eliminati', 'ok');
        loadCasts();
      } catch (e) {
        showToast('Errore di rete: ' + (e && e.message ? e.message : 'sconosciuto'), 'err');
      } finally {
        btn.disabled = false;
        btn.innerHTML = orig;
      }
    });

    // Inline auth panel handlers.
    document.querySelectorAll('#authPanel .tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const which = tab.dataset.tab;
        document.querySelectorAll('#authPanel .tab').forEach((t) => {
          const active = t === tab;
          t.classList.toggle('tab-active', active);
          t.style.background = active ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : '';
          t.style.color = active ? '#fff' : 'var(--muted)';
        });
        $('loginUserForm').style.display = which === 'user' ? 'grid' : 'none';
        $('loginKeyForm').style.display = which === 'key' ? 'grid' : 'none';
      });
    });

    async function inlineLogin(body, statusId) {
      setStatus($(statusId), 'Verifica in corso...');
      try {
        const r = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await r.json();
        if (!r.ok) return setStatus($(statusId), data.error || 'Errore login', false);
        if (data.userId) localStorage.setItem('dmvUserId', data.userId);
        if (data.manifestUrl) localStorage.setItem('dmvManifestUrl', data.manifestUrl);
        if (data.apiKeyLast4) localStorage.setItem('dmvApiKeyLast4', data.apiKeyLast4);
        if (data.username) localStorage.setItem('dmvUsername', data.username);
        setStatus($(statusId), 'OK!', true);
        $('authPanel').hidden = true;
        currentProfile = data;
        paintIdentity(data);
        loadCasts();
      } catch (_) {
        setStatus($(statusId), 'Errore di rete', false);
      }
    }

    $('loginUserForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const body = {
        username: $('loginUsername').value.trim(),
        password: $('loginPassword').value
      };
      if (!body.username || !body.password) return setStatus($('loginUserStatus'), 'Username e password obbligatori', false);
      inlineLogin(body, 'loginUserStatus');
    });

    $('loginKeyForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const body = { apiKey: $('loginApiKey').value.trim() };
      if (!body.apiKey) return setStatus($('loginKeyStatus'), 'Inserisci la API Key', false);
      inlineLogin(body, 'loginKeyStatus');
    });

    function wireManifestVariant(inputId, copyId, installId, label) {
      $(copyId).addEventListener('click', async () => {
        const url = $(inputId).value;
        const ok = await copyToClipboard(url);
        if (ok) showToast(label + ' copiato!', 'ok');
        else {
          $(inputId).focus();
          $(inputId).select();
          showToast('Premi ⌘C / Ctrl+C per copiare', 'err');
        }
      });
      $(installId).addEventListener('click', (e) => {
        if (!$(inputId).value) { e.preventDefault(); showToast('Manifest non disponibile', 'err'); }
      });
    }
    wireManifestVariant('manifestUrlFull', 'copyManifestFull', 'installManifestFull', 'Manifest completo');
    wireManifestVariant('manifestUrlNC',   'copyManifestNC',   'installManifestNC',   'Manifest no-catalog');

    document.getElementById('credForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const userId = localStorage.getItem('dmvUserId');
      if (!userId) return;
      const username = $('credUsername').value.trim();
      const password = $('credPassword').value;
      const currentPassword = $('credCurrent').value;
      const apiKey = $('credApiKey').value.trim();
      if (!username && !password) {
        return setStatus($('credStatus'), 'Inserisci almeno un username o una nuova password', false);
      }
      const hasPassword = currentProfile && currentProfile.hasPassword;
      if (hasPassword && !currentPassword) {
        return setStatus($('credStatus'), 'Inserisci la password attuale per modificare', false);
      }
      if (!hasPassword && !apiKey) {
        return setStatus($('credStatus'), 'Inserisci la TorBox API Key per confermare', false);
      }
      setStatus($('credStatus'), 'Salvataggio...');
      const body = {};
      if (username) body.username = username;
      if (password) body.password = password;
      if (currentPassword) body.currentPassword = currentPassword;
      if (apiKey) body.apiKey = apiKey;
      try {
        const r = await fetch('/torbox/' + encodeURIComponent(userId) + '/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await r.json();
        if (!r.ok) return setStatus($('credStatus'), data.error || 'Errore salvataggio', false);
        setStatus($('credStatus'), 'Credenziali salvate!', true);
        showToast('Credenziali aggiornate', 'ok');
        $('credPassword').value = '';
        $('credCurrent').value = '';
        $('credApiKey').value = '';
        if (data.username) localStorage.setItem('dmvUsername', data.username);
        // Refresh from server so paintIdentity reflects hasPassword / new username.
        renderIdentity();
      } catch (_) {
        setStatus($('credStatus'), 'Errore di rete', false);
      }
    });

    renderIdentity();
  </script>
</body>
</html>`;
}

const SHARED_STYLES = `
  :root {
    color-scheme: dark;
    --bg: #0f1115;
    --panel: #171a21;
    --panel-2: #1d222b;
    --text: #f2f4f8;
    --muted: #a9b0bd;
    --line: #2b3240;
    --accent: #7d5fff;
    --accent-2: #1fbf75;
    --danger: #ff6b6b;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  header {
    border-bottom: 1px solid var(--line);
    background: #12151b;
  }

  .wrap {
    width: min(640px, calc(100% - 32px));
    margin: 0 auto;
  }

  .topbar {
    min-height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  h1 { margin: 0; font-size: 20px; font-weight: 750; }
  h2 { margin: 0; font-size: 15px; font-weight: 700; }
  main { padding: 22px 0 40px; }

  section {
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--panel);
    overflow: hidden;
  }

  .section-head {
    padding: 14px 16px;
    border-bottom: 1px solid var(--line);
    background: var(--panel-2);
  }

  form, .content {
    padding: 16px;
    display: grid;
    gap: 12px;
  }

  label {
    display: grid;
    gap: 6px;
    color: var(--muted);
    font-size: 12px;
    font-weight: 650;
    text-transform: uppercase;
  }

  input {
    width: 100%;
    height: 42px;
    border: 1px solid var(--line);
    border-radius: 7px;
    background: #0f131a;
    color: var(--text);
    padding: 0 12px;
    font: inherit;
    outline: none;
  }

  input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(125, 95, 255, 0.18);
  }

  button {
    height: 44px;
    border: 0;
    border-radius: 7px;
    background: var(--accent);
    color: #fff;
    font: inherit;
    font-weight: 750;
    cursor: pointer;
    padding: 0 18px;
  }

  button[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .meta {
    padding: 12px 16px;
    display: grid;
    gap: 8px;
    border-bottom: 1px solid var(--line);
  }

  .meta-row {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 12px;
    color: var(--muted);
    font-size: 13px;
    overflow-wrap: anywhere;
  }

  .meta-row strong { color: var(--text); font-weight: 700; }

  .status {
    min-height: 22px;
    color: var(--muted);
    font-size: 13px;
    overflow-wrap: anywhere;
  }

  .status.ok { color: var(--accent-2); }
  .status.err { color: var(--danger); }

  .links {
    padding: 0 16px 16px;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .links a {
    color: var(--accent);
    text-decoration: none;
    font-size: 13px;
    font-weight: 650;
  }

  @media (max-width: 540px) {
    .meta-row { grid-template-columns: 1fr; gap: 2px; }
  }
`;

function renderLoginPage(returnUrl) {
  const safeReturn = JSON.stringify(returnUrl || '/');
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DMV · Login</title>
  <link rel="icon" type="image/svg+xml" href="/logo.svg">
  <link rel="apple-touch-icon" href="/logo.svg">
  <meta name="theme-color" content="#a855f7">
  <style>
    :root {
      color-scheme: dark;
      --bg: #0a0014;
      --text: #f5f3ff;
      --muted: #c4b5fd;
      --dim: #94a3b8;
      --line: rgba(168,85,247,0.25);
      --accent: #a855f7;
      --green: #34d399;
      --red: #f87171;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh;
      background:
        radial-gradient(1200px 600px at 50% -10%, rgba(168,85,247,0.18), transparent 70%),
        radial-gradient(800px 500px at 80% 120%, rgba(236,72,153,0.12), transparent 70%),
        var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex; align-items: center; justify-content: center;
      padding: 24px 16px;
    }
    .card {
      width: 100%; max-width: 420px;
      border: 1px solid var(--line);
      background: rgba(168,85,247,0.08);
      border-radius: 14px;
      padding: 22px;
      backdrop-filter: blur(10px);
    }
    .logo-row { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px; }
    .logo-row svg { width: 56px; height: 56px; }
    h1 { margin: 0; font-size: 19px; font-weight: 800; text-align: center; }
    .sub { color: var(--muted); font-size: 12.5px; text-align: center; margin: 4px 0 18px; }
    .tabs {
      display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
      background: rgba(0,0,0,0.3);
      padding: 4px; border-radius: 10px;
      border: 1px solid var(--line);
      margin-bottom: 16px;
    }
    .tab {
      padding: 9px 6px;
      text-align: center;
      font-size: 12.5px; font-weight: 700;
      color: var(--muted);
      border-radius: 7px;
      cursor: pointer;
      transition: background .15s;
      user-select: none;
    }
    .tab.active {
      background: linear-gradient(135deg, #7c3aed, #ec4899);
      color: #fff;
    }
    .tab:not(.active):hover { background: rgba(168,85,247,0.15); }
    label { display: block; color: var(--muted); font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; margin: 10px 0 6px; }
    input {
      width: 100%; height: 42px;
      border: 1px solid var(--line);
      background: rgba(0,0,0,0.35);
      color: var(--text);
      padding: 0 12px; border-radius: 9px;
      font: inherit; outline: none;
    }
    input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(168,85,247,0.25); }
    button {
      width: 100%; height: 44px;
      border: 0; border-radius: 9px;
      background: linear-gradient(135deg, #7c3aed, #ec4899);
      color: #fff; font: inherit; font-weight: 800; cursor: pointer;
      margin-top: 14px;
    }
    button:hover { filter: brightness(1.08); }
    .status { min-height: 18px; font-size: 12.5px; color: var(--dim); margin-top: 10px; overflow-wrap: anywhere; }
    .status.ok { color: var(--green); }
    .status.err { color: var(--red); }
    .help { color: var(--dim); font-size: 12px; text-align: center; margin-top: 14px; line-height: 1.5; }
    .help a { color: #c084fc; font-weight: 700; }
    .pane { display: none; }
    .pane.active { display: block; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-row">
      <svg viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M2 16.1A5 5 0 0 1 5.9 20"/>
        <path d="M2 12.05A9 9 0 0 1 9.95 20"/>
        <path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/>
        <line x1="2" y1="20" x2="2.01" y2="20"/>
      </svg>
    </div>
    <h1>DMV🟣 Cast ▶️</h1>
    <div class="sub">Accedi con username + password oppure con la TorBox API Key</div>

    <div class="tabs" role="tablist">
      <div class="tab" data-tab="user" role="tab">👤 Username + Password</div>
      <div class="tab active" data-tab="key" role="tab">🔑 API Key</div>
    </div>

    <form id="userForm" class="pane">
      <label for="username">Username</label>
      <input id="username" name="username" autocomplete="username">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password">
      <button type="submit">Entra</button>
      <div id="userStatus" class="status"></div>
    </form>

    <form id="keyForm" class="pane active">
      <label for="apikey">TorBox API Key</label>
      <input id="apikey" name="apiKey" type="password" autocomplete="off" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
      <button type="submit">Entra</button>
      <div id="keyStatus" class="status"></div>
    </form>

    <div class="help">
      Prima volta? Accedi con la <a href="https://torbox.app/settings?section=account" target="_blank" rel="noopener">TorBox API Key</a>:<br>
      ti verrà assegnato uno username, poi potrai impostare anche una password personale.
    </div>
  </div>
  <script>
    const RETURN_URL = ${safeReturn};

    function setStatus(elId, msg, ok) {
      const el = document.getElementById(elId);
      el.textContent = msg || '';
      el.className = ok === undefined ? 'status' : 'status ' + (ok ? 'ok' : 'err');
    }

    function applyLoginResponse(data) {
      localStorage.setItem('dmvUserId', data.userId);
      if (data.manifestUrl) localStorage.setItem('dmvManifestUrl', data.manifestUrl);
      if (data.apiKeyLast4) localStorage.setItem('dmvApiKeyLast4', data.apiKeyLast4);
      if (data.username) localStorage.setItem('dmvUsername', data.username);
    }

    document.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
        const which = tab.dataset.tab;
        document.getElementById('userForm').classList.toggle('active', which === 'user');
        document.getElementById('keyForm').classList.toggle('active', which === 'key');
      });
    });

    async function postLogin(body, statusId) {
      setStatus(statusId, 'Verifica in corso...');
      try {
        const r = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await r.json();
        if (!r.ok) return setStatus(statusId, data.error || 'Errore login', false);
        applyLoginResponse(data);
        setStatus(statusId, 'OK, reindirizzamento...', true);
        setTimeout(() => { location.href = RETURN_URL; }, 300);
      } catch (_) {
        setStatus(statusId, 'Errore di rete', false);
      }
    }

    document.getElementById('userForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const body = {
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value
      };
      if (!body.username || !body.password) return setStatus('userStatus', 'Username e password obbligatori', false);
      postLogin(body, 'userStatus');
    });

    document.getElementById('keyForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const body = { apiKey: document.getElementById('apikey').value.trim() };
      if (!body.apiKey) return setStatus('keyStatus', 'Inserisci la API Key', false);
      postLogin(body, 'keyStatus');
    });
  </script>
</body>
</html>`;
}

function renderCastPage() {
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DMV🟣 Cast ▶️ · TorBox</title>
  <link rel="icon" type="image/svg+xml" href="/logo.svg">
  <link rel="apple-touch-icon" href="/logo.svg">
  <meta name="theme-color" content="#a855f7">
  <style>
    :root {
      color-scheme: dark;
      --bg: #0a0014;
      --text: #f5f3ff;
      --muted: #c4b5fd;
      --dim: #94a3b8;
      --line: rgba(168,85,247,0.25);
      --accent: #a855f7;
      --green: #34d399;
      --red: #f87171;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh;
      background:
        radial-gradient(1200px 600px at 50% -10%, rgba(168,85,247,0.18), transparent 70%),
        radial-gradient(800px 500px at 80% 120%, rgba(236,72,153,0.12), transparent 70%),
        var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 24px 16px;
    }
    .wrap { max-width: 560px; margin: 0 auto; }
    .logo-row { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px; }
    .logo { width: 48px; height: 48px; }
    h1 { margin: 0; font-size: 22px; font-weight: 800; text-align: center; letter-spacing: -0.3px; }
    .sub { color: var(--muted); font-size: 12.5px; text-align: center; margin: 4px 0 18px; }
    .identity-bar {
      display:flex; align-items:center; justify-content:space-between;
      padding: 9px 14px; margin-bottom: 14px;
      background: rgba(168,85,247,0.08);
      border: 1px solid var(--line); border-radius: 10px;
      font-size: 12.5px; color: var(--muted);
    }
    .identity-bar b { color: var(--text); font-weight: 700; }
    .panel {
      background: rgba(168,85,247,0.08);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 18px;
      margin-bottom: 14px;
      backdrop-filter: blur(10px);
    }
    .panel h2 { margin: 0 0 12px; font-size: 16px; font-weight: 800; }
    .meta-row {
      display: grid; grid-template-columns: 92px 1fr; gap: 10px;
      padding: 7px 0; border-bottom: 1px dashed rgba(168,85,247,0.15);
      font-size: 13px; overflow-wrap: anywhere;
    }
    .meta-row:last-child { border-bottom: 0; }
    .meta-row strong { color: var(--muted); font-weight: 700; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.4px; align-self:center; }
    .meta-row span { color: var(--text); }
    .meta-row .hash { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11.5px; color: var(--dim); }
    .cast-btn {
      width: 100%; height: 52px;
      border: 0; border-radius: 11px;
      background: linear-gradient(135deg, #7c3aed, #ec4899);
      color: #fff; font: inherit; font-size: 15px; font-weight: 800; cursor: pointer;
      margin-top: 4px;
      letter-spacing: 0.2px;
      box-shadow: 0 8px 24px rgba(168,85,247,0.25);
    }
    .cast-btn:hover:not([disabled]) { filter: brightness(1.08); }
    .cast-btn[disabled] { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
    .status {
      min-height: 18px; font-size: 13px; color: var(--dim);
      margin-top: 12px; text-align: center; overflow-wrap: anywhere; line-height: 1.5;
    }
    .status.ok { color: var(--green); font-weight: 700; }
    .status.err { color: var(--red); }
    .links { display: grid; gap: 8px; margin-top: 14px; }
    .links a {
      display: block; padding: 12px;
      background: rgba(168,85,247,0.12);
      border: 1px solid var(--line);
      border-radius: 9px;
      color: var(--text); text-decoration: none;
      font-size: 13.5px; font-weight: 700; text-align: center;
    }
    .links a:hover { background: rgba(168,85,247,0.2); }
    .links a.install { background: linear-gradient(135deg, #7c3aed, #ec4899); border-color: transparent; }
    .footer-note { color: var(--dim); font-size: 11.5px; text-align: center; margin-top: 14px; }
    .footer-note a { color: #c084fc; font-weight: 700; }
    /* Search panel */
    .search-row { display:grid; grid-template-columns:1fr auto; gap:8px; }
    .search-row input[type=text] {
      height:42px; padding:0 12px; border-radius:10px; border:1px solid var(--line);
      background:rgba(10,0,20,0.5); color:var(--text); font:inherit; font-size:14px;
    }
    .search-row input[type=text]:focus { outline:2px solid var(--accent); }
    .search-row button {
      height:42px; padding:0 16px; border:0; border-radius:10px; color:#fff; font:inherit; font-weight:700; cursor:pointer;
      background:linear-gradient(135deg,#7c3aed,#ec4899);
    }
    .filters {
      display:grid; grid-template-columns:repeat(2,1fr); gap:6px; margin-top:8px;
    }
    .filters select {
      height:36px; padding:0 8px; border-radius:8px; border:1px solid var(--line);
      background:rgba(10,0,20,0.5); color:var(--text); font:inherit; font-size:12.5px;
    }
    .res-list { display:grid; gap:8px; margin-top:14px; max-height:60vh; overflow-y:auto; }
    .res-row {
      display:grid; grid-template-columns:1fr auto; gap:10px; padding:10px 12px;
      background:rgba(168,85,247,0.08); border:1px solid var(--line); border-radius:10px;
      cursor:pointer; transition:background .15s;
    }
    .res-row:hover { background:rgba(168,85,247,0.18); }
    .res-title { font-size:13.5px; font-weight:700; overflow-wrap:anywhere; line-height:1.3; }
    .res-meta { font-size:11px; color:var(--muted); margin-top:3px; display:flex; flex-wrap:wrap; gap:6px; }
    .res-badge {
      display:inline-block; padding:1px 7px; border-radius:6px; font-size:10.5px; font-weight:700;
      background:rgba(168,85,247,0.18); color:var(--muted);
    }
    .res-badge.tb { background:rgba(52,211,153,.18); color:#a7f3d0; }
    .res-badge.series { background:rgba(236,72,153,.18); color:#fbcfe8; }
    .res-go {
      align-self:center; padding:6px 12px; border:0; border-radius:8px; color:#fff; font:inherit; font-weight:700; font-size:12px;
      background:linear-gradient(135deg,#7c3aed,#ec4899); cursor:pointer; white-space:nowrap;
    }
    .ep-picker { display:none; grid-template-columns:1fr 1fr auto; gap:6px; margin-top:8px; }
    .ep-picker input {
      height:34px; padding:0 8px; border-radius:8px; border:1px solid var(--line);
      background:rgba(10,0,20,0.5); color:var(--text); font:inherit; font-size:13px;
    }
    .ep-picker button {
      height:34px; padding:0 12px; border:0; border-radius:8px; color:#fff; font:inherit; font-weight:700; cursor:pointer;
      background:linear-gradient(135deg,#7c3aed,#ec4899); font-size:12px;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="logo-row">
      <svg class="logo" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M2 16.1A5 5 0 0 1 5.9 20"/>
        <path d="M2 12.05A9 9 0 0 1 9.95 20"/>
        <path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/>
        <line x1="2" y1="20" x2="2.01" y2="20"/>
      </svg>
      <h1>DMV<span style="color:#a855f7;">🟣</span> Cast <span style="color:#a855f7;">▶️</span></h1>
    </div>
    <div class="sub">Cast personale TorBox per Stremio</div>

    <div class="identity-bar">
      <span>User: <b id="identUser">…</b></span>
      <a href="/" style="color:#c084fc;text-decoration:none;font-weight:700;font-size:12px;">⬅ Manager</a>
    </div>

    <!-- LOGIN MODE: shown when no dmvUserId in localStorage -->
    <div class="panel" id="loginNotice" hidden>
      <h2>🔐 Login richiesto</h2>
      <p style="margin:6px 0 12px;color:var(--muted);font-size:13.5px;line-height:1.5;">
        Per cercare e castare titoli devi prima fare login.
      </p>
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        <button type="button" id="tabUser" class="cast-btn" style="height:36px;font-size:12px;flex:1;">👤 Username</button>
        <button type="button" id="tabKey" class="cast-btn" style="height:36px;font-size:12px;flex:1;opacity:0.55;">🔑 API Key</button>
      </div>
      <form id="loginUserForm" style="display:grid;gap:8px;">
        <input id="liUser" type="text" placeholder="Username" autocomplete="username" style="height:38px;padding:0 12px;border-radius:9px;border:1px solid var(--line);background:rgba(10,0,20,0.5);color:var(--text);font:inherit;font-size:13.5px;">
        <input id="liPass" type="password" placeholder="Password" autocomplete="current-password" style="height:38px;padding:0 12px;border-radius:9px;border:1px solid var(--line);background:rgba(10,0,20,0.5);color:var(--text);font:inherit;font-size:13.5px;">
        <button type="submit" class="cast-btn" style="height:44px;font-size:14px;">Accedi</button>
      </form>
      <form id="loginKeyForm" style="display:none;gap:8px;">
        <input id="liKey" type="password" placeholder="TorBox API key" autocomplete="off" style="height:38px;padding:0 12px;border-radius:9px;border:1px solid var(--line);background:rgba(10,0,20,0.5);color:var(--text);font:inherit;font-size:13.5px;">
        <button type="submit" class="cast-btn" style="height:44px;font-size:14px;">Accedi con API key</button>
      </form>
      <div class="status" id="loginStatus" style="margin-top:8px;text-align:left;"></div>
      <div style="margin-top:10px;font-size:11.5px;color:var(--dim);text-align:center;">
        Oppure <a href="/" style="color:#c084fc;font-weight:700;">vai al manager completo</a>.
      </div>
    </div>

    <!-- SEARCH MODE: when no full params, user can search the ICV torrent DB -->
    <div class="panel" id="searchPanel" hidden>
      <h2>🔎 Cerca nel database</h2>
      <form id="searchForm" autocomplete="off">
        <div class="search-row">
          <input id="sQuery" type="text" placeholder="Titolo, tt0000000, hash, magnet…" />
          <button type="submit">Cerca</button>
        </div>
        <div class="filters">
          <select id="sType">
            <option value="all">Tipo: tutti</option>
            <option value="movie">Film</option>
            <option value="series">Serie</option>
          </select>
          <select id="sCache">
            <option value="all">Cache: tutti</option>
            <option value="tb_cached">Solo TB ⚡</option>
            <option value="uncached">Non in cache</option>
          </select>
          <select id="sLang">
            <option value="all">Lingua: tutti</option>
            <option value="ita">Solo ITA</option>
          </select>
          <select id="sSort">
            <option value="seeders">Più seeders</option>
            <option value="date">Più recenti</option>
            <option value="size">Più grandi</option>
            <option value="title">Titolo A→Z</option>
          </select>
        </div>
      </form>
      <div class="status" id="searchStatus" style="text-align:left;margin-top:10px;"></div>
      <div class="res-list" id="searchResults"></div>
    </div>

    <!-- CONFIRM MODE: classic flow when full params already in URL -->
    <div id="confirmView" hidden>
      <div class="panel">
        <h2 id="castHeader">🎬 Dettagli</h2>
        <div id="castMeta"></div>
      </div>

      <div class="panel">
        <button id="castBtn" class="cast-btn" type="button">📡 Cast su TorBox</button>
        <div id="castStatus" class="status"></div>
      </div>

      <div class="links" id="castLinks" hidden>
        <a id="manifestLink" class="install" href="#" target="_blank" rel="noopener">📦 Installa addon Stremio</a>
        <a href="/cast">↩ Nuova ricerca</a>
        <a href="/">↩ Torna al manager</a>
      </div>
    </div>

    <div class="footer-note">
      Dopo il cast: apri la pagina del titolo in Stremio, vedrai uno stream <b>DMV🟣 Cast ▶️</b>.
    </div>
  </div>

  <script>
    const $ = (id) => document.getElementById(id);
    const params = new URLSearchParams(location.search);

    // Resolve userId from (in order): URL ?userId=…, localStorage, cookie dmv_uid.
    // The cookie is a fallback for browsers / contexts where localStorage isn't
    // populated yet (Safari ITP, new partitioned tab, etc.) — the backend sets
    // it on every /auth/login response and on /torbox/:userId/profile fetch.
    function readCookie(name) {
      const all = document.cookie || '';
      const parts = all.split(';');
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i].trim();
        const eq = p.indexOf('=');
        if (eq <= 0) continue;
        if (p.slice(0, eq) === name) {
          try { return decodeURIComponent(p.slice(eq + 1)); } catch (_) { return p.slice(eq + 1); }
        }
      }
      return '';
    }
    const cookieUid = readCookie('dmv_uid');
    let lsUid = '';
    try { lsUid = localStorage.getItem('dmvUserId') || ''; } catch (_) {}
    let userId = params.get('userId') || lsUid || cookieUid || '';
    if (userId && !lsUid) {
      // Promote cookie -> localStorage so the rest of the app sees the user too.
      try { localStorage.setItem('dmvUserId', userId); } catch (_) {}
    }

    const username = (function(){ try { return localStorage.getItem('dmvUsername') || ''; } catch (_) { return ''; } })();
    const manifestUrl = (function(){ try { return localStorage.getItem('dmvManifestUrl') || ''; } catch (_) { return ''; } })();

    if (!userId) {
      // Show inline login notice instead of silently redirecting (which can
      // bounce the user back here in a loop if /login also can't establish
      // the session). The button takes them to the homepage where the actual
      // login form lives.
      $('identUser').textContent = '(non loggato)';
      $('loginNotice').hidden = false;

      function setLoginStatus(msg, kind) {
        const el = $('loginStatus');
        el.textContent = msg || '';
        el.className = kind ? 'status ' + kind : 'status';
        el.style.textAlign = 'left';
      }
      function switchTab(which) {
        $('loginUserForm').style.display = which === 'user' ? 'grid' : 'none';
        $('loginKeyForm').style.display = which === 'key' ? 'grid' : 'none';
        $('tabUser').style.opacity = which === 'user' ? '1' : '0.55';
        $('tabKey').style.opacity = which === 'key' ? '1' : '0.55';
      }
      $('tabUser').addEventListener('click', () => switchTab('user'));
      $('tabKey').addEventListener('click', () => switchTab('key'));

      async function doLogin(body) {
        setLoginStatus('Verifica in corso…');
        try {
          const r = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          const data = await r.json().catch(() => ({}));
          if (!r.ok) { setLoginStatus(data.error || 'Login fallito', 'err'); return; }
          if (data.userId) localStorage.setItem('dmvUserId', data.userId);
          if (data.manifestUrl) localStorage.setItem('dmvManifestUrl', data.manifestUrl);
          if (data.apiKeyLast4) localStorage.setItem('dmvApiKeyLast4', data.apiKeyLast4);
          if (data.username) localStorage.setItem('dmvUsername', data.username);
          setLoginStatus('OK! Ricarico…', 'ok');
          setTimeout(() => location.reload(), 300);
        } catch (e) {
          setLoginStatus('Errore di rete: ' + (e.message || ''), 'err');
        }
      }
      $('loginUserForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const u = $('liUser').value.trim();
        const p = $('liPass').value;
        if (!u || !p) { setLoginStatus('Username e password obbligatori', 'err'); return; }
        doLogin({ username: u, password: p });
      });
      $('loginKeyForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const k = $('liKey').value.trim();
        if (!k) { setLoginStatus('API key obbligatoria', 'err'); return; }
        doLogin({ apiKey: k });
      });
    } else {
      $('identUser').textContent = username || userId;
      if (manifestUrl) {
        const sep = manifestUrl.indexOf('://');
        const stripped = sep >= 0 ? manifestUrl.slice(sep + 3) : manifestUrl;
        $('manifestLink').href = 'stremio://' + stripped;
      }

      function formatBytes(b) {
        const n = Number(b); if (!Number.isFinite(n) || n <= 0) return '';
        if (n >= 1024**3) return (n / 1024**3).toFixed(2) + ' GB';
        if (n >= 1024**2) return (n / 1024**2).toFixed(1) + ' MB';
        return (n / 1024).toFixed(1) + ' KB';
      }
      function escHtml(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      }

      const imdbIdParam = params.get('imdbId') || '';
      const infoHashParam = (params.get('infoHash') || '').toLowerCase();
      const hasFullParams = /^tt\\d+$/.test(imdbIdParam) && /^[a-f0-9]{40}$/.test(infoHashParam);

      // ============ SEARCH MODE ============
      if (!hasFullParams) {
        $('searchPanel').hidden = false;
        let searchAbort = null;
        let searchTimer = null;

        function setSStatus(msg, kind) {
          const el = $('searchStatus');
          el.textContent = msg || '';
          el.className = kind ? 'status ' + kind : 'status';
          el.style.textAlign = 'left';
        }

        async function runSearch() {
          const q = $('sQuery').value.trim();
          // Allow empty q if any non-default filter is set; otherwise need a query.
          const type = $('sType').value;
          const cache = $('sCache').value;
          const lang = $('sLang').value;
          const sort = $('sSort').value;
          if (!q && type === 'all' && cache === 'all' && lang === 'all') {
            $('searchResults').innerHTML = '';
            setSStatus('Digita qualcosa o scegli un filtro…');
            return;
          }
          if (searchAbort) { try { searchAbort.abort(); } catch (_) {} }
          searchAbort = new AbortController();
          setSStatus('Ricerca in corso…');
          try {
            const url = '/icvdb/search?userId=' + encodeURIComponent(userId)
              + '&q=' + encodeURIComponent(q)
              + '&type=' + encodeURIComponent(type)
              + '&cache=' + encodeURIComponent(cache)
              + '&lang=' + encodeURIComponent(lang)
              + '&sort=' + encodeURIComponent(sort)
              + '&limit=50';
            const r = await fetch(url, { signal: searchAbort.signal });
            const data = await r.json().catch(() => ({}));
            if (!r.ok) { setSStatus(data.error || 'Errore ricerca', 'err'); return; }
            renderResults(data.results || []);
            setSStatus((data.results || []).length + ' risultati' + ((data.results || []).length >= 50 ? ' (max 50, raffina la ricerca)' : ''));
          } catch (e) {
            if (e.name === 'AbortError') return;
            setSStatus('Errore di rete: ' + (e.message || ''), 'err');
          }
        }

        function renderResults(list) {
          const wrap = $('searchResults');
          wrap.innerHTML = '';
          if (!list.length) {
            wrap.innerHTML = '<div class="status" style="text-align:left;">Nessun risultato.</div>';
            return;
          }
          for (const row of list) {
            const div = document.createElement('div');
            div.className = 'res-row';
            const left = document.createElement('div');
            left.style.minWidth = '0';
            const title = document.createElement('div');
            title.className = 'res-title';
            title.textContent = row.title || row.info_hash || '(senza titolo)';
            const meta = document.createElement('div');
            meta.className = 'res-meta';
            const badges = [];
            if (row.type === 'series') badges.push('<span class="res-badge series">📺 Serie</span>');
            else badges.push('<span class="res-badge">🎬 Film</span>');
            if (row.cached_tb) badges.push('<span class="res-badge tb">⚡ TB Cache</span>');
            if (row.is_pack) badges.push('<span class="res-badge">📦 Pack</span>');
            const seeders = Number(row.seeders) > 0 ? '👥 ' + row.seeders : '';
            const size = formatBytes(row.size);
            const imdb = row.imdb_id ? escHtml(row.imdb_id) : '';
            const provider = row.provider ? escHtml(row.provider) : '';
            meta.innerHTML = badges.join(' ')
              + (seeders ? ' · ' + seeders : '')
              + (size ? ' · ' + size : '')
              + (imdb ? ' · ' + imdb : '')
              + (provider ? ' · ' + provider : '');
            left.append(title, meta);

            const go = document.createElement('button');
            go.className = 'res-go';
            go.type = 'button';
            go.textContent = row.type === 'series' ? 'Scegli' : 'Cast →';

            // For series, expand inline picker. We try to load the list of
            // episodes from ICVdb (so the user picks an actual S/E that exists
            // in the torrent); if the torrent isn't enriched yet, we fall back
            // to two free-form numeric inputs.
            if (row.type === 'series') {
              const picker = document.createElement('div');
              picker.className = 'ep-picker';
              picker.style.gridColumn = '1 / -1';
              picker.innerHTML = '<div style="grid-column:1/-1;color:var(--muted);font-size:12px;">Carico episodi…</div>';
              let loaded = false;
              go.addEventListener('click', async () => {
                const visible = picker.style.display === 'grid';
                picker.style.display = visible ? 'none' : 'grid';
                if (visible || loaded) return;
                loaded = true;
                try {
                  const r = await fetch('/icvdb/files?userId=' + encodeURIComponent(userId)
                    + '&infoHash=' + encodeURIComponent(String(row.info_hash || '').toLowerCase()));
                  const data = await r.json().catch(() => ({}));
                  const files = (data && data.files) || [];
                  // Keep only entries with a parsed S+E.
                  const eps = files
                    .filter(f => Number(f.imdb_season) > 0 && Number(f.imdb_episode) > 0)
                    .sort((a, b) => (a.imdb_season - b.imdb_season) || (a.imdb_episode - b.imdb_episode));
                  if (eps.length > 0) {
                    const sel = document.createElement('select');
                    sel.style.cssText = 'grid-column:1/-1;height:38px;padding:0 10px;border-radius:8px;border:1px solid var(--line);background:rgba(10,0,20,0.5);color:var(--text);font:inherit;font-size:13px;';
                    sel.innerHTML = '<option value="">— Scegli puntata —</option>' + eps.map(f => {
                      const s = String(f.imdb_season).padStart(2, '0');
                      const e = String(f.imdb_episode).padStart(2, '0');
                      const label = 'S' + s + 'E' + e + (f.title ? ' · ' + escHtml(String(f.title).split('/').pop()).slice(0, 60) : '');
                      return '<option value="' + f.imdb_season + ',' + f.imdb_episode + '">' + label + '</option>';
                    }).join('');
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.textContent = '📡 Cast →';
                    // Big button under the dropdown, full-width.
                    btn.style.cssText = 'grid-column:1/-1;height:44px;border:0;border-radius:10px;color:#fff;font:inherit;font-weight:800;font-size:14px;cursor:pointer;background:linear-gradient(135deg,#7c3aed,#ec4899);box-shadow:0 6px 16px rgba(168,85,247,0.25);';
                    btn.addEventListener('click', () => {
                      if (!sel.value) { alert('Scegli una puntata'); return; }
                      const [s, e] = sel.value.split(',').map(Number);
                      goCast(row, { season: s, episode: e });
                    });
                    picker.style.gridTemplateColumns = '1fr';
                    picker.style.gap = '8px';
                    picker.innerHTML = '';
                    picker.append(sel, btn);
                  } else {
                    // Fallback: torrent not enriched yet, ask manually.
                    picker.style.gridTemplateColumns = '1fr 1fr auto';
                    picker.innerHTML =
                      '<input type="number" min="1" placeholder="Stagione" />' +
                      '<input type="number" min="1" placeholder="Episodio" />' +
                      '<button type="button">Cast →</button>';
                    picker.querySelector('button').addEventListener('click', () => {
                      const s = Number(picker.querySelectorAll('input')[0].value || 0);
                      const e = Number(picker.querySelectorAll('input')[1].value || 0);
                      if (!s || !e) { alert('Stagione ed episodio obbligatori per le serie'); return; }
                      goCast(row, { season: s, episode: e });
                    });
                  }
                } catch (_) {
                  picker.innerHTML = '<div style="grid-column:1/-1;color:var(--red);font-size:12px;">Errore caricamento episodi</div>';
                }
              });
              div.append(left, go, picker);
            } else {
              go.addEventListener('click', () => goCast(row, {}));
              div.append(left, go);
            }
            wrap.append(div);
          }
        }

        function goCast(row, extra) {
          const qs = new URLSearchParams();
          qs.set('type', row.type === 'series' ? 'series' : 'movie');
          qs.set('imdbId', row.imdb_id || '');
          qs.set('infoHash', String(row.info_hash || '').toLowerCase());
          if (row.title) qs.set('title', row.title);
          if (row.size) qs.set('size', String(row.size));
          if (row.tmdb_id) qs.set('tmdbId', String(row.tmdb_id));
          if (extra && extra.season) qs.set('season', String(extra.season));
          if (extra && extra.episode) qs.set('episode', String(extra.episode));
          location.href = '/cast?' + qs.toString();
        }

        $('searchForm').addEventListener('submit', (e) => { e.preventDefault(); runSearch(); });
        $('sQuery').addEventListener('input', () => {
          clearTimeout(searchTimer);
          searchTimer = setTimeout(runSearch, 350);
        });
        ['sType','sCache','sLang','sSort'].forEach(id => {
          $(id).addEventListener('change', runSearch);
        });

        // Prefill query if URL has ?q=…
        if (params.get('q')) {
          $('sQuery').value = params.get('q');
          runSearch();
        }
      } else {

      // ============ CONFIRM MODE ============
      $('confirmView').hidden = false;

      function setStatus(message, ok) {
        $('castStatus').textContent = message || '';
        $('castStatus').className = ok === undefined ? 'status' : 'status ' + (ok ? 'ok' : 'err');
      }
      function addMeta(label, value, mono) {
        if (!value) return;
        const row = document.createElement('div');
        row.className = 'meta-row';
        const labelEl = document.createElement('strong');
        labelEl.textContent = label;
        const valueEl = document.createElement('span');
        if (mono) valueEl.className = 'hash';
        valueEl.textContent = value;
        row.append(labelEl, valueEl);
        $('castMeta').append(row);
      }

      const type = params.get('type') || 'movie';
      const imdbId = imdbIdParam;
      const infoHash = infoHashParam;
      const title = params.get('title') || params.get('filename') || 'Cast TorBox';
      const filename = params.get('filename') || '';
      const sizeBytes = params.get('size') || '';

      $('castHeader').textContent = '🎬 ' + (filename || title);

      addMeta('Tipo', type === 'series' ? 'Serie TV' : 'Film');
      addMeta('IMDb', imdbId);
      if (type === 'series') {
        const s = params.get('season') || '0';
        const e = params.get('episode') || '0';
        if (Number(s) > 0 && Number(e) > 0) {
          addMeta('Episodio', 'S' + String(s).padStart(2,'0') + 'E' + String(e).padStart(2,'0'));
        } else {
          addMeta('Episodio', '(auto-detect dal nome file)');
        }
      }
      if (params.get('tmdbId')) addMeta('TMDB', params.get('tmdbId'));
      addMeta('Hash', infoHash, true);
      const sizeStr = formatBytes(sizeBytes);
      if (sizeStr) addMeta('Dimensione', sizeStr);

      $('castBtn').addEventListener('click', async () => {
        setStatus('Invio cast a TorBox...');
        $('castBtn').disabled = true;
        const body = {};
        for (const [key, value] of params.entries()) {
          if (value !== '') body[key] = value;
        }
        body.type = type;
        body.imdbId = imdbId;
        body.infoHash = infoHash;
        try {
          const response = await fetch('/torbox/' + encodeURIComponent(userId) + '/cast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          const data = await response.json();
          if (!response.ok) {
            $('castBtn').disabled = false;
            return setStatus(data.error || 'Errore cast', false);
          }
          setStatus('✅ Cast salvato! Apri Stremio sullo stesso titolo per vedere lo stream DMV🟣.', true);
          $('castLinks').hidden = false;
          $('castBtn').textContent = '✅ Castato';
        } catch (_) {
          $('castBtn').disabled = false;
          setStatus('Errore di rete', false);
        }
      });
      } // end else (confirm mode)
    }
  </script>
</body>
</html>`;
}

function renderLibraryPage() {
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DMV🟣 Libreria TorBox</title>
  <link rel="icon" type="image/svg+xml" href="/logo.svg">
  <meta name="theme-color" content="#a855f7">
  <style>
    :root {
      color-scheme: dark;
      --bg:#0a0014; --bg-2:#11071f;
      --panel: rgba(168,85,247,0.08); --panel-2: rgba(168,85,247,0.14);
      --text:#f5f3ff; --muted:#c4b5fd; --dim:#94a3b8;
      --line: rgba(168,85,247,0.25);
      --accent:#a855f7; --accent-2:#c084fc;
      --green:#34d399; --orange:#fbbf24; --red:#f87171; --blue:#60a5fa;
    }
    *{box-sizing:border-box}
    html,body{margin:0;min-height:100vh}
    body{
      background:
        radial-gradient(1400px 700px at 50% -10%, rgba(168,85,247,0.18), transparent 70%),
        radial-gradient(900px 500px at 80% 120%, rgba(236,72,153,0.12), transparent 70%),
        var(--bg);
      color:var(--text);
      font-family: system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      padding: 18px 14px 60px;
    }
    .wrap{max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:14px}

    /* Header */
    .topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
    .brand{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none}
    .brand .logo{width:42px;height:42px}
    .brand h1{margin:0;font-size:18px;font-weight:800;letter-spacing:.2px}
    .brand .sub{display:block;font-size:11.5px;color:var(--muted);font-weight:500}

    .topnav{display:flex;gap:8px;flex-wrap:wrap}
    .topnav a, .topnav button{
      display:inline-flex;align-items:center;gap:6px;
      padding:8px 12px;border-radius:9px;
      background: rgba(168,85,247,0.12);
      border:1px solid var(--line);
      color:#f3e8ff;text-decoration:none;font-size:12.5px;font-weight:700;cursor:pointer;
    }
    .topnav a:hover, .topnav button:hover{background: rgba(168,85,247,0.22)}
    .topnav .danger{background:rgba(248,113,113,.12);border-color:rgba(248,113,113,.4);color:#fecaca}
    .topnav .danger:hover{background:rgba(248,113,113,.22)}

    /* Quota / stats */
    .stats{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}
    .stat{
      background:var(--panel);border:1px solid var(--line);border-radius:10px;
      padding:12px 14px;display:flex;flex-direction:column;gap:4px;min-height:64px;
    }
    .stat .lbl{font-size:10.5px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.6px}
    .stat .val{font-size:18px;font-weight:800;color:#fff;background:linear-gradient(135deg,#a855f7,#ec4899);-webkit-background-clip:text;background-clip:text;color:transparent}
    .stat .hint{font-size:11px;color:var(--dim)}

    /* Toolbar */
    .toolbar{
      background:var(--panel);border:1px solid var(--line);border-radius:10px;
      padding:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;
    }
    .toolbar input[type="search"], .toolbar select{
      background:rgba(0,0,0,.35);color:var(--text);border:1px solid var(--line);
      border-radius:8px;padding:9px 11px;font:inherit;font-size:13px;outline:none;
    }
    .toolbar input[type="search"]{min-width:240px;flex:1}
    .toolbar input[type="search"]:focus, .toolbar select:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(168,85,247,.25)}
    .toolbar .count{margin-left:auto;color:var(--muted);font-size:12px;font-weight:700}

    /* Torrent list */
    .lib-grid{display:flex;flex-direction:column;gap:10px}
    .titem{
      background:var(--panel);border:1px solid var(--line);border-radius:10px;
      transition: border-color .15s, background .15s;
    }
    .titem:hover{border-color:rgba(168,85,247,.45);background:var(--panel-2)}
    .titem.open{border-color:rgba(168,85,247,.55);background:var(--panel-2)}

    .titem-row{
      display:grid;grid-template-columns: 56px 1fr auto;gap:12px;align-items:center;
      padding:10px 12px;cursor:pointer;
    }
    .titem-poster{
      width:56px;height:78px;border-radius:6px;
      background:linear-gradient(135deg, rgba(168,85,247,.25), rgba(236,72,153,.18));
      display:grid;place-items:center;font-size:24px;color:#fff;
      border:1px solid var(--line);flex-shrink:0;
    }
    .titem-info{min-width:0;display:flex;flex-direction:column;gap:4px}
    .titem-title{
      font-size:13.5px;font-weight:700;color:#fff;
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
    }
    .titem-meta{display:flex;flex-wrap:wrap;gap:6px;font-size:11px;color:var(--muted);align-items:center}
    .titem-meta .chip{
      padding:2px 7px;border-radius:4px;background:rgba(168,85,247,.18);
      border:1px solid var(--line);color:#e9d5ff;font-weight:700;font-size:10.5px;
    }
    .titem-meta .chip.ok{background:rgba(52,211,153,.15);border-color:rgba(52,211,153,.4);color:#a7f3d0}
    .titem-meta .chip.dl{background:rgba(96,165,250,.15);border-color:rgba(96,165,250,.4);color:#bfdbfe}
    .titem-meta .chip.warn{background:rgba(251,191,36,.15);border-color:rgba(251,191,36,.4);color:#fde68a}
    .titem-meta .chip.err{background:rgba(248,113,113,.15);border-color:rgba(248,113,113,.4);color:#fecaca}
    .q-badge{font-family:ui-monospace,'JetBrains Mono',monospace;font-weight:800;font-size:10px;padding:1px 6px;border-radius:4px}
    .q4K{background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#1a0a00}
    .q1080p{background:linear-gradient(135deg,#3b82f6,#60a5fa);color:#fff}
    .q720p{background:linear-gradient(135deg,#10b981,#34d399);color:#001a0d}
    .q480p,.qSD{background:rgba(255,255,255,.08);color:var(--muted)}

    .titem-actions{display:flex;gap:8px;align-items:center;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end}
    .btn-cluster{
      display:inline-flex;gap:4px;align-items:center;
      padding:8px 6px 4px;border:1px solid var(--line);border-radius:9px;
      position:relative;background:rgba(168,85,247,0.05);
    }
    .btn-cluster::before{
      content:attr(data-label);position:absolute;top:-7px;left:8px;
      font-size:9px;font-weight:800;letter-spacing:.5px;
      background:#0a0014;padding:0 5px;color:var(--muted);text-transform:uppercase;
    }
    .btn-cluster .btn-icon{
      width:auto;min-width:48px;height:34px;padding:0 8px;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      gap:1px;font-size:9px;font-weight:700;line-height:1;letter-spacing:.3px;
      text-transform:uppercase;color:#f3e8ff;
    }
    .btn-cluster .btn-icon .ic{font-size:14px;line-height:1}
    .btn-icon{
      background:rgba(168,85,247,.18);border:1px solid var(--line);color:#fff;
      width:32px;height:32px;border-radius:7px;cursor:pointer;display:grid;place-items:center;
    }
    .btn-icon:hover{background:rgba(168,85,247,.32)}
    .btn-icon.cast{background:linear-gradient(135deg,#7c3aed,#ec4899);border:none}
    .btn-icon.cast:hover{filter:brightness(1.1)}
    .btn-icon.danger{background:rgba(248,113,113,.15);border-color:rgba(248,113,113,.4)}
    .btn-icon.danger:hover{background:rgba(248,113,113,.28)}

    .progress{height:5px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;margin-top:4px}
    .progress > i{display:block;height:100%;background:linear-gradient(90deg,#a855f7,#ec4899)}

    /* Files panel */
    .files{
      border-top:1px dashed var(--line);
      padding:8px 12px 12px;
      display:none;
    }
    .titem.open .files{display:block}
    .file-row{
      display:grid;grid-template-columns: 1fr auto auto;gap:10px;align-items:center;
      padding:7px 10px;border-radius:7px;
      background:rgba(0,0,0,.22);border:1px solid transparent;margin-top:6px;
    }
    .file-row:hover{border-color:var(--line);background:rgba(0,0,0,.32)}
    .file-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:#e9d5ff}
    .file-name .ic{margin-right:6px}
    .file-size{font-size:11px;color:var(--dim);font-family:ui-monospace,monospace}
    .file-row .btn-icon{width:auto;padding:0 10px;font-size:11px;font-weight:700;gap:4px;height:28px}

    .empty{text-align:center;color:var(--dim);padding:30px 10px;font-size:13px}
    .loader{text-align:center;color:var(--muted);padding:20px;font-size:13px}
    .loader::before{content:'⌛ ';animation:spin 1.2s linear infinite;display:inline-block}
    @keyframes spin{to{transform:rotate(360deg)}}

    /* Cast modal */
    .modal-bg{
      position:fixed;inset:0;background:rgba(0,0,0,.72);display:none;
      align-items:center;justify-content:center;z-index:100;padding:14px;
      backdrop-filter:blur(6px);
    }
    .modal-bg.open{display:flex}
    .modal{
      background:linear-gradient(180deg,#150726,#0d041a);
      border:1px solid var(--line);border-radius:14px;
      max-width:480px;width:100%;padding:20px;
      box-shadow:0 20px 60px rgba(0,0,0,.6);
    }
    .modal h3{margin:0 0 4px;font-size:16px;color:#fff}
    .modal .modal-sub{margin:0 0 14px;font-size:11.5px;color:var(--muted);overflow-wrap:anywhere}
    .modal label{display:block;font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-top:10px}
    .modal input, .modal select{
      width:100%;margin-top:5px;padding:9px 11px;
      background:rgba(0,0,0,.35);color:var(--text);
      border:1px solid var(--line);border-radius:8px;font:inherit;font-size:13px;outline:none;
    }
    .modal input:focus, .modal select:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(168,85,247,.25)}
    .modal .row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .modal .actions{display:flex;gap:10px;margin-top:18px}
    .modal .actions button{
      flex:1;height:42px;border:0;border-radius:9px;font:inherit;font-weight:800;font-size:13.5px;cursor:pointer;color:#fff;
    }
    .modal .actions .cancel{background:rgba(255,255,255,.08);border:1px solid var(--line);color:var(--muted)}
    .modal .actions .confirm{background:linear-gradient(135deg,#7c3aed,#ec4899)}

    .toast{
      position:fixed;left:50%;transform:translateX(-50%);bottom:24px;
      background:rgba(0,0,0,.85);border:1px solid var(--line);color:#fff;
      padding:10px 16px;border-radius:10px;font-size:13px;z-index:200;
      opacity:0;pointer-events:none;transition:opacity .2s;
    }
    .toast.show{opacity:1}
    .toast.ok{border-color:rgba(52,211,153,.5)}
    .toast.err{border-color:rgba(248,113,113,.5)}

    @media (max-width: 600px){
      .topbar{flex-direction:column;align-items:flex-start;gap:10px}
      .topnav{width:100%;justify-content:space-between}
      .topnav a, .topnav button{flex:1 1 auto;justify-content:center;min-height:40px;font-size:12px;padding:9px 8px}
      .toolbar{flex-direction:column;align-items:stretch;gap:8px;padding:8px}
      .toolbar input[type="search"]{min-width:0;width:100%}
      .toolbar select{width:100%}
      .toolbar .row-mob{display:flex;gap:8px;align-items:center}
      .toolbar .row-mob select{flex:1}
      .toolbar .row-mob button{flex-shrink:0;width:44px !important;height:44px}
      .toolbar #btnAutoSync{width:100%}
      .toolbar .count{margin-left:0;text-align:right}
      .titem-row{grid-template-columns:48px 1fr auto;gap:10px;padding:9px}
      .titem-poster{width:48px;height:68px;font-size:20px}
      .titem-title{font-size:12.5px}
      .titem-meta{font-size:10.5px}
      .btn-icon{width:36px;height:36px}
      .file-row{grid-template-columns:1fr auto;gap:8px;padding:8px}
      .file-row .btn-icon{grid-column:1 / -1;height:32px;width:100%;justify-content:center}
      .stat .val{font-size:16px}
      .modal{padding:16px}
      .modal .row2{grid-template-columns:1fr}
      .modal .actions button{min-height:48px;font-size:14px}
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="topbar">
      <a class="brand" href="/">
        <svg class="logo" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 16.1A5 5 0 0 1 5.9 20"/>
          <path d="M2 12.05A9 9 0 0 1 9.95 20"/>
          <path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/>
          <line x1="2" y1="20" x2="2.01" y2="20"/>
        </svg>
        <div>
          <h1>DMV<span style="color:#a855f7">🟣</span> Libreria <span style="color:#a855f7">📚</span></h1>
          <span class="sub">La tua libreria TorBox · clicca un file per castarlo su Stremio</span>
        </div>
      </a>
      <div class="topnav">
        <a href="/">🏠 Home</a>
        <a href="javascript:void(0)" id="lnkSettings">⚙️ Impostazioni</a>
        <a href="https://torbox.app/dashboard" target="_blank" rel="noopener">🌐 TorBox</a>
        <button class="danger" id="btnLogout" type="button">Esci</button>
      </div>
    </div>

    <div class="stats" id="stats">
      <div class="stat"><div class="lbl">Torrent</div><div class="val" id="statTotal">—</div><div class="hint" id="statTotalHint">caricamento...</div></div>
      <div class="stat"><div class="lbl">Spazio usato</div><div class="val" id="statSize">—</div><div class="hint">dimensione totale</div></div>
      <div class="stat"><div class="lbl">Già castati</div><div class="val" id="statCast">—</div><div class="hint">visibili su Stremio</div></div>
      <div class="stat"><div class="lbl">In download</div><div class="val" id="statDl">—</div><div class="hint">non ancora completati</div></div>
    </div>

    <div class="toolbar">
      <input id="filter" type="search" placeholder="🔍 Cerca per nome…" autocomplete="off">
      <select id="sort">
        <option value="date">Più recenti</option>
        <option value="size">Più grandi</option>
        <option value="name">Nome A–Z</option>
      </select>
      <select id="statusFilter">
        <option value="all">Tutti</option>
        <option value="ready">Pronti</option>
        <option value="dl">In download</option>
      </select>
      <button class="btn-icon" id="btnReload" title="Aggiorna" style="width:36px">↻</button>
      <span class="count" id="count"></span>
    </div>

    <div id="content" class="lib-grid">
      <div class="loader">Carico la libreria da TorBox…</div>
    </div>

    <div class="empty" style="margin-top:6px;font-size:11px;opacity:.5">build ${new Date().toISOString().replace('T',' ').slice(0,19)} UTC</div>
  </div>

  <!-- Cast modal -->
  <div class="modal-bg" id="modalBg">
    <div class="modal" id="modal">
      <h3 id="modalTitle">Cast su Stremio</h3>
      <p class="modal-sub" id="modalFile"></p>
      <label>Tipo
        <select id="mType">
          <option value="movie">🎞️ Film</option>
          <option value="series">📺 Serie TV</option>
        </select>
      </label>
      <label>🔎 Cerca per titolo <span style="color:var(--dim);text-transform:none;font-weight:500">(TMDB → IMDb in automatico)</span>
        <div style="display:flex;gap:6px">
          <input id="mSearch" type="text" placeholder="es. From, Better Call Saul, Dune..." autocomplete="off" style="flex:1">
          <button type="button" id="mSearchBtn" class="confirm" style="padding:8px 12px;flex:0 0 auto">Cerca</button>
        </div>
      </label>
      <div id="mSearchResults" style="display:none;margin:-4px 0 6px 0;max-height:240px;overflow-y:auto;border:1px solid var(--border);border-radius:10px;background:rgba(0,0,0,.2);padding:6px"></div>
      <label>IMDb ID <span style="color:var(--dim);text-transform:none;font-weight:500">(es. tt9813792 — compilato dalla ricerca)</span>
        <input id="mImdb" type="text" placeholder="tt0000000" autocomplete="off">
      </label>
      <div id="seWrap" class="row2" style="display:none">
        <label>Stagione<input id="mSeason" type="number" min="1" value=""></label>
        <label>Episodio<input id="mEpisode" type="number" min="1" value=""></label>
      </div>
      <div class="actions">
        <button class="cancel" type="button" id="mCancel">Annulla</button>
        <button class="confirm" type="button" id="mConfirm">Cast su Stremio</button>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    const $ = (id) => document.getElementById(id);
    const userId = localStorage.getItem('dmvUserId') || '';
    if (!userId) { window.location.href = '/login?return=' + encodeURIComponent(location.pathname); }

    const toast = $('toast');
    function showToast(msg, kind){
      toast.textContent = msg;
      toast.className = 'toast show ' + (kind || '');
      clearTimeout(showToast._t);
      showToast._t = setTimeout(() => toast.classList.remove('show'), 2400);
    }

    function fmtBytes(n){
      n = Number(n) || 0;
      if (n <= 0) return '—';
      const u = ['B','KB','MB','GB','TB'];
      let i=0, v=n;
      while (v >= 1024 && i < u.length-1){ v/=1024; i++; }
      return v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2) + ' ' + u[i];
    }
    function fmtDate(s){
      if (!s) return '';
      const d = new Date(s);
      if (isNaN(d)) return '';
      return d.toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' });
    }
    function detectQuality(name){
      const t = String(name || '');
      if (/\\b2160p\\b|\\b4K\\b|UHD/i.test(t)) return '4K';
      if (/\\b1080p\\b/i.test(t)) return '1080p';
      if (/\\b720p\\b/i.test(t)) return '720p';
      if (/\\b480p\\b/i.test(t)) return '480p';
      return '';
    }
    function parseSE(name){
      const s = String(name || '');
      let m = s.match(/[Ss](\\d{1,2})[._\\s-]?[Ee](\\d{1,3})/);
      if (m) return { season:Number(m[1]), episode:Number(m[2]) };
      m = s.match(/(?:^|[^\\d])(\\d{1,2})[xX](\\d{1,3})(?!\\d)/);
      if (m) return { season:Number(m[1]), episode:Number(m[2]) };
      return { season:0, episode:0 };
    }
    function isVideo(name){
      return /\\.(mkv|mp4|avi|mov|m4v|webm|ts|wmv)$/i.test(String(name || ''));
    }
    function isSampleOrTrailer(name){
      return /sample|trailer|extra|featurette/i.test(String(name || ''));
    }
    function pickPosterIcon(t){
      // Heuristic: pack vs single, video vs other
      const files = Array.isArray(t.files) ? t.files : [];
      const videos = files.filter(f => isVideo(f.name || f.short_name));
      if (videos.length > 5) return '📦';
      if (videos.length >= 2) return '📺';
      return '🎞️';
    }
    function statusChip(t){
      const state = String(t.download_state || '').toLowerCase();
      const finished = t.download_finished || t.cached || /completed|seeding|cached|finished|uploading/.test(state);
      if (finished) return { cls:'ok', label:'pronto' };
      if (/downloading|metadl|pending|queued|stalled|allocating|checking/.test(state)) {
        const pct = Math.round((Number(t.progress) || 0) * 100);
        return { cls:'dl', label: pct ? pct + '%' : (state || 'download') };
      }
      if (/error|failed/.test(state)) return { cls:'err', label: state };
      return { cls:'warn', label: state || '—' };
    }

    let allTorrents = [];
    let castedKeys = new Set(); // "infoHash|fileId" of already-casted files

    // Re-fetch only the casts list and update castedKeys in-place (no full reload)
    async function refreshCastedKeys(){
      try {
        const r = await fetch('/torbox/' + encodeURIComponent(userId) + '/casts');
        const data = await r.json();
        castedKeys = new Set();
        (data.casts || []).forEach(c => {
          const key = (c.info_hash || '').toLowerCase() + '|' + (c.file_id || '');
          castedKeys.add(key);
        });
      } catch (_) { /* keep stale set */ }
    }

    // Re-fetch just one torrent's files panel without closing it
    async function reloadFilesPanel(t, item, fwrap){
      try {
        const r = await fetch('/torbox/' + encodeURIComponent(userId) + '/library/torrent/' + encodeURIComponent(t.id) + '/files');
        const data = await r.json();
        if (r.ok) renderFilesPanel(t, Array.isArray(data.files) ? data.files : [], fwrap);
      } catch (_) {}
    }

    async function loadAll(){
      $('content').innerHTML = '<div class="loader">Carico la libreria da TorBox…</div>';
      try {
        const [libR, castsR] = await Promise.all([
          fetch('/torbox/' + encodeURIComponent(userId) + '/library/data'),
          fetch('/torbox/' + encodeURIComponent(userId) + '/casts')
        ]);
        const lib = await libR.json();
        const casts = await castsR.json();
        if (!libR.ok) throw new Error(lib.error || 'Errore libreria');
        allTorrents = Array.isArray(lib.torrents) ? lib.torrents : [];
        castedKeys = new Set();
        (casts.casts || []).forEach(c => {
          const key = (c.info_hash || '').toLowerCase() + '|' + (c.file_id || '');
          castedKeys.add(key);
        });
        paintStats();
        render();
      } catch (e) {
        $('content').innerHTML = '<div class="empty" style="color:#fecaca">❌ ' + (e.message || 'Errore') + '</div>';
      }
    }

    function paintStats(){
      const total = allTorrents.length;
      const sizeTotal = allTorrents.reduce((s,t) => s + (Number(t.size) || 0), 0);
      const dl = allTorrents.filter(t => statusChip(t).cls === 'dl').length;
      $('statTotal').textContent = total;
      $('statTotalHint').textContent = total === 1 ? 'torrent nella tua libreria' : 'torrent nella tua libreria';
      $('statSize').textContent = fmtBytes(sizeTotal);
      $('statCast').textContent = castedKeys.size;
      $('statDl').textContent = dl;
    }

    function torrentMatches(t, q){
      if (!q) return true;
      const hay = (t.name || '') + ' ' + (t.hash || '') + ' ' + (t.id || '');
      return hay.toLowerCase().includes(q);
    }

    function render(){
      const q = $('filter').value.trim().toLowerCase();
      const sortBy = $('sort').value;
      const statusF = $('statusFilter').value;
      let list = allTorrents.filter(t => torrentMatches(t, q));
      if (statusF !== 'all') {
        list = list.filter(t => {
          const s = statusChip(t).cls;
          return statusF === 'ready' ? s === 'ok' : s === 'dl';
        });
      }
      list.sort((a,b) => {
        if (sortBy === 'size') return (Number(b.size)||0) - (Number(a.size)||0);
        if (sortBy === 'name') return String(a.name||'').localeCompare(String(b.name||''));
        return new Date(b.created_at||0) - new Date(a.created_at||0);
      });

      $('count').textContent = list.length + ' / ' + allTorrents.length;

      const root = $('content');
      root.innerHTML = '';
      if (!list.length) {
        root.innerHTML = '<div class="empty">📭 Nessun torrent ' + (q ? 'corrispondente alla ricerca.' : 'nella tua libreria TorBox.') + '</div>';
        return;
      }
      // Pagination: render in chunks to keep the DOM responsive even with 1000+ torrents.
      const PAGE = 50;
      let shown = 0;
      function renderChunk(){
        const slice = list.slice(shown, shown + PAGE);
        for (const t of slice) root.appendChild(renderTorrent(t));
        shown += slice.length;
        moreBtn.textContent = shown < list.length
          ? '⬇️ Carica altri 50 (' + (list.length - shown) + ' rimanenti)'
          : '✓ Tutti caricati';
        moreBtn.disabled = shown >= list.length;
        moreBtn.style.opacity = shown >= list.length ? .5 : 1;
      }
      const moreBtn = el('button', 'cast-btn');
      moreBtn.type = 'button';
      moreBtn.style.cssText = 'margin:14px auto;display:block;padding:10px 22px;font-size:13px';
      moreBtn.addEventListener('click', renderChunk);
      renderChunk();
      root.appendChild(moreBtn);
    }

    function el(tag, cls, txt){
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (txt !== undefined) e.textContent = txt;
      return e;
    }

    function renderTorrent(t){
      const item = el('div','titem');
      item.dataset.id = String(t.id || '');

      const row = el('div','titem-row');
      const poster = el('div','titem-poster');
      poster.textContent = pickPosterIcon(t);
      const info = el('div','titem-info');
      const title = el('div','titem-title', t.name || ('torrent ' + t.id));
      title.title = t.name || '';
      const meta = el('div','titem-meta');
      const q = detectQuality(t.name);
      if (q) {
        const qb = el('span','q-badge q'+q, q);
        meta.append(qb);
      }
      const sChip = statusChip(t);
      const sb = el('span','chip ' + sChip.cls, sChip.label);
      meta.append(sb);
      const sz = el('span', null, fmtBytes(t.size));
      meta.append(sz);
      // /library/data is now slim — torrent.files is NOT included; we use the
      // pre-computed counters and lazy-load real files on expand.
      const fileCount = Number(t.file_count || 0);
      const videoCount = Number(t.video_count || 0);
      const cnt = el('span', null, fileCount + ' file' + (videoCount ? ' · ' + videoCount + ' video' : ''));
      meta.append(cnt);
      if (t.created_at) {
        const dt = el('span', null, '· ' + fmtDate(t.created_at));
        dt.style.color = 'var(--dim)';
        meta.append(dt);
      }
      info.append(title, meta);

      const pct = Math.round((Number(t.progress) || 0) * 100);
      if (pct > 0 && pct < 100) {
        const pr = el('div','progress');
        const pi = el('i'); pi.style.width = pct + '%';
        pr.append(pi);
        info.append(pr);
      }

      const actions = el('div','titem-actions');
      const single = videoCount === 1 && !!t.single_video;

      // === Cluster CAST: Apri · Auto · Cast ===
      const castCluster = el('div','btn-cluster');
      castCluster.setAttribute('data-label','Cast');

      // Apri = mostra/nasconde il pannello file (era il click implicito sulla riga)
      const btnOpen = el('button','btn-icon');
      btnOpen.type = 'button';
      btnOpen.innerHTML = '<span class="ic">📂</span><span>Apri</span>';
      btnOpen.title = 'Mostra/nascondi i file di questo torrent';
      btnOpen.addEventListener('click', (ev) => {
        ev.stopPropagation();
        item.classList.toggle('open');
        if (item.classList.contains('open')) {
          ensureFilesLoaded();
          setTimeout(() => item.querySelector('.files')?.scrollIntoView({behavior:'smooth',block:'nearest'}), 80);
        }
      });

      // Auto = auto-cast di TUTTI i file video del torrent via ICVdb
      const btnAutoAll = el('button','btn-icon');
      btnAutoAll.type = 'button';
      btnAutoAll.innerHTML = '<span class="ic">🪄</span><span>Auto</span>';
      btnAutoAll.title = 'Auto-cast TUTTI i file video di questo torrent via ICVdb';
      btnAutoAll.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        btnAutoAll.disabled = true;
        btnAutoAll.innerHTML = '<span class="ic">⏳</span><span>Auto</span>';
        // Apri il pannello file per dare contesto del risultato
        if (!item.classList.contains('open')) {
          item.classList.add('open');
          ensureFilesLoaded();
        }
        try {
          const r = await fetch('/torbox/' + encodeURIComponent(userId) + '/library/auto-cast-torrent', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ torrentId: t.id, infoHash: t.hash })
          });
          const data = await r.json();
          if (!data.ok) {
            showToast(data.error || 'Errore', 'err');
            btnAutoAll.innerHTML = '<span class="ic">🪄</span><span>Auto</span>';
            btnAutoAll.disabled = false;
            return;
          }
          showToast('🪄 ' + data.summary.matched + '/' + data.summary.scanned + ' file castati', 'ok');
          btnAutoAll.innerHTML = '<span class="ic">✓</span><span>' + data.summary.matched + '/' + data.summary.scanned + '</span>';
          // Ricarica i casts + pannello senza chiudere l'item aperto
          await refreshCastedKeys();
          await reloadFilesPanel(t, item, fwrap);
          paintStats();
        } catch (e) {
          showToast('Errore di rete', 'err');
          btnAutoAll.innerHTML = '<span class="ic">🪄</span><span>Auto</span>';
          btnAutoAll.disabled = false;
        }
      });

      // Cast = per single video apre modale; per pack apre il pannello file
      const btnCast = el('button','btn-icon');
      btnCast.type = 'button';
      btnCast.innerHTML = '<span class="ic">📡</span><span>Cast</span>';
      btnCast.title = single ? 'Cast il file video' : 'Apri files per scegliere quale castare';
      btnCast.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (single) {
          openCastModal(t, { id: t.single_video.id, name: t.single_video.name, size: t.single_video.size }, { item, fwrap });
        } else {
          item.classList.add('open');
          ensureFilesLoaded();
          setTimeout(() => item.querySelector('.files')?.scrollIntoView({behavior:'smooth',block:'nearest'}), 80);
        }
      });

      castCluster.append(btnOpen, btnAutoAll, btnCast);

      // === Cluster TB: Elimina ===
      const tbCluster = el('div','btn-cluster');
      tbCluster.setAttribute('data-label','TB');
      const btnDel = el('button','btn-icon');
      btnDel.type = 'button';
      btnDel.innerHTML = '<span class="ic">🗑️</span><span>Del</span>';
      btnDel.title = 'Elimina questo torrent da TorBox (rimuove anche i cast collegati)';
      btnDel.style.background = 'rgba(248,113,113,.12)';
      btnDel.style.border = '1px solid rgba(248,113,113,.35)';
      btnDel.style.color = '#fecaca';
      btnDel.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        if (!confirm('Eliminare definitivamente "' + (t.name || 'questo torrent') + '" da TorBox?')) return;
        btnDel.disabled = true;
        btnDel.innerHTML = '<span class="ic">⏳</span><span>Del</span>';
        const baseUrl = '/torbox/' + encodeURIComponent(userId) + '/library/torrent/' + encodeURIComponent(t.id);
        const resetBtn = () => {
          btnDel.disabled = false;
          btnDel.innerHTML = '<span class="ic">🗑️</span><span>Del</span>';
        };
        try {
          const r = await fetch(baseUrl, { method: 'DELETE' });
          const data = await r.json().catch(() => ({}));
          if (!r.ok) {
            // TB-side database error: offer to force-clean local casts so the
            // user can at least get a clean state on their side.
            if (data.canForce) {
              const ok = confirm(
                (data.error || 'Errore TorBox.') +
                '\\n\\nVuoi rimuovere comunque i CAST locali di questo torrent? ' +
                '(Il torrent resterà visibile in libreria finché TorBox non lo elimina.)'
              );
              if (!ok) { resetBtn(); return; }
              const r2 = await fetch(baseUrl + '?force=1', { method: 'DELETE' });
              const d2 = await r2.json().catch(() => ({}));
              if (!r2.ok) { showToast(d2.error || 'Errore force-clean', 'err'); resetBtn(); return; }
              showToast('🧹 Cast locali rimossi (' + d2.removedCasts + '). Riprova a eliminare il torrent fra qualche minuto.', 'ok');
              paintStats();
              resetBtn();
              return;
            }
            showToast(data.error || 'Errore', 'err');
            resetBtn();
            return;
          }
          showToast('🗑️ Eliminato (' + data.removedCasts + ' cast rimossi)', 'ok');
          item.style.transition = 'opacity .25s'; item.style.opacity = '0';
          setTimeout(() => loadAll(), 350);
        } catch (e) {
          showToast('Errore di rete: ' + (e && e.message ? e.message : 'sconosciuto'), 'err');
          resetBtn();
        }
      });
      tbCluster.append(btnDel);

      actions.append(castCluster, tbCluster);

      row.append(poster, info, actions);
      row.addEventListener('click', (ev) => {
        // Ignora click che provengono dai cluster bottoni
        if (ev.target.closest('.btn-cluster')) return;
        item.classList.toggle('open');
        if (item.classList.contains('open')) ensureFilesLoaded();
      });
      item.append(row);

      // Files panel (lazy-loaded on first expand).
      const fwrap = el('div','files');
      fwrap.append(el('div','empty','Carico i files…'));
      let filesLoaded = false;
      let filesLoading = false;
      async function ensureFilesLoaded(){
        if (filesLoaded || filesLoading) return;
        filesLoading = true;
        try {
          const r = await fetch('/torbox/' + encodeURIComponent(userId) + '/library/torrent/' + encodeURIComponent(t.id) + '/files');
          const data = await r.json();
          if (!r.ok) {
            fwrap.innerHTML = '';
            fwrap.append(el('div','empty', 'Errore: ' + (data.error || 'caricamento fallito')));
            return;
          }
          renderFilesPanel(t, Array.isArray(data.files) ? data.files : [], fwrap);
          filesLoaded = true;
        } catch (e) {
          fwrap.innerHTML = '';
          fwrap.append(el('div','empty', 'Errore di rete: ' + (e.message || e)));
        } finally {
          filesLoading = false;
        }
      }
      item.append(fwrap);

      return item;
    }

    // Renders the file list inside an expanded torrent row. Receives the live
    // files[] from /library/torrent/:id/files (lazy-loaded).
    function renderFilesPanel(t, files, fwrap){
      fwrap.innerHTML = '';
      if (!files.length) {
        fwrap.append(el('div','empty','TorBox non ha ancora elencato i files (probabilmente in download).'));
        return;
      }
      files.forEach((f, idx) => {
        const fname = f.name || f.short_name || ('file ' + idx);
        const fr = el('div','file-row');
        const isV = isVideo(fname);
        const isSmp = isSampleOrTrailer(fname);
        const cleanName = String(fname).split('/').pop();
        const fn = el('div','file-name');
        fn.innerHTML = '<span class="ic">' + (isV && !isSmp ? '🎬' : (isSmp ? '🎞️' : '📄')) + '</span>';
        fn.append(document.createTextNode(cleanName));
        fn.title = fname;
        const fs = el('div','file-size', fmtBytes(f.size));
        const ba = el('button','btn-icon cast');
        ba.textContent = 'Cast';
        const key = (t.hash || '').toLowerCase() + '|' + (f.id ?? f.file_id ?? '');
        ba.dataset.castKey = key;
        ba.dataset.castRole = 'manual';
        ba.addEventListener('click', (ev) => { ev.stopPropagation(); openCastModal(t, f, { item: fwrap.parentElement, fwrap }); });
        if (!isV) { ba.disabled = true; ba.title = 'Non è un file video'; ba.style.opacity = .35; ba.style.cursor='not-allowed'; }
        if (castedKeys.has(key)) {
          ba.textContent = '✓ Castato';
          ba.style.background = 'rgba(52,211,153,.2)';
          ba.style.border = '1px solid rgba(52,211,153,.4)';
          ba.style.color = '#a7f3d0';
        }
        const bAuto = el('button','btn-icon cast');
        bAuto.textContent = '🪄 Auto';
        bAuto.title = 'Cerca IMDb su ICVdb e fai cast automatico';
        bAuto.dataset.castKey = key;
        bAuto.dataset.castRole = 'auto';
        if (!isV || castedKeys.has(key)) {
          bAuto.disabled = true;
          bAuto.style.opacity = .35;
          bAuto.style.cursor = 'not-allowed';
        }
        bAuto.addEventListener('click', async (ev) => {
          ev.stopPropagation();
          bAuto.disabled = true; bAuto.textContent = '…';
          try {
            const r = await fetch('/torbox/' + encodeURIComponent(userId) + '/library/auto-cast', {
              method:'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({
                torrentId: t.id, infoHash: t.hash,
                fileId: f.id ?? f.file_id ?? '', fileIndex: f.id ?? 0,
                filename: fname, title: t.name, size: f.size
              })
            });
            const data = await r.json();
            if (data.ok) {
              bAuto.textContent = '✓ ' + (data.cast?.imdb_id || 'ok');
              bAuto.style.background = 'rgba(52,211,153,.2)';
              bAuto.style.border = '1px solid rgba(52,211,153,.4)';
              bAuto.style.color = '#a7f3d0';
              ba.textContent = '✓ Castato';
              ba.style.background = 'rgba(52,211,153,.2)';
              ba.style.border = '1px solid rgba(52,211,153,.4)';
              ba.style.color = '#a7f3d0';
              castedKeys.add(key);
            } else {
              bAuto.textContent = '✗ ' + (data.reason || 'no match');
              bAuto.style.background = 'rgba(248,113,113,.18)';
              bAuto.style.border = '1px solid rgba(248,113,113,.4)';
              bAuto.style.color = '#fecaca';
              bAuto.title = 'ICVdb: ' + (data.reason || 'nessun match — usa Cast manuale');
            }
          } catch (e) {
            bAuto.textContent = '✗ err';
            bAuto.title = e.message || 'errore';
          }
        });
        fr.append(fn, fs, bAuto, ba);
        fwrap.append(fr);
      });
    }

    // ---- Cast modal ----
    let modalCtx = null;
    function openCastModal(torrent, file, ctx){
      modalCtx = { torrent, file, item: (ctx && ctx.item) || null, fwrap: (ctx && ctx.fwrap) || null };
      const fname = file.name || file.short_name || '';
      $('modalTitle').textContent = 'Cast su Stremio';
      $('modalFile').textContent = String(fname).split('/').pop() + ' · ' + fmtBytes(file.size);
      const se = parseSE(fname);
      const isSeries = se.season > 0 && se.episode > 0;
      $('mType').value = isSeries ? 'series' : 'movie';
      $('mSeason').value = se.season || '';
      $('mEpisode').value = se.episode || '';
      $('mImdb').value = '';
      // Pre-fill the search box with a cleaned title guess.
      const guess = guessTitleFromFilename(torrent.name || fname);
      $('mSearch').value = guess;
      $('mSearchResults').style.display = 'none';
      $('mSearchResults').innerHTML = '';
      onTypeChange();
      $('modalBg').classList.add('open');
      setTimeout(() => $('mSearch').focus(), 50);
    }

    // Best-effort: strip year/quality/release tags so the remainder is closer to the show title.
    function guessTitleFromFilename(s){
      let t = String(s || '').split('/').pop();
      t = t.replace(/\.[a-z0-9]{2,4}$/i, '');                            // extension
      t = t.replace(/\[[^\]]*\]/g, ' ').replace(/\([^)]*\)/g, ' ');     // [..] (..)
      t = t.replace(/[._]+/g, ' ');                                       // dots/underscores
      const cut = t.search(/\b(19\d{2}|20\d{2}|S\d{1,2}E\d{1,3}|S\d{1,2}|2160p|1080p|720p|480p|WEB|BluRay|HDR|H\.?26[45]|x26[45]|HEVC|AAC|AC3|DDP|MULTi|ITA|ENG|REMUX|REPACK|PROPER|DV|BDRip|BRRip|DVDRip|WEBRip|HDRip|TS|CAM)\b/i);
      if (cut > 3) t = t.slice(0, cut);
      // Remove any leftover stray punctuation / unbalanced brackets that
      // would surface things like "From )" in the search field.
      t = t.replace(/[()\[\]{}<>]/g, ' ');
      t = t.replace(/[\-_:\|]+$/g, ' ');
      const cleaned = t.trim().replace(/\s+/g, ' ').slice(0, 60);
      // If nothing meaningful remains, leave the field empty.
      if (!/[a-z0-9]/i.test(cleaned)) return '';
      return cleaned;
    }
    function closeModal(){
      $('modalBg').classList.remove('open');
      modalCtx = null;
    }
    function onTypeChange(){
      $('seWrap').style.display = $('mType').value === 'series' ? 'grid' : 'none';
    }
    $('mType').addEventListener('change', onTypeChange);
    $('mCancel').addEventListener('click', closeModal);
    $('modalBg').addEventListener('click', (e) => { if (e.target === $('modalBg')) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('modalBg').classList.contains('open')) closeModal(); });

    // ---- TMDB search inside the cast modal ----
    async function runTitleSearch(){
      const q = $('mSearch').value.trim();
      const type = $('mType').value;
      const box = $('mSearchResults');
      if (q.length < 2) { box.style.display = 'none'; box.innerHTML = ''; return; }
      box.style.display = 'block';
      box.innerHTML = '<div style="padding:8px;opacity:.7;font-size:13px">🔍 Cerco su TMDB…</div>';
      try {
        const r = await fetch('/torbox/' + encodeURIComponent(userId) + '/tmdb-search?type=' + encodeURIComponent(type) + '&q=' + encodeURIComponent(q));
        const data = await r.json();
        if (!r.ok) { box.innerHTML = '<div style="padding:8px;color:#fca5a5;font-size:13px">' + (data.error || 'Errore TMDB') + '</div>'; return; }
        const results = Array.isArray(data.results) ? data.results : [];
        if (results.length === 0) { box.innerHTML = '<div style="padding:8px;opacity:.7;font-size:13px">Nessun risultato. Prova un titolo diverso o cambia tipo.</div>'; return; }
        box.innerHTML = '';
        results.forEach(item => {
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;gap:10px;padding:8px;border-radius:8px;cursor:pointer;transition:background .15s;align-items:center';
          row.onmouseover = () => row.style.background = 'rgba(168,85,247,.15)';
          row.onmouseout  = () => row.style.background = 'transparent';
          const img = document.createElement('img');
          img.src = item.poster || '';
          img.alt = '';
          img.style.cssText = 'width:48px;height:72px;object-fit:cover;border-radius:4px;background:#222;flex:0 0 auto';
          img.onerror = () => { img.style.display = 'none'; };
          const txt = document.createElement('div');
          txt.style.cssText = 'flex:1;min-width:0';
          const ttl = document.createElement('div');
          ttl.style.cssText = 'font-weight:600;font-size:14px;line-height:1.25;color:#e9d5ff';
          ttl.textContent = (item.title || '(senza titolo)') + (item.year ? ' (' + item.year + ')' : '');
          const sub = document.createElement('div');
          sub.style.cssText = 'font-size:11px;opacity:.65;margin-top:2px';
          sub.textContent = (item.original && item.original !== item.title ? item.original + ' · ' : '') + 'TMDB ' + item.tmdbId + (item.imdbId ? ' · ' + item.imdbId : ' · (no IMDb)');
          txt.append(ttl, sub);
          const pickBtn = document.createElement('button');
          pickBtn.type = 'button';
          pickBtn.className = 'confirm';
          pickBtn.style.cssText = 'padding:6px 12px;font-size:12px;flex:0 0 auto';
          pickBtn.textContent = item.imdbId ? '✓ Usa' : '— no IMDb';
          pickBtn.disabled = !item.imdbId;
          pickBtn.onclick = (e) => { e.stopPropagation(); pickResult(item); };
          row.onclick = () => { if (item.imdbId) pickResult(item); };
          row.append(img, txt, pickBtn);
          box.append(row);
        });
      } catch (e) {
        box.innerHTML = '<div style="padding:8px;color:#fca5a5;font-size:13px">Errore rete: ' + (e.message || e) + '</div>';
      }
    }
    function pickResult(item){
      $('mImdb').value = item.imdbId || '';
      $('mSearchResults').style.display = 'none';
      $('mSearchResults').innerHTML = '';
      showToast('IMDb impostato: ' + item.imdbId, 'ok');
      if ($('mType').value === 'series') {
        // jump to season field if empty so the user can fill S/E quickly
        if (!$('mSeason').value) setTimeout(() => $('mSeason').focus(), 50);
      }
    }
    $('mSearchBtn').addEventListener('click', runTitleSearch);
    $('mSearch').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); runTitleSearch(); } });

    $('mConfirm').addEventListener('click', async () => {
      if (!modalCtx) return;
      const { torrent, file, item, fwrap } = modalCtx;
      const type = $('mType').value;
      const imdbId = $('mImdb').value.trim();
      if (!/^tt\\d+$/.test(imdbId)) { showToast('IMDb ID non valido (es. tt9813792)', 'err'); return; }
      const season = Number($('mSeason').value || 0);
      const episode = Number($('mEpisode').value || 0);
      if (type === 'series' && (!season || !episode)) { showToast('Stagione ed episodio obbligatori per le serie', 'err'); return; }

      const body = {
        torrentId: torrent.id,
        infoHash: torrent.hash,
        fileId: file.id ?? file.file_id,
        filename: file.name || file.short_name,
        title: torrent.name,
        size: file.size || torrent.size,
        type,
        imdbId,
        season: type === 'series' ? season : 0,
        episode: type === 'series' ? episode : 0
      };
      const btn = $('mConfirm');
      btn.disabled = true;
      btn.textContent = 'Salvataggio...';
      let ok = false;
      try {
        const r = await fetch('/torbox/' + encodeURIComponent(userId) + '/library/cast', {
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify(body)
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          showToast(data.error || ('Errore cast (HTTP ' + r.status + ')'), 'err');
          return;
        }
        ok = true;
        showToast('✅ Castato! Apri Stremio per vedere lo stream.', 'ok');
        const key = (torrent.hash || '').toLowerCase() + '|' + (file.id ?? file.file_id ?? '');
        castedKeys.add(key);
        // If the torrent's file panel is closed, open it so the user sees the result.
        if (item && !item.classList.contains('open')) {
          item.classList.add('open');
          if (fwrap) {
            try { await reloadFilesPanel(torrent, item, fwrap); } catch (_) {}
          }
          setTimeout(() => item.querySelector('.files')?.scrollIntoView({behavior:'smooth',block:'nearest'}), 120);
        }
        // Update the file-row button(s) in place, without closing/re-rendering the panel.
        document.querySelectorAll('button[data-cast-key="' + CSS.escape(key) + '"]').forEach(b => {
          if (b.dataset.castRole === 'manual') {
            b.textContent = '✓ Castato';
            b.disabled = false;
            b.style.background = 'rgba(52,211,153,.2)';
            b.style.border = '1px solid rgba(52,211,153,.4)';
            b.style.color = '#a7f3d0';
          } else if (b.dataset.castRole === 'auto') {
            b.disabled = true;
            b.style.opacity = .45;
            b.style.cursor = 'not-allowed';
          }
        });
        closeModal();
        paintStats();
      } catch (e) {
        showToast('Errore di rete: ' + (e && e.message ? e.message : 'sconosciuto'), 'err');
      } finally {
        // Always reset the button so the modal can't get stuck on "Salvataggio..."
        if (!ok) {
          btn.disabled = false;
          btn.textContent = 'Cast su Stremio';
        } else {
          // Reset for the next open as well (closeModal hides but doesn't reset state)
          btn.disabled = false;
          btn.textContent = 'Cast su Stremio';
        }
      }
    });

    // ---- handlers ----
    $('btnReload').addEventListener('click', loadAll);
    $('filter').addEventListener('input', render);
    $('sort').addEventListener('change', render);
    $('statusFilter').addEventListener('change', render);
    $('lnkSettings').addEventListener('click', () => {
      const uid = localStorage.getItem('dmvUserId');
      if (uid) location.href = '/torbox/' + encodeURIComponent(uid) + '/settings';
    });
    $('btnLogout').addEventListener('click', () => {
      localStorage.removeItem('dmvUserId');
      localStorage.removeItem('dmvManifestUrl');
      localStorage.removeItem('dmvApiKeyLast4');
      localStorage.removeItem('dmvUsername');
      window.location.href = '/login';
    });

    loadAll();
  </script>
</body>
</html>`;
}

function renderSettingsPage() {
  return `<!doctype html>
<html lang="it"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Impostazioni · DMV🟣 Debrid Manager Viola</title>
<style>
  :root{--bg:#0a0014;--bg2:#13041f;--card:#1a0a2e;--accent:#a855f7;--accent2:#ec4899;--text:#e0e0e0;--muted:#94a3b8;--border:rgba(168,85,247,.35)}
  *{box-sizing:border-box}
  body{margin:0;background:linear-gradient(180deg,var(--bg),var(--bg2));color:var(--text);font-family:-apple-system,Segoe UI,Roboto,sans-serif;min-height:100vh}
  .wrap{max-width:780px;margin:0 auto;padding:24px}
  header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px}
  header h1{margin:0;font-size:20px;background:linear-gradient(90deg,var(--accent),var(--accent2));-webkit-background-clip:text;color:transparent}
  .links a{color:var(--accent);text-decoration:none;margin-left:14px;font-size:13px}
  .card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px;margin-bottom:18px}
  .card h2{margin:0 0 8px;font-size:15px;color:#d8b4fe}
  .card p.sub{margin:0 0 14px;color:var(--muted);font-size:12px;line-height:1.5}
  .row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 0;border-bottom:1px dashed rgba(168,85,247,.15)}
  .row:last-child{border-bottom:none}
  .row .label{font-size:13px;flex:1}
  .row .label small{display:block;color:var(--muted);font-weight:400;margin-top:2px}
  select,input[type=number]{background:rgba(0,0,0,.35);color:#fff;border:1px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;min-width:180px;max-width:100%}
  input[type=checkbox]{width:22px;height:22px;accent-color:var(--accent)}
  .actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
  button.primary{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none;padding:12px 22px;border-radius:10px;font-weight:700;cursor:pointer;font-size:14px;min-height:44px}
  button.secondary{background:transparent;color:#d8b4fe;border:1px solid var(--border);padding:12px 18px;border-radius:10px;cursor:pointer;font-size:14px;min-height:44px}
  .install-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  .install-row a{display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:#fff;background:rgba(168,85,247,.18);border:1px solid var(--border);padding:10px 14px;border-radius:10px;font-size:13px;font-weight:600;min-height:40px}
  .install-row a.alt{background:rgba(255,255,255,.04);color:var(--muted)}
  code.url{display:block;background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:8px 10px;font-size:11px;margin-top:6px;color:#cbd5e1;word-break:break-all}
  #toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0a0014;border:1px solid var(--border);padding:10px 16px;border-radius:10px;font-size:13px;display:none;z-index:99;max-width:calc(100vw - 32px);text-align:center}
  #toast.ok{border-color:#34d399;color:#a7f3d0}
  #toast.err{border-color:#f87171;color:#fecaca}
  @media (max-width:560px){
    .wrap{padding:16px}
    .row{flex-direction:column;align-items:stretch;gap:6px}
    .row .label{font-size:13px}
    select,input[type=number]{width:100%;min-width:0}
    .install-row a{flex:1 1 calc(50% - 4px);justify-content:center;min-height:44px}
    .actions button{flex:1 1 100%}
    header h1{font-size:18px}
    .links a{margin-left:0;margin-right:14px}
  }
</style></head><body>
<div class="wrap">
  <header>
    <h1>⚙️ Impostazioni DMV🟣 Cast</h1>
    <div class="links">
      <a href="javascript:void(0)" id="lnkLib">🗂️ Libreria</a>
      <a href="javascript:void(0)" id="lnkCast">📡 Cast</a>
      <a href="javascript:void(0)" id="lnkLogout">Esci</a>
    </div>
  </header>

  <div class="card" id="installCard">
    <h2>📦 Installa l'addon su Stremio</h2>
    <p class="sub">Hai due varianti: <b>completa</b> (con cataloghi visibili in Home e Scopri) o <b>solo stream</b> (nessun catalogo, nessuna riga nella Home).</p>
    <div style="margin-bottom:10px"><b style="font-size:12px;color:#d8b4fe">VERSIONE COMPLETA · con cataloghi</b></div>
    <div class="install-row">
      <a id="instFull" href="#">⚡ Installa</a>
      <a id="instFullWeb" href="#" target="_blank" class="alt">🌐 Stremio Web</a>
      <a href="#" id="copyFull" class="alt" data-copy="full">📋 Copia manifest</a>
    </div>
    <code class="url" id="urlFull">—</code>
    <div style="margin:14px 0 10px"><b style="font-size:12px;color:#94a3b8">VERSIONE NO-CATALOG · solo stream</b></div>
    <div class="install-row">
      <a id="instNC" href="#" class="alt">⚡ Installa</a>
      <a id="instNCWeb" href="#" target="_blank" class="alt">🌐 Stremio Web</a>
      <a href="#" id="copyNC" class="alt" data-copy="nc">📋 Copia manifest</a>
    </div>
    <code class="url" id="urlNC">—</code>
  </div>

  <div class="card" id="catalogCard">
    <h2>🏠 Catalogo Stremio</h2>
    <p class="sub">Cosa esporre come catalogo nella Home / sezione Scopri di Stremio. <b>Ricorda</b> di reinstallare l'addon dopo aver cambiato il <b>modo</b> o la <b>sorgente</b> (Stremio fa cache del manifest).</p>

    <!-- Visible only while catalog_mode or catalog_source differ from the
         loaded values. Populated by JS on every change of those two selects. -->
    <div id="reinstallBanner" style="display:none;margin:0 0 14px;padding:12px 14px;border-radius:10px;background:linear-gradient(135deg,rgba(251,191,36,0.18),rgba(236,72,153,0.18));border:1px solid rgba(251,191,36,0.55);color:#fde68a;font-size:13px;line-height:1.5;">
      ⚠️ <b>Modifica al catalogo rilevata</b> — dopo aver salvato dovrai <b>reinstallare l'addon</b> in Stremio (Stremio fa cache del manifest e non vedrà i nuovi cataloghi finché non rimuovi e reinstalli dal pannello Addon).
    </div>
    <div class="row">
      <div class="label">Modalità catalogo
        <small><b>full</b> = catalogo visibile in Home e Scopri · <b>off</b> = nessun catalogo</small>
      </div>
      <select id="catalog_mode">
        <option value="full">full — completo</option>
        <option value="off">off — nessun catalogo</option>
      </select>
    </div>
    <div class="row">
      <div class="label">Sorgente catalogo
        <small><b>casts</b> = solo cast salvati · <b>library</b> = tutta la libreria TorBox riconosciuta da ICVdb · <b>both-merged</b> = uniti in un solo elenco · <b>both-split</b> = due righe separate "Cast" + "Libreria"</small>
      </div>
      <select id="catalog_source">
        <option value="casts">casts — solo cast</option>
        <option value="library">library — solo libreria</option>
        <option value="both-merged">both-merged — uniti</option>
        <option value="both-split">both-split — sdoppiati</option>
      </select>
    </div>
    <div class="row">
      <div class="label">Ordine catalogo CAST
        <small>Come ordinare i titoli nel catalogo dei cast</small>
      </div>
      <select id="catalog_sort_casts">
        <option value="recent">più recenti prima</option>
        <option value="oldest">più vecchi prima</option>
        <option value="biggest">più grandi prima</option>
        <option value="smallest">più piccoli prima</option>
      </select>
    </div>
    <div class="row">
      <div class="label">Ordine catalogo LIBRERIA
        <small>Come ordinare i titoli nel catalogo della libreria TorBox</small>
      </div>
      <select id="catalog_sort_library">
        <option value="recent">più recenti prima</option>
        <option value="oldest">più vecchi prima</option>
        <option value="biggest">più grandi prima</option>
        <option value="smallest">più piccoli prima</option>
      </select>
    </div>
  </div>

  <div class="card">
    <h2>🎬 Stream nella schermata episodio/film</h2>
    <p class="sub">Quando apri un titolo, l'addon può mostrare sia i tuoi <b>cast</b> sia la tua <b>libreria TorBox</b> riconosciuta tramite ICVdb (anche file non ancora castati).</p>
    <div class="row">
      <div class="label">Includi anche la libreria TorBox<small>Streams ricavati da TUTTI i torrent del tuo account, anche se non castati</small></div>
      <input type="checkbox" id="include_library_streams">
    </div>
    <div class="row">
      <div class="label">Ordine sorgenti<small>Quali stream mostrare per primi nella lista</small></div>
      <select id="stream_order">
        <option value="cast-first">Prima i cast salvati</option>
        <option value="library-first">Prima la libreria</option>
        <option value="mixed">Misto (alternati)</option>
      </select>
    </div>
    <div class="row">
      <div class="label">Ordinamento interno<small>Come ordinare gli stream all'interno di ogni gruppo</small></div>
      <select id="stream_sort">
        <option value="size-desc">Dimensione (più grande prima)</option>
        <option value="size-asc">Dimensione (più piccolo prima)</option>
        <option value="quality">Qualità (4K → 480p)</option>
      </select>
    </div>
    <div class="row">
      <div class="label">🤝 Compatibilità AIOStreams
        <small>Formatta nome/titolo nello stile riconosciuto da <b>AIOStreams</b> (<code>TB⚡</code> + righe icona). Disattivalo per il look DMV nativo. Non richiede reinstallazione dell'addon.</small>
      </div>
      <input type="checkbox" id="aiostreams_mode">
    </div>
  </div>

  <div class="actions">
    <button class="primary" id="btnSave">💾 Salva impostazioni</button>
    <button class="secondary" id="btnBack">← Indietro</button>
  </div>
</div>
<div id="toast"></div>
<script>
  const $ = (id) => document.getElementById(id);
  const userId = localStorage.getItem('dmvUserId');
  if (!userId) location.href = '/login';

  function toast(msg, kind) {
    const t = $('toast'); t.textContent = msg; t.className = kind || '';
    t.style.display = 'block'; setTimeout(() => t.style.display = 'none', 2400);
  }

  $('lnkLib').onclick = () => location.href = '/torbox/' + encodeURIComponent(userId) + '/library';
  $('lnkCast').onclick = () => location.href = '/cast';
  $('lnkLogout').onclick = () => {
    localStorage.removeItem('dmvUserId');
    localStorage.removeItem('dmvManifestUrl');
    localStorage.removeItem('dmvApiKeyLast4');
    localStorage.removeItem('dmvUsername');
    location.href = '/login';
  };
  $('btnBack').onclick = () => history.length > 1 ? history.back() : location.href = '/torbox/' + encodeURIComponent(userId) + '/library';

  async function load() {
    const r = await fetch('/torbox/' + encodeURIComponent(userId) + '/settings/data');
    const data = await r.json();
    if (!r.ok) return toast(data.error || 'Errore', 'err');
    const s = data.settings;
    $('catalog_mode').value = s.catalog_mode;
    $('catalog_source').value = s.catalog_source;
    $('catalog_sort_casts').value = s.catalog_sort_casts;
    $('catalog_sort_library').value = s.catalog_sort_library;
    $('include_library_streams').checked = !!s.include_library_streams;
    $('stream_order').value = s.stream_order;
    $('stream_sort').value = s.stream_sort;
    $('aiostreams_mode').checked = !!s.aiostreams_mode;
    // install links
    const full = data.manifestUrlFull, nc = data.manifestUrlNoCatalog;
    const stremioFull = 'stremio://' + full.replace(/^https?:\\/\\//, '');
    const stremioNC = 'stremio://' + nc.replace(/^https?:\\/\\//, '');
    const webFull = 'https://web.stremio.com/#/addons?addon=' + encodeURIComponent(full);
    const webNC = 'https://web.stremio.com/#/addons?addon=' + encodeURIComponent(nc);
    $('instFull').href = stremioFull;
    $('instFullWeb').href = webFull;
    $('instNC').href = stremioNC;
    $('instNCWeb').href = webNC;
    $('urlFull').textContent = full;
    $('urlNC').textContent = nc;
    // Copy-to-clipboard for both manifests
    const setCopyHandler = (btnId, url) => {
      const el = $(btnId);
      if (!el) return;
      el.onclick = async (ev) => {
        ev.preventDefault();
        const orig = el.textContent;
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(url);
          } else {
            const ta = document.createElement('textarea');
            ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }
          el.textContent = '✅ Copiato!';
        } catch (_) {
          el.textContent = '❌ Errore';
        }
        setTimeout(() => { el.textContent = orig; }, 1600);
      };
    };
    setCopyHandler('copyFull', full);
    setCopyHandler('copyNC', nc);

    // Track the loaded values for the two fields that REQUIRE a reinstall when
    // changed (manifest declaration changes → Stremio caches the old one).
    // The banner shows only while either select differs from its loaded value.
    const initialCatalogMode = s.catalog_mode;
    const initialCatalogSource = s.catalog_source;
    function refreshReinstallBanner() {
      const changed = $('catalog_mode').value !== initialCatalogMode
                   || $('catalog_source').value !== initialCatalogSource;
      $('reinstallBanner').style.display = changed ? 'block' : 'none';
    }
    $('catalog_mode').addEventListener('change', refreshReinstallBanner);
    $('catalog_source').addEventListener('change', refreshReinstallBanner);
  }

  $('btnSave').onclick = async () => {
    const body = {
      catalog_mode: $('catalog_mode').value,
      catalog_source: $('catalog_source').value,
      catalog_sort_casts: $('catalog_sort_casts').value,
      catalog_sort_library: $('catalog_sort_library').value,
      include_library_streams: $('include_library_streams').checked,
      stream_order: $('stream_order').value,
      stream_sort: $('stream_sort').value,
      aiostreams_mode: $('aiostreams_mode').checked
    };
    $('btnSave').disabled = true; $('btnSave').textContent = 'Salvataggio…';
    try {
      const r = await fetch('/torbox/' + encodeURIComponent(userId) + '/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      if (!r.ok) return toast(data.error || 'Errore', 'err');
      toast('✅ Salvato — reinstalla l\\'addon se hai cambiato il catalogo', 'ok');
    } catch (e) {
      toast('Errore di rete', 'err');
    } finally {
      $('btnSave').disabled = false; $('btnSave').textContent = '💾 Salva impostazioni';
    }
  };

  load();
</script>
</body></html>`;
}

module.exports = { renderHomePage, renderLoginPage, renderCastPage, renderLibraryPage, renderSettingsPage };