'use strict';

// GET /api/poll?after=<ISO> — returns status of the most recent workflow_dispatch
// run created at or after the given timestamp.

const REPO = 'EvertV/concertnow';
const WORKFLOW = 'scrape.yml';

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const token = process.env.GITHUB_PAT;
  if (!token) {
    res.writeHead(503);
    res.end(JSON.stringify({ error: 'not configured' }));
    return;
  }

  const { searchParams } = new URL(req.url, 'http://localhost');
  const after = searchParams.get('after');

  try {
    const r = await fetch(
      `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/runs?per_page=5&event=workflow_dispatch`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'concertnow-app',
        },
      }
    );
    const data = await r.json();
    const runs = data.workflow_runs || [];
    // Allow 15s buffer: GitHub creates the run slightly before we record triggeredAt
    const afterMs = after ? new Date(after).getTime() - 15000 : null;
    const run = afterMs
      ? runs.find(r => new Date(r.created_at).getTime() >= afterMs)
      : runs[0];

    if (!run) {
      res.end(JSON.stringify({ status: 'queued' }));
      return;
    }

    res.end(JSON.stringify({
      status: run.status,         // queued | in_progress | completed
      conclusion: run.conclusion, // success | failure | cancelled | null
    }));
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
};
