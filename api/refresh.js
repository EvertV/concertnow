'use strict';

// POST /api/refresh — triggers the GitHub Actions scrape workflow via workflow_dispatch.
// Requires GITHUB_PAT env var with `workflow` + `actions:read` scopes.

const REPO = 'EvertV/concertnow';
const WORKFLOW = 'scrape.yml';

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') { res.writeHead(405); res.end('{}'); return; }

  const token = process.env.GITHUB_PAT;
  if (!token) {
    res.writeHead(503);
    res.end(JSON.stringify({ error: 'GITHUB_PAT not configured' }));
    return;
  }

  try {
    const r = await fetch(
      `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
          'User-Agent': 'concertnow-app',
        },
        body: JSON.stringify({ ref: 'main' }),
      }
    );
    if (!r.ok) {
      res.writeHead(502);
      res.end(JSON.stringify({ error: `GitHub responded ${r.status}` }));
      return;
    }
    // GitHub returns 204 No Content on success — no run ID yet.
    // Frontend will poll /api/poll?after=<triggeredAt> to find the run.
    res.writeHead(200);
    res.end(JSON.stringify({ triggered: true, triggeredAt: new Date().toISOString() }));
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
};
