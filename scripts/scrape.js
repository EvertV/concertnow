'use strict';

// Scrapes TicketSwap venue pages using Playwright and writes
// public/concerts.json which is committed to git by the workflow.
//
// Run locally: node scripts/scrape.js
// CI: GitHub Actions (.github/workflows/scrape.yml) runs this every 30 min.

const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());
const fs = require('fs');
const path = require('path');

const VENUES = [
  { id: 'ab', name: 'Ancienne Belgique', slug: 'ancienne-belgique',             tsId: 208   },
  { id: 'cr', name: 'Cirque Royal',      slug: 'cirque-royal-koninklijk-circus', tsId: 12796 },
  { id: 'bo', name: 'Botanique',         slug: 'botanique',                      tsId: 2008  },
  { id: 'lm', name: 'La Madeleine',      slug: 'la-madeleine',                   tsId: 12174 },
];

function brusselsDate(offsetDays = 0) {
  return new Date(Date.now() + offsetDays * 86400000)
    .toLocaleDateString('en-CA', { timeZone: 'Europe/Brussels' });
}

function brusselsTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels',
  });
}

function brusselsDateFromIso(isoStr) {
  return new Date(isoStr).toLocaleDateString('en-CA', { timeZone: 'Europe/Brussels' });
}

async function scrapeVenue(page, venue, dates) {
  const url = `https://www.ticketswap.com/location/${venue.slug}/${venue.tsId}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  try {
    await page.waitForSelector('#__NEXT_DATA__', { timeout: 10000 });
  } catch {
    console.warn(`  WAF challenge — skipping ${venue.name}`);
    return [];
  }

  const events = await page.evaluate(() => {
    const el = document.getElementById('__NEXT_DATA__');
    if (!el) return [];
    const apollo = JSON.parse(el.textContent).props?.pageProps?.initialApolloState || {};
    return Object.keys(apollo)
      .filter(k => k.startsWith('Event:'))
      .map(k => {
        const e = apollo[k];
        return {
          id: e.id,
          name: e.name,
          startDate: e.startDate,
          lowestPrice: e.lowestPrice?.amount ?? null,
          available: e.availableTicketsCount ?? 0,
          uri: e.uri?.path ?? null,
          hasOngoingEventType: e.hasOngoingEventType ?? false,
        };
      });
  });

  const maxDate = dates[dates.length - 1];
  return events
    .filter(e => !e.hasOngoingEventType && brusselsDateFromIso(e.startDate) >= dates[0] && brusselsDateFromIso(e.startDate) <= maxDate)
    .map(e => {
      const available = e.available ?? 0;
      const lowestPrice = e.lowestPrice ? parseInt(e.lowestPrice, 10) / 100 : null;
      return {
        id: e.id,
        artist: e.name,
        venue: venue.name,
        hall: '',
        venueId: venue.id,
        time: brusselsTime(e.startDate),
        genre: '',
        date: brusselsDateFromIso(e.startDate),
        soldOut: available === 0,
        lowestPrice,
        availability: available,
        availabilityStatus: available === 0 ? 'out' : available <= 5 ? 'low' : 'ok',
        soldIn24h: 0,
        lastSoldPrice: null,
        lastSoldAgo: null,
        ticketTypes: [],
        ticketswapUrl: e.uri
          ? `https://www.ticketswap.com${e.uri}`
          : `https://www.ticketswap.com/location/${venue.slug}/${venue.tsId}`,
      };
    });
}

async function main() {
  const dates = [brusselsDate(0), brusselsDate(1), brusselsDate(2)];
  console.log(`Scraping for: ${dates.join(', ')}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-GB',
    timezoneId: 'Europe/Brussels',
  });
  const page = await context.newPage();

  const concerts = [];
  for (const venue of VENUES) {
    console.log(`\nScraping ${venue.name}...`);
    try {
      const found = await scrapeVenue(page, venue, dates);
      console.log(`  ${found.length} events in next 3 days`);
      concerts.push(...found);
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }
  }
  await browser.close();

  concerts.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.soldOut !== b.soldOut) return a.soldOut ? 1 : -1;
    return (a.lowestPrice ?? 99999) - (b.lowestPrice ?? 99999);
  });

  const out = path.join(__dirname, '..', 'public', 'concerts.json');
  fs.writeFileSync(out, JSON.stringify({ updatedAt: new Date().toISOString(), concerts }, null, 2));
  console.log(`\nWrote ${concerts.length} concerts to ${out}`);
}

main().catch(err => { console.error(err); process.exit(1); });
