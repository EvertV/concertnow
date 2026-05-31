'use strict';

// Load .env.local for local dev (no dotenv dep).
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
}

const http = require('http');
const handler = require('./api/index');

const MIME = { '.css': 'text/css', '.js': 'application/javascript', '.ico': 'image/x-icon' };

const server = http.createServer(async (req, res) => {
  // Serve static files from /public
  if (req.url !== '/' && !req.url.startsWith('/?')) {
    const filePath = path.join(__dirname, 'public', req.url.split('?')[0]);
    const ext = path.extname(filePath);
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', MIME[ext] || 'text/plain');
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }
  // Everything else → serverless handler
  try {
    await handler(req, res);
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`ConcertNow → http://localhost:${PORT}`));
