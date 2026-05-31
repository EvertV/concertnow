'use strict';

// Swap getConcerts() body for real TicketSwap API calls when credentials are available.
// Shape must stay the same — api/index.js depends on it.

const MOCK = {
  // Keyed by YYYY-MM-DD offset from today (0 = today, 1 = tomorrow, 2 = day after)
  0: [
    {
      id: 'bc-new-road',
      artist: 'Black Country, New Road',
      venue: 'Ancienne Belgique',
      hall: 'Club',
      venueId: 'ab',
      time: '19:30',
      genre: 'Post-rock',
      soldOut: false,
      lowestPrice: 18,
      availability: 8,
      availabilityStatus: 'low',
      soldIn24h: 23,
      lastSoldPrice: null,
      lastSoldAgo: null,
      ticketTypes: [
        { name: 'Standing', tag: null, price: 24, count: 5 },
        { name: 'AB Friends', tag: 'member', price: 20, count: 2 },
        { name: 'Student', tag: 'with ID', price: 18, count: 1 },
      ],
      ticketswapUrl: 'https://www.ticketswap.com/',
    },
    {
      id: 'sons-of-kemet',
      artist: 'Sons of Kemet',
      venue: 'Botanique',
      hall: 'Orangerie',
      venueId: 'bo',
      time: '20:00',
      genre: 'Jazz',
      soldOut: false,
      lowestPrice: 16,
      availability: 3,
      availabilityStatus: 'low',
      soldIn24h: 14,
      lastSoldPrice: null,
      lastSoldAgo: null,
      ticketTypes: [
        { name: 'Standing', tag: null, price: 22, count: 2 },
        { name: 'Bota Carte', tag: 'member', price: 16, count: 1 },
      ],
      ticketswapUrl: 'https://www.ticketswap.com/',
    },
    {
      id: 'charlotte-adigery',
      artist: 'Charlotte Adigéry',
      venue: 'La Madeleine',
      hall: 'Grande salle',
      venueId: 'lm',
      time: '20:30',
      genre: 'Electro',
      soldOut: false,
      lowestPrice: 15,
      availability: 21,
      availabilityStatus: 'ok',
      soldIn24h: 5,
      lastSoldPrice: null,
      lastSoldAgo: null,
      ticketTypes: [
        { name: 'Standing', tag: null, price: 19, count: 14 },
        { name: 'Student', tag: 'with ID', price: 15, count: 7 },
      ],
      ticketswapUrl: 'https://www.ticketswap.com/',
    },
    {
      id: 'balthazar',
      artist: 'Balthazar',
      venue: 'Cirque Royal',
      hall: 'Grande salle',
      venueId: 'cr',
      time: '19:00',
      genre: 'Indie pop',
      soldOut: false,
      lowestPrice: 32,
      availability: 12,
      availabilityStatus: 'ok',
      soldIn24h: 9,
      lastSoldPrice: null,
      lastSoldAgo: null,
      ticketTypes: [
        { name: 'Standing', tag: null, price: 32, count: 8 },
        { name: 'Balcony seated', tag: null, price: 38, count: 4 },
      ],
      ticketswapUrl: 'https://www.ticketswap.com/',
    },
    {
      id: 'fontaines-dc',
      artist: 'Fontaines D.C.',
      venue: 'Ancienne Belgique',
      hall: 'Main hall',
      venueId: 'ab',
      time: '20:00',
      genre: 'Post-punk',
      soldOut: true,
      lowestPrice: null,
      availability: 0,
      availabilityStatus: 'out',
      soldIn24h: 41,
      lastSoldPrice: 30,
      lastSoldAgo: '8 min ago',
      ticketTypes: [],
      ticketswapUrl: 'https://www.ticketswap.com/',
    },
    {
      id: 'tamino',
      artist: 'Tamino',
      venue: 'Cirque Royal',
      hall: 'Club',
      venueId: 'cr',
      time: '19:30',
      genre: 'Singer-songwriter',
      soldOut: true,
      lowestPrice: null,
      availability: 0,
      availabilityStatus: 'out',
      soldIn24h: 6,
      lastSoldPrice: 34,
      lastSoldAgo: '2h ago',
      ticketTypes: [],
      ticketswapUrl: 'https://www.ticketswap.com/',
    },
  ],
  1: [
    {
      id: 'ezra-collective',
      artist: 'Ezra Collective',
      venue: 'Ancienne Belgique',
      hall: 'Main hall',
      venueId: 'ab',
      time: '20:00',
      genre: 'Jazz',
      soldOut: false,
      lowestPrice: 22,
      availability: 42,
      availabilityStatus: 'ok',
      soldIn24h: 11,
      lastSoldPrice: null,
      lastSoldAgo: null,
      ticketTypes: [
        { name: 'Standing', tag: null, price: 28, count: 30 },
        { name: 'Student', tag: 'with ID', price: 22, count: 12 },
      ],
      ticketswapUrl: 'https://www.ticketswap.com/',
    },
    {
      id: 'yin-yin',
      artist: 'Yïn Yïn',
      venue: 'Botanique',
      hall: 'Rotonde',
      venueId: 'bo',
      time: '20:30',
      genre: 'Psych',
      soldOut: false,
      lowestPrice: 15,
      availability: 12,
      availabilityStatus: 'ok',
      soldIn24h: 8,
      lastSoldPrice: null,
      lastSoldAgo: null,
      ticketTypes: [
        { name: 'Standing', tag: null, price: 21, count: 9 },
        { name: 'Bota Carte', tag: 'member', price: 15, count: 3 },
      ],
      ticketswapUrl: 'https://www.ticketswap.com/',
    },
    {
      id: 'murder-capital',
      artist: 'The Murder Capital',
      venue: 'Botanique',
      hall: 'Orangerie',
      venueId: 'bo',
      time: '20:00',
      genre: 'Post-punk',
      soldOut: true,
      lowestPrice: null,
      availability: 0,
      availabilityStatus: 'out',
      soldIn24h: 7,
      lastSoldPrice: 27,
      lastSoldAgo: '1h ago',
      ticketTypes: [],
      ticketswapUrl: 'https://www.ticketswap.com/',
    },
  ],
  2: [],
};

/**
 * Returns concerts for the given date string (YYYY-MM-DD).
 * The offset is relative to today in the Europe/Brussels timezone.
 */
async function getConcerts(dateStr) {
  const today = toDateStr(new Date(), 0);
  const tomorrow = toDateStr(new Date(), 1);
  const dayAfter = toDateStr(new Date(), 2);

  let offset;
  if (dateStr === today) offset = 0;
  else if (dateStr === tomorrow) offset = 1;
  else if (dateStr === dayAfter) offset = 2;
  else return [];

  return (MOCK[offset] || []).map(c => ({ ...c, date: dateStr }));
}

function toDateStr(base, offsetDays) {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

module.exports = { getConcerts, toDateStr };
