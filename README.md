# ConcertNow · Brussels

Tonight's gigs across Brussels concert halls — cheapest ticket first.

Covers Ancienne Belgique, Cirque Royal, Botanique, and La Madeleine.

## How it works

A single Vercel serverless function fetches concert data for today, tomorrow, and the day after, then renders the full HTML page server-side. Everything lands in one response — no client-side data fetching, no loading states.

- **Day tabs** — CSS radio-button trick; no JavaScript
- **Venue filter chips** — CSS checkbox trick; no JavaScript
- **Concert rows** — native `<details>`/`<summary>` accordion; no JavaScript
- **Zero runtime dependencies** — pure Node built-ins

## Data

`lib/concerts.js` exports `getConcerts(dateStr)`. It currently returns mock data that mirrors the shape a real TicketSwap API response would have. Swap the function body for real API calls when you have credentials.

Concert shape:

```js
{
  id, artist, venue, hall,
  venueId: 'ab' | 'cr' | 'bo' | 'lm',
  time, genre, date,
  soldOut: boolean,
  lowestPrice: number | null,
  availability: number,
  availabilityStatus: 'ok' | 'low' | 'out',
  soldIn24h: number,
  lastSoldPrice: number | null,   // sold-out only
  lastSoldAgo: string | null,     // sold-out only, e.g. "8 min ago"
  ticketTypes: [{ name, tag, price, count }],
  ticketswapUrl: string,
}
```

## Local development

```sh
node dev.js
# → http://localhost:3000
```

No `npm install` needed.

## Deploy to Vercel

```sh
npx vercel        # preview
npx vercel --prod # production
```

`vercel.json` rewrites `/` to the serverless function; `/style.css` is served as a static file from `public/`.
