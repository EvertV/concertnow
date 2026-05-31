'use strict';

const { getConcerts, toDateStr, getUpdatedAt } = require('../lib/concerts');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function tabLabel(dateStr, index) {
  const d = parseDate(dateStr);
  const dayShort = DAY_SHORT[d.getDay()];
  const day = d.getDate();
  const mon = MONTH_SHORT[d.getMonth()];
  if (index === 0) return `Today<span class="sub">${dayShort} ${day}</span>`;
  if (index === 1) return `Tomorrow<span class="sub">${dayShort} ${day}</span>`;
  return `${dayShort} ${day} ${mon}<span class="sub">${dayShort} ${day}</span>`;
}

function daymeta(dateStr, index) {
  const d = parseDate(dateStr);
  const dayName = DAY_NAMES[d.getDay()];
  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const suffix = index === 0 ? 'live tonight' : index === 1 ? 'live tomorrow' : `coming up`;
  return `${dayName} ${day} ${month} · ${suffix}`;
}

function emptyLabel(dateStr, index) {
  const d = parseDate(dateStr);
  const dayName = DAY_NAMES[d.getDay()];
  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  return `${dayName} ${day} ${month}`;
}

function formatUpdatedAt(isoStr) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels' });
  const date = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Brussels' });
  return `${time} · ${date}`;
}

function h(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderAvail(concert) {
  if (concert.soldOut) {
    const extra = concert.lastSoldAgo ? ` · last sold ${h(concert.lastSoldAgo)}` : '';
    const wantedPart = concert.wanted ? ` · <span class="wanted">${h(concert.wanted)} wanted</span>` : '';
    return `<p class="avail out">Sold out${extra}${wantedPart}</p>`;
  }
  const cls = concert.availabilityStatus === 'low' ? 'avail low' : 'avail';
  const wantedPart = concert.wanted ? ` · <span class="wanted">${h(concert.wanted)} wanted</span>` : '';
  return `<p class="${cls}">${h(concert.availability)} ticket${concert.availability === 1 ? '' : 's'} left${wantedPart}</p>`;
}

function renderTicketTypes(types) {
  return types.map(t => `
      <li>
        <span class="t-name">${h(t.name)}${t.tag ? ` <span class="tag">${h(t.tag)}</span>` : ''}</span>
        <span class="t-val">€${h(t.price)} <span>· ×${h(t.count)}</span></span>
      </li>`).join('');
}

function renderConcert(concert) {
  const soldoutClass = concert.soldOut ? ' soldout' : '';
  const priceLabel = concert.soldOut
    ? (concert.lastSoldPrice ? 'last sold' : 'sold out')
    : 'from';
  const priceAmt = concert.soldOut
    ? (concert.lastSoldPrice ? `€${concert.lastSoldPrice}` : '—')
    : (concert.lowestPrice ? `€${concert.lowestPrice}` : '—');

  const soldNote = concert.lastSoldAgo && concert.lastSoldPrice
    ? `<p class="note">↺ <span>Last ticket sold <b>${h(concert.lastSoldAgo)}</b> for <b>€${h(concert.lastSoldPrice)}</b> · ${h(concert.soldIn24h)} resold in last 24h.</span></p>`
    : '';
  const soldInNote = concert.soldIn24h
    ? `<p class="note">↺ <span><b>${h(concert.soldIn24h)} sold</b> in the last 24h</span></p>`
    : '';

  const panel = concert.soldOut
    ? `
    <div class="panel">
      <p class="nofor">No tickets on sale right now.</p>
      ${soldNote}
      <button class="ts ghost">Notify me when tickets appear</button>
      <a class="ts" href="${h(concert.ticketswapUrl)}" target="_blank" rel="noopener">Open on TicketSwap <span class="arr">→</span></a>
    </div>`
    : `
    <div class="panel">
      ${concert.ticketTypes.length ? `<p class="ph">Tickets on sale</p><ul class="types">${renderTicketTypes(concert.ticketTypes)}</ul>` : ''}
      ${soldInNote}
      <a class="ts" href="${h(concert.ticketswapUrl)}" target="_blank" rel="noopener">Open on TicketSwap <span class="arr">→</span></a>
    </div>`;

  return `
  <details class="show${soldoutClass} v-${h(concert.venueId)}">
    <summary>
      <div class="price">
        <span class="lbl">${priceLabel}</span>
        <span class="amt">${priceAmt}</span>
      </div>
      <div class="info">
        <h3>${h(concert.artist)}</h3>
        <p class="venue">${h(concert.venue)}${concert.hall ? ` <span class="hall">${h(concert.hall)}</span>` : ''}</p>
        <p class="meta">${h(concert.time)}${concert.genre ? ` · ${h(concert.genre)}` : ''}</p>
        ${renderAvail(concert)}
      </div>
      <i class="chev"></i>
    </summary>
    ${panel}
  </details>`;
}

function renderDay(concerts, dateStr, index) {
  if (concerts.length === 0) {
    return `
  <section class="day" id="day${index}">
    <div class="empty">
      <div class="mk">∅</div>
      <h2>Nothing on ${emptyLabel(dateStr, index)}</h2>
      <p>A quiet night across the Brussels halls. Check back another day.</p>
      <label class="jump" for="d0">← Back to today's shows</label>
    </div>
  </section>`;
  }

  return `
  <section class="day" id="day${index}">
    <p class="daymeta">${daymeta(dateStr, index)}</p>
    ${concerts.map(renderConcert).join('')}
  </section>`;
}

function renderFooter(updatedAt) {
  const label = updatedAt ? `Updated ${h(updatedAt)}` : 'No data yet';
  return `
  <footer>
    <span class="updated-at">${label}</span>
    <button class="refresh-btn" id="refresh-btn">↺ Refresh</button>
  </footer>`;
}

function renderPage({ dates, days, updatedAt }) {
  const [d0, d1, d2] = dates;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ConcertNow · Brussels</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="stylesheet" href="/style.css" />
</head>
<body>
  <!-- day state -->
  <input class="state" type="radio" name="day" id="d0" checked />
  <input class="state" type="radio" name="day" id="d1" />
  <input class="state" type="radio" name="day" id="d2" />
  <!-- venue filters (checked = visible) -->
  <input class="state" type="checkbox" id="vab" checked />
  <input class="state" type="checkbox" id="vcr" checked />
  <input class="state" type="checkbox" id="vbo" checked />
  <input class="state" type="checkbox" id="vlm" checked />

  <div class="app">
    <header>
      <div class="head-pad">
        <div class="brand">
          <h1 class="logo"><span class="live"></span>Concert<em>Now</em></h1>
          <span class="loc">Brussels</span>
        </div>
        <p class="tagline">Browse tonight's concerts and the cheapest tickets available</p>
        <nav class="seg">
          <label for="d0">${tabLabel(d0, 0)}</label>
          <label for="d1">${tabLabel(d1, 1)}</label>
          <label for="d2">${tabLabel(d2, 2)}</label>
        </nav>
      </div>
      <div class="filters">
        <label class="chip" for="vab"><span class="dot"></span>Ancienne Belgique</label>
        <label class="chip" for="vcr"><span class="dot"></span>Cirque Royal</label>
        <label class="chip" for="vbo"><span class="dot"></span>Botanique</label>
        <label class="chip" for="vlm"><span class="dot"></span>La Madeleine</label>
      </div>
    </header>

    <main>
      ${renderDay(days[0], d0, 0)}
      ${renderDay(days[1], d1, 1)}
      ${renderDay(days[2], d2, 2)}
    </main>
    ${renderFooter(updatedAt)}
  </div>
<script>
(function () {
  var btn = document.getElementById('refresh-btn');
  var footer = document.querySelector('footer');
  if (!btn) return;

  btn.addEventListener('click', function () {
    btn.hidden = true;
    var status = document.createElement('span');
    status.className = 'refresh-status';
    status.textContent = 'Starting…';
    footer.appendChild(status);

    var triggeredAt, pollTimer, tickTimer, deploySecondsLeft;

    function setText(t) { status.textContent = t; }

    function startDeployCountdown() {
      deploySecondsLeft = 90;
      setText('Scraper done · deploying… ' + deploySecondsLeft + 's');
      tickTimer = setInterval(function () {
        deploySecondsLeft--;
        if (deploySecondsLeft <= 0) {
          clearInterval(tickTimer);
          setText('Reloading…');
          setTimeout(function () { location.reload(); }, 500);
        } else {
          setText('Scraper done · deploying… ' + deploySecondsLeft + 's');
        }
      }, 1000);
    }

    function poll(after) {
      fetch('/api/poll?after=' + encodeURIComponent(after))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.status === 'completed') {
            clearInterval(pollTimer);
            if (data.conclusion === 'success') {
              startDeployCountdown();
            } else {
              setText('Scrape failed. ');
              btn.hidden = false;
            }
          } else if (data.status === 'in_progress') {
            setText('Scraper running…');
          }
          // queued or unknown: keep polling silently
        })
        .catch(function () { /* network hiccup — keep polling */ });
    }

    fetch('/api/refresh', { method: 'POST' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.triggered) throw new Error('not triggered');
        triggeredAt = data.triggeredAt;
        setText('Scraper queued…');
        // GitHub takes a few seconds to create the run record, start polling after 5s
        setTimeout(function () {
          poll(triggeredAt);
          pollTimer = setInterval(function () { poll(triggeredAt); }, 8000);
        }, 5000);
        // Safety timeout at 6 min
        setTimeout(function () {
          if (pollTimer) clearInterval(pollTimer);
          if (tickTimer) clearInterval(tickTimer);
          setText('Taking longer than expected — ');
          var a = document.createElement('a');
          a.href = '/';
          a.textContent = 'reload manually';
          status.appendChild(a);
        }, 360000);
      })
      .catch(function () {
        setText('Could not reach server.');
        btn.hidden = false;
      });
  });
}());
</script>
</body>
</html>`;
}

module.exports = async (req, res) => {
  const dates = [
    toDateStr(new Date(), 0),
    toDateStr(new Date(), 1),
    toDateStr(new Date(), 2),
  ];

  const days = await Promise.all(dates.map(d => getConcerts(d)));
  const updatedAt = formatUpdatedAt(getUpdatedAt());

  const html = renderPage({ dates, days, updatedAt });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(html);
};
