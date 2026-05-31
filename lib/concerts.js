'use strict';

// Reads concert data from public/concerts.json — a file committed to the repo
// and kept fresh by the GitHub Actions scraper (scripts/scrape.js, every 30 min).
// Each Vercel deploy picks up the latest version of the file.

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'public', 'concerts.json');

function load() {
  if (!fs.existsSync(DATA_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}

async function getConcerts(dateStr) {
  return (load().concerts || []).filter(c => c.date === dateStr);
}

function getUpdatedAt() {
  return load().updatedAt || null;
}

// Returns YYYY-MM-DD in Europe/Brussels timezone, offset by days from base date.
function toDateStr(base, offsetDays) {
  return new Date(base.getTime() + offsetDays * 86400000)
    .toLocaleDateString('en-CA', { timeZone: 'Europe/Brussels' });
}

module.exports = { getConcerts, toDateStr, getUpdatedAt };
