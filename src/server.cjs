require('dotenv').config();

const express = require('express');
const { initDatabase } = require('./db.cjs');
const { createRouter } = require('./routes.cjs');

const app = express();
const port = Number(process.env.PORT || 7878);

initDatabase();

app.set('trust proxy', true);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS for Stremio (manifest/stream endpoints are fetched cross-origin from web.stremio.com)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(createRouter());

app.listen(port, () => {
  console.log(`[DMV] Debrid Manager Viola listening on port ${port}`);
});
