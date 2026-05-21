/*
 * Shared bottom app-nav bar. Self-injecting so any page just needs:
 *   <link rel="stylesheet" href="/appbar.css">
 *   <script src="/appbar.js" defer></script>
 *
 * Provides:
 *   - 4 nav icons (visit, reserve, build, journal) flanking a centred
 *     Dis/Sol segmented state toggle
 *   - Scrolling live-readout ticker (state, venue, method, hours, KL time)
 *   - Synthesised radio-tuning SFX on toggle flip
 *
 * The landing page index.html currently has the appbar inlined. This
 * script is for sub-pages so navigation stays consistent across the site.
 */
// ─── Language toggle loader ────────────────────────────────────
// Loads BEFORE the early-return guard below so it runs on every page,
// including the landing (which has its own inline appbar). The toggle
// itself lives in /lang-toggle.js.
(function loadLangToggle() {
  if (document.querySelector('script[data-lt-loaded]')) return;
  var s = document.createElement('script');
  s.src = '/lang-toggle.js';
  s.defer = true;
  s.dataset.ltLoaded = '1';
  document.head.appendChild(s);
})();

(function () {
  'use strict';
  if (document.querySelector('.appbar')) return; // already there (e.g. landing)

  // ─── Markup ────────────────────────────────────────────────────
  const nav = document.createElement('nav');
  nav.className = 'appbar';
  nav.setAttribute('aria-label', 'Primary');
  nav.innerHTML = ''
    + '<div class="appbar-top">'
    +   '<div class="appbar-side appbar-side-left">'
    +     iconLink('/journal/', 'Journal', 'journal', svgBook())
    +     iconLink('/#builder', 'Build a drink', 'build', svgFlask(), 'appbar-icon-cta')
    +   '</div>'
    +   '<button class="appbar-toggle" id="appbarToggle" type="button" aria-label="Flip outlet - switch between Dissolved and Soluble">'
    +     '<span class="seg" data-target="dissolved">Dis</span>'
    +     '<span class="seg" data-target="soluble">Sol</span>'
    +   '</button>'
    +   '<div class="appbar-side appbar-side-right">'
    +     iconLink('/#visit', 'Visit', 'visit', svgPin())
    +     iconLink('/#reserve', 'Reserve', 'reserve', svgCal())
    +   '</div>'
    + '</div>'
    + '<div class="appbar-ticker" aria-hidden="true">'
    +   '<div class="appbar-ticker-track" id="appbarTickerTrack">'
    +     '<div class="ticker-group" id="tickerGroup1"></div>'
    +     '<div class="ticker-group" id="tickerGroup2"></div>'
    +   '</div>'
    + '</div>';

  function iconLink(href, ariaLabel, label, svg, cls) {
    const extra = cls ? ' ' + cls : '';
    return '<a class="appbar-icon' + extra + '" href="' + href + '" aria-label="' + ariaLabel + '">'
      + svg
      + '<span>' + label + '</span>'
      + '</a>';
  }
  function svgPin()   { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s7-7.5 7-13a7 7 0 0 0-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>'; }
  function svgCal()   { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>'; }
  function svgFlask() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h14M8 4l4 8 4-8M12 12v8M8 20h8"/></svg>'; }
  function svgBook()  { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>'; }

  // ─── Mount ─────────────────────────────────────────────────────
  function mount() {
    if (document.querySelector('.appbar')) return;
    document.body.appendChild(nav);
    initTicker();
    initToggle();
    // Smooth scroll for #anchor links if the page doesn't already set it
    if (!getComputedStyle(document.documentElement).scrollBehavior ||
        getComputedStyle(document.documentElement).scrollBehavior === 'auto') {
      document.documentElement.style.scrollBehavior = 'smooth';
    }
  }

  // ─── Ticker ────────────────────────────────────────────────────
  function klTime() {
    const klMinutes = -480;
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const kl = new Date(utc - klMinutes * 60000);
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return pad(kl.getHours()) + ':' + pad(kl.getMinutes()) + ':' + pad(kl.getSeconds());
  }
  function tickerHTML() {
    const isSol = document.documentElement.dataset.state === 'soluble';
    const venue   = isSol ? '02 · SS2 PJ' : '01 · Damansara Kim PJ';
    const hours   = isSol ? 'Wed to Sun · 18:00 to 01:00' : 'Tue to Sun · 15:00 to 01:00';
    const method  = isSol ? 'Infusion' : 'Dissolution';
    const stateNm = isSol ? 'Soluble Solids' : 'Dissolved Solids';
    return ''
      + '<span class="ti"><b>two states</b> <i>one chemistry</i></span>'
      + '<span class="ti"><b>state</b> <i>' + stateNm + '</i></span>'
      + '<span class="ti"><b>venue</b> <i>' + venue + '</i></span>'
      + '<span class="ti"><b>method</b> <i>' + method + '</i></span>'
      + '<span class="ti"><b>hours</b> <i>' + hours + '</i></span>'
      + '<span class="ti"><b>kuala lumpur</b> <i class="ti-time">' + klTime() + '</i></span>'
      + '<span class="ti"><b>tatler asia</b> <i>top 20 bars · 25/26</i></span>';
  }
  function renderTicker() {
    const html = tickerHTML();
    const g1 = document.getElementById('tickerGroup1');
    const g2 = document.getElementById('tickerGroup2');
    if (g1) g1.innerHTML = html;
    if (g2) g2.innerHTML = html;
  }
  function tickClocks() {
    const t = klTime();
    document.querySelectorAll('#appbarTickerTrack .ti-time').forEach(function (el) {
      el.textContent = t;
    });
  }
  function initTicker() {
    renderTicker();
    setInterval(tickClocks, 1000);
    new MutationObserver(renderTicker).observe(
      document.documentElement, { attributes: true, attributeFilter: ['data-state'] }
    );
  }

  // ─── Radio-tuning SFX ──────────────────────────────────────────
  function playScratch() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const now = ctx.currentTime;
      const dur = 0.42;
      const master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
      // Dial click
      const click = ctx.createOscillator();
      click.type = 'square';
      click.frequency.value = 2200;
      const clickG = ctx.createGain();
      clickG.gain.setValueAtTime(0, now);
      clickG.gain.linearRampToValueAtTime(0.18, now + 0.001);
      clickG.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      click.connect(clickG).connect(master);
      click.start(now); click.stop(now + 0.02);
      // Static
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 0.85;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
      const noiseG = ctx.createGain();
      noiseG.gain.setValueAtTime(0, now);
      noiseG.gain.linearRampToValueAtTime(0.55, now + 0.02);
      const wobble = new Float32Array(8);
      for (let i = 0; i < wobble.length; i++) wobble[i] = 0.30 + Math.random() * 0.35;
      noiseG.gain.setValueCurveAtTime(wobble, now + 0.025, 0.30);
      noiseG.gain.exponentialRampToValueAtTime(0.001, now + dur);
      noise.connect(bp).connect(hp).connect(noiseG).connect(master);
      noise.start(now); noise.stop(now + dur + 0.02);
      // Whistle
      const whistle = ctx.createOscillator();
      whistle.type = 'sine';
      whistle.frequency.setValueAtTime(2600, now + 0.08);
      whistle.frequency.exponentialRampToValueAtTime(800, now + 0.18);
      whistle.frequency.exponentialRampToValueAtTime(2200, now + 0.26);
      const whistleG = ctx.createGain();
      whistleG.gain.setValueAtTime(0, now);
      whistleG.gain.setValueAtTime(0, now + 0.08);
      whistleG.gain.linearRampToValueAtTime(0.14, now + 0.10);
      whistleG.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      whistle.connect(whistleG).connect(master);
      whistle.start(now); whistle.stop(now + 0.30);
      // Lock-on
      const lock = ctx.createOscillator();
      lock.type = 'sine';
      lock.frequency.setValueAtTime(200, now + 0.32);
      lock.frequency.exponentialRampToValueAtTime(80, now + 0.42);
      const lockG = ctx.createGain();
      lockG.gain.setValueAtTime(0, now + 0.32);
      lockG.gain.linearRampToValueAtTime(0.28, now + 0.33);
      lockG.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      lock.connect(lockG).connect(master);
      lock.start(now + 0.32); lock.stop(now + 0.46);
      setTimeout(function () { try { ctx.close(); } catch (e) {} }, 700);
    } catch (e) { /* SFX is non-critical */ }
  }

  // ─── Toggle ────────────────────────────────────────────────────
  function initToggle() {
    const btn = document.getElementById('appbarToggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      playScratch();
      const html = document.documentElement;
      html.dataset.state = html.dataset.state === 'soluble' ? 'dissolved' : 'soluble';
    });
    // Keyboard: spacebar flips outlet too
    document.addEventListener('keydown', function (e) {
      if (e.code === 'Space' && !/^(INPUT|TEXTAREA|BUTTON)$/.test(document.activeElement && document.activeElement.tagName)) {
        e.preventDefault(); btn.click();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  // Language toggle is loaded at module top, outside this IIFE.

  // Auto-load journal-related.js on article pages. Saves editing every
  // article file just to add a <script> tag. The loaded script self-
  // detects whether it has work to do (looks for main.article-mount).
  (function loadJournalRelated() {
    if (!document.querySelector('main.article-mount')) return;
    if (document.querySelector('script[data-jr-loaded]')) return;
    const s = document.createElement('script');
    s.src = '/journal-related.js';
    s.defer = true;
    s.dataset.jrLoaded = '1';
    document.head.appendChild(s);
  })();

  // Auto-load cocktail-tools.js on cocktail recipe pages. Self-detects
  // by looking for a Recipe schema; injects Print + Embed snippet.
  (function loadCocktailTools() {
    if (!/^\/cocktails\/[^/]+\/?/.test(location.pathname)) return;
    if (document.querySelector('script[data-ct-loaded]')) return;
    const s = document.createElement('script');
    s.src = '/cocktail-tools.js';
    s.defer = true;
    s.dataset.ctLoaded = '1';
    document.head.appendChild(s);
  })();

  // ─── Sticky WhatsApp + Reserve floating buttons ────────────────
  // State-aware. Inject on any sub-page that does not already define
  // .floats (the landing page does). Mirrors the landing page floats
  // visually; tracks the current data-state to pick the right bar.
  (function injectStickyCtas() {
    if (document.querySelector('.floats')) return; // landing already has them
    var floats = document.createElement('div');
    floats.className = 'floats';
    floats.innerHTML = ''
      + '<a class="float float-injected" id="injWA" href="https://wa.me/601116828651" target="_blank" rel="noopener" aria-label="WhatsApp the bar">'
      +   '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>'
      + '</a>'
      + '<a class="float float-injected alt" id="injReserve" href="/#reserve" aria-label="Reserve a table">'
      +   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>'
      + '</a>';
    document.body.appendChild(floats);
    // Inject minimal styles if styles.css's .floats rules are not in scope
    if (!document.querySelector('style[data-floats-injected]')) {
      var st = document.createElement('style');
      st.dataset.floatsInjected = '1';
      st.textContent = ''
        + '.floats { position: fixed; right: 18px; bottom: 110px; display: flex; flex-direction: column; gap: 12px; z-index: 50; }'
        + '@media (max-width: 640px) { .floats { right: 12px; bottom: 100px; gap: 10px; } }'
        + '.float-injected { display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: 50%; background: #25d366; color: #fff; box-shadow: 0 6px 18px rgba(0,0,0,.35); transition: transform .18s ease, box-shadow .18s ease; }'
        + '.float-injected:hover { transform: scale(1.08); box-shadow: 0 10px 26px rgba(0,0,0,.5); }'
        + '.float-injected.alt { background: #ff3b81; }'
        + '.float-injected svg { width: 26px; height: 26px; }'
        + '@media (max-width: 640px) { .float-injected { width: 46px; height: 46px; } .float-injected svg { width: 22px; height: 22px; } }';
      document.head.appendChild(st);
    }
    function syncWaHref() {
      var sol = 'https://wa.me/601116828651?text=Hi%20Soluble%20Solids!%20I%27d%20like%20to%20visit%20SS2.';
      var dis = 'https://wa.me/601140087607?text=Hi%20Dissolved%20Solids!%20I%27d%20like%20to%20visit%20Damansara%20Kim.';
      var state = document.documentElement.dataset.state;
      var wa = document.getElementById('injWA');
      if (wa) wa.href = (state === 'dissolved' ? dis : sol);
    }
    syncWaHref();
    new MutationObserver(syncWaHref).observe(
      document.documentElement, { attributes: true, attributeFilter: ['data-state'] }
    );
  })();
})();
