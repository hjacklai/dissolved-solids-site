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
})();
