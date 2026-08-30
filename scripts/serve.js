#!/usr/bin/env node
/**
 * Serves src/ over HTTP for local viewing.
 *
 *   node scripts/serve.js [port]
 *
 * The catalog is loaded with fetch(), which browsers refuse to do for file://
 * URLs, so opening src/index.html from disk shows an empty page. This exists
 * so viewing the site locally needs no network and no dependencies — Netlify
 * still serves src/ as-is, and nothing here is deployed.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');
const PORT = Number(process.argv[2]) || 8000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(ROOT, url);

  // Never serve anything outside src/, whatever the URL claims.
  if (!file.startsWith(ROOT)) {
    res.writeHead(403, { 'content-type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // A bare directory, or an extensionless path, means index.html.
  if (url.endsWith('/') || !path.extname(file)) {
    file = path.join(file, 'index.html');
  }

  fs.readFile(file, (err, body) => {
    if (err) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found\n\n${path.relative(ROOT, file)}`);
      console.log(`  404  ${url}`);
      return;
    }
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      // Hand-edited JSON should show up on reload, not come back from cache.
      'cache-control': 'no-store',
    });
    res.end(body);
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try: node scripts/serve.js ${PORT + 1}`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`Pussycat catalog: http://localhost:${PORT}/`);
  console.log('Ctrl+C to stop.');
});
