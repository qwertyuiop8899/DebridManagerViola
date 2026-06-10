# DMV Debrid Manager Viola

Standalone workspace for an ICV/DMM-style TorBox cast system.

This folder is intentionally separate from the current dbmanager and addon code. It has its own package, DB helper, Express routes, and server entrypoint, so development can continue here without importing or modifying files from the parent project.

## Status - 2026-06-06

DMV is currently a standalone local prototype. The server was started and tested on `http://localhost:7878`, then stopped on request. No production deploy has been done and no production database migration has been run.

The intended behavior matches the DMM-style flow:

1. User saves a TorBox API key in DMV.
2. DMV creates a stable personal `userId` and returns a personal Stremio manifest URL.
3. User casts a torrent/file to DMV for a specific IMDb ID.
4. Stremio opens the same IMDb ID through the personal manifest.
5. DMV returns the previously saved cast as a playable stream.

For series, the lookup is `userId + imdb_id + type + season + episode`. For movies, season and episode are stored as `0`.

## Done So Far

- Created a separate `dmv-debrid-manager-viola` folder.
- Added standalone `package.json` with local scripts and dependencies.
- Added `.env.example` for DB, base URL, TorBox API base, and encryption secrets.
- Added PostgreSQL schema draft in `database/schema.sql`.
- Added API key encryption helpers in `src/crypto.cjs`.
- Added standalone DB helper in `src/db.cjs`.
- Added TorBox API wrapper in `src/torbox-service.cjs`.
- Added Stremio manifest and stream helpers in `src/stremio-addon.cjs`.
- Added Express routes in `src/routes.cjs`.
- Added standalone server entrypoint in `src/server.cjs`.
- Added local web UI in `src/ui.cjs`.
- Added profile setup routes.
- Added personal manifest route.
- Added stream route for movie/series IDs.
- Added cast creation route.
- Added play redirect route.
- Added profile status route.
- Added saved-casts list route.
- Added saved-cast delete route.
- Added UI section for saved casts with refresh/delete controls.
- Validated syntax with `npm run check`.
- Smoke-tested `GET /health` and `GET /` locally.
- Confirmed the DMV files do not import parent project files with `../`.

## Current Endpoints

- `GET /health`
- `GET /`
- `GET /login`
- `GET /cast`
- `POST /setup/torbox`
- `POST /torbox/profile`
- `GET /torbox/:userId/profile`
- `GET /torbox/:userId/manifest.json`
- `GET /torbox/:userId/stream/:type/:id.json`
- `POST /torbox/:userId/cast`
- `GET /torbox/:userId/casts`
- `DELETE /torbox/:userId/cast/:castId`
- `GET /torbox/:userId/play/:castId`

## DMM-Style Cast Button (External Manager Contract)

DMV exposes a public landing page for casting. The external dbmanager only needs an `<a>` link, no extra JS, no shared session.

URL format for movies:

```
/cast?type=movie&imdbId=tt1234567&infoHash=<40hexchars>&title=Movie+Name&filename=movie.mkv
```

URL format for series:

```
/cast?type=series&imdbId=tt1234567&season=1&episode=3&infoHash=<40hexchars>&title=Show+Name&filename=episode.mkv
```

Supported query parameters:

- `type`: `movie` or `series` (default `movie`).
- `imdbId`: required, format `tt\d+`.
- `infoHash`: required, 40 hex characters.
- `season`, `episode`: required only for series.
- `tmdbId`, `title`, `filename`, `fileId`, `fileIndex`, `size`: optional.

Behavior:

1. If the browser is not logged in, the page redirects to `/login?return=<original>`.
2. After login, the user is sent back to the cast page.
3. The user confirms by clicking `Cast su TorBox`.
4. DMV calls `POST /torbox/:userId/cast` and confirms.
5. The user opens the same IMDb item in Stremio and sees the cast as a playable stream.

Example HTML link to add to the external dbmanager later (no internal changes required here):

```html
<a href="https://dmv.example.com/cast?type=movie&imdbId=tt1234567&infoHash=ABCDEF...&title=Movie">
  Cast TB
</a>
```

## Database

DMV uses its **own** PostgreSQL database, separate from `icv_db`. Connection details
(host, port, user, password) are **never** committed: they live only in the local `.env`
file of the deployment (or in the platform's secret manager). See `.env.example` for
the variable names.

### Required env variables

Either set a full DSN:

```
DATABASE_URL=postgres://<user>:<password>@<host>:<port>/<db_name>
```

or the discrete pieces:

```
DB_HOST=...
DB_PORT=...
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
```

### Schema bootstrap

1. Create an empty database owned by the DMV app user (out of band, e.g. via your DBA or
   `CREATE DATABASE <name> OWNER <user>;`).
2. Apply the schema from inside this folder:

   ```bash
   psql "$DATABASE_URL" -f database/schema.sql
   ```

   The script is idempotent (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN
   IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`) so it is safe to re-run on upgrades.

### Tables

#### `torbox_profiles`

One row per registered user. The TorBox API key is stored encrypted (AES-256-GCM via
`src/crypto.cjs`); the password is hashed with scrypt. Neither is ever returned in
clear by any endpoint.

| Column                | Type          | Notes                                                                 |
| --------------------- | ------------- | --------------------------------------------------------------------- |
| `user_id`             | TEXT PK       | Stable anonymous id derived from the TorBox email (HMAC, 16 chars).   |
| `email_hash`          | TEXT          | SHA-256 of the lowercased TorBox email (lookup only, not reversible). |
| `api_key_encrypted`   | TEXT NOT NULL | AES-256-GCM ciphertext (iv + tag + payload, base64url).               |
| `api_key_last4`       | TEXT          | Last 4 chars of the key, for UI display only.                         |
| `username`            | TEXT          | Optional human-readable login. Auto-assigned on first setup.          |
| `password_hash`       | TEXT          | `scrypt$N$salt_b64$hash_b64`. Optional; empty until the user sets it. |
| `movie_max_size_gb`   | NUMERIC       | Reserved for future per-user limits.                                  |
| `episode_max_size_gb` | NUMERIC       | Reserved for future per-user limits.                                  |
| `show_other_streams`  | BOOLEAN       | Reserved.                                                             |
| `other_streams_limit` | INTEGER       | Reserved.                                                             |
| `created_at`          | TIMESTAMPTZ   | `NOW()` default.                                                      |
| `updated_at`          | TIMESTAMPTZ   | Bumped on every upsert / credential change.                           |

**Indexes**

- `torbox_profiles_pkey` (PRIMARY KEY on `user_id`)
- `idx_torbox_profiles_username_lower` UNIQUE on `LOWER(username) WHERE username IS NOT NULL`
  (case-insensitive unique username, multiple NULL usernames are allowed)

#### `torbox_casts`

One row per file cast to Stremio. The composite unique key prevents duplicate casts of
the same file for the same user/episode.

| Column                  | Type          | Notes                                                            |
| ----------------------- | ------------- | ---------------------------------------------------------------- |
| `id`                    | UUID PK       | `gen_random_uuid()` default.                                     |
| `user_id`               | TEXT NOT NULL | FK → `torbox_profiles(user_id)` ON DELETE CASCADE.               |
| `imdb_id`               | TEXT NOT NULL | `tt...`.                                                         |
| `tmdb_id`               | TEXT          | Optional.                                                        |
| `type`                  | TEXT NOT NULL | `movie` or `series`.                                             |
| `season`                | INTEGER       | `0` for movies.                                                  |
| `episode`               | INTEGER       | `0` for movies.                                                  |
| `info_hash`             | TEXT NOT NULL | Lowercase 40-hex. Used by the dbmanager to look up the torrent.  |
| `torrent_id`            | TEXT          | TorBox internal torrent id (set after `createTorrent`).          |
| `file_id`               | TEXT NOT NULL | TorBox per-file id (default `''` for movies/auto-picked).        |
| `file_index`            | INTEGER       | Position inside the torrent file list.                           |
| `filename`              | TEXT          | Original file name, used for badges and binge groups.            |
| `title`                 | TEXT          | Human-readable title shown in Stremio.                           |
| `size`                  | BIGINT        | Bytes; surfaces as `videoSize` in the Stremio stream object.     |
| `stream_url`            | TEXT          | Last resolved TorBox CDN URL, cached.                            |
| `stream_url_expires_at` | TIMESTAMPTZ   | TTL of the cached URL; the play route re-requests when expired.  |
| `created_at`            | TIMESTAMPTZ   | `NOW()` default.                                                 |
| `updated_at`            | TIMESTAMPTZ   | Bumped on every upsert / stream URL refresh.                     |

**Constraints**

- `torbox_casts_pkey` (PRIMARY KEY on `id`)
- UNIQUE `(user_id, imdb_id, season, episode, info_hash, file_id)` — primary upsert key
- FK `user_id` → `torbox_profiles(user_id)` ON DELETE CASCADE

**Indexes**

- `idx_torbox_casts_user_imdb` btree `(user_id, imdb_id)` — movie lookup
- `idx_torbox_casts_user_series` btree `(user_id, imdb_id, season, episode)` — episode lookup
- `idx_torbox_casts_hash` btree `(info_hash)` — used by the external dbmanager

### How the app maps to the schema

- Stream lookup (`GET /torbox/:userId/stream/movie/tt....json`): `idx_torbox_casts_user_imdb`.
- Episode lookup (`.../series/tt...:S:E.json`): `idx_torbox_casts_user_series`.
- Cast upsert (`POST /torbox/:userId/cast`): conflict target is the UNIQUE composite key.
- Login by username (`POST /auth/login`): unique partial index on `LOWER(username)`.
- Credential change (`POST /torbox/:userId/credentials`): updates `username` and/or
  `password_hash` only after authenticating with either the current password or the
  current TorBox API key.

### Backup

A logical dump of the two tables is enough to fully restore DMV (the encryption key in
`.env` must be preserved too, otherwise the stored API keys cannot be decrypted):

```bash
pg_dump "$DATABASE_URL" --table=torbox_profiles --table=torbox_casts > dmv-backup.sql
```

## What Is Missing

1. Environment setup
	- Create `.env` from `.env.example`.
	- Set DMV DB (`DB_*`) to point at `dmv_db`.
	- Set ICV DB (`ICV_DB_*`) to point at `icv_db` (only needed if you run `dbmanager.cjs` from this folder; defaults are still hardcoded).
	- Set stable long secrets for `TORBOX_CAST_ENCRYPTION_KEY` and `TORBOX_CAST_USER_SALT`.
	- Set public `BASE_URL` and `DMV_BASE_URL` before installing the manifest in Stremio or wiring Cast TB buttons.

2. Real TorBox API verification
	- Test `validateApiKey` with a real TorBox API key.
	- Test `createTorrent` with a real info hash.
	- Test `requestDownloadLink` with a real TorBox torrent/file.
	- Adjust request/response parsing if TorBox returns fields different from the current assumptions.

3. Pack/file selection
	- DMV can save a `fileId`, but the UI still expects it manually.
	- Need a proper file picker for multi-file torrents/packs.
	- For series, this is essential to map the correct episode file.

4. Integration with the existing manager
	- Add `Cast TB` buttons to the real dbmanager rows/modals later.
	- Keep DMV logic inside this folder.
	- The external manager should only call DMV endpoints instead of duplicating TorBox logic.

5. Security before deploy
	- Protect the setup/cast UI.
	- Avoid exposing profile management publicly without auth.
	- Keep TorBox API keys server-side only.

6. Deploy plan
	- Decide whether DMV runs on the VPS as a separate PM2 process.
	- Decide domain/subdomain/path.
	- Configure reverse proxy and public `BASE_URL`.
	- Test Stremio install using the public manifest URL.

## Next Resume Point

When work resumes, start here:

```bash
cd dmv-debrid-manager-viola
npm run check
```

Then choose one of these next steps:

1. Configure `.env` and run the database schema.
2. Test TorBox API with a real key.
3. Build the pack/file selector.
4. Add a `Cast TB` integration point from the existing dbmanager to DMV.

The fastest path to a working end-to-end MVP is:

1. DB schema.
2. `.env` secrets.
3. Real TorBox test.
4. Cast one movie manually from the DMV UI.
5. Install the personal Stremio manifest and verify playback on the same IMDb ID.

## Local Files

- `package.json`: standalone scripts and dependencies copied down to the DMV project.
- `.env.example`: local environment template.
- `database/schema.sql`: DMV-only PostgreSQL tables.
- `src/server.cjs`: standalone Express entrypoint.
- `src/routes.cjs`: setup, manifest, stream, cast, and play routes.
- `src/ui.cjs`: local manager page served by the standalone app.
- `src/db.cjs`: local PostgreSQL helper for DMV tables.
- `src/crypto.cjs`: API key encryption and user id helpers.
- `src/torbox-service.cjs`: TorBox API wrapper.
- `src/stremio-addon.cjs`: Stremio manifest and stream helpers.

## Target Flow

1. User saves a TorBox API key in the protected manager UI.
2. Backend validates the key with TorBox and creates a stable anonymous `userId`.
3. User installs a personal Stremio manifest URL: `/torbox/:userId/manifest.json`.
4. User casts a torrent/file from the manager.
5. Backend creates or finds the torrent on TorBox, requests a playable link, and stores the cast.
6. Stremio calls the personal stream endpoint and receives only that user's saved casts.

## Run Locally

```bash
cd dmv-debrid-manager-viola
cp .env.example .env
npm install
npm run check
npm start
```

## First Milestone

Movie-only MVP:

- profile save/validate
- encrypted API key storage
- Stremio manifest
- movie stream endpoint
- play proxy endpoint
- cast one movie by info hash

## Suggested Integration Points Later

- dbmanager button: `Cast TB`
- poster modal torrent rows
- pack file modal rows
- episode file modal rows
- manage page for saved casts

Thanks to @debridmediamanager for all the code!

