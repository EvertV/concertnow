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
const handlers = {
  '/':           require('./api/index'),
  '/api/refresh': require('./api/refresh'),
  '/api/poll':    require('./api/poll'),
};

const MIME = { '.css': 'text/css', '.js': 'application/javascript', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };

const server = http.createServer(async (req, res) => {
  const pathname = req.url.split('?')[0];
  // Serve static files from /public
  const filePath = path.join(__dirname, 'public', pathname);
  const ext = path.extname(filePath);
  if (ext && fs.existsSync(filePath)) {
    res.setHeader('Content-Type', MIME[ext] || 'text/plain');
    fs.createReadStream(filePath).pipe(res);
    return;
  }
  // Route to matching API handler
  const handler = handlers[pathname] || handlers['/'];
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
