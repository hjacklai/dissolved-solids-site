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
 *   - SEO-rich site footer with the full internal-link graph (mounted
 *     before the appbar; skipped if the page already inlines one). This
 *     gives every sub-page outbound links to all the location landing
 *     pages, the bar pages, the journal, and the cocktail index. It is
 *     the single biggest SEO lever for the whole site, see
 *     SEO_CHECKLIST.md.
 *
 * The landing page index.html currently has the appbar AND footer
 * inlined. This script is for sub-pages so navigation stays
 * consistent across the site.
 */
(function () {
  'use strict';

  // Footer mount runs even when the appbar is inlined (e.g. on the DS/SS
  // bar pages, which inline their own appbar markup but still want the
  // SEO footer). The appbar mount itself early-returns if one already exists.
  mountFooter();

  // Floating animated Home button - top-left of every sub-page.
  // Skipped on the homepage itself.
  mountHomeButton();

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

  // ─── Floating animated Home button ─────────────────────────────
  // Auto-injected on every sub-page that loads appbar.js. Skips the
  // homepage so we never duplicate. The breathing scale and pulse
  // glow are subtle but noticeable enough to invite the tap.
  function mountHomeButton() {
    try {
      if (!document.body) return;
      if (document.querySelector('.home-fab')) return;

      // Don't show on the homepage itself.
      const p = (location.pathname || '/').replace(/\/index\.html?$/i, '/');
      if (p === '/' || p === '') return;

      if (!document.getElementById('home-fab-styles')) {
        const css = ''
          + '.home-fab{position:fixed;top:max(16px,env(safe-area-inset-top,16px));'
          + 'left:max(16px,env(safe-area-inset-left,16px));z-index:2147483000;'
          + 'width:54px;height:54px;border-radius:50%;display:flex;'
          + 'align-items:center;justify-content:center;text-decoration:none;'
          + 'background:var(--accent,#d18b3a);color:#fff;'
          + 'box-shadow:0 4px 18px rgba(0,0,0,.28),0 0 0 0 rgba(209,139,58,.55);'
          + 'animation:home-fab-breathe 2.6s ease-in-out infinite,'
          +           'home-fab-pulse 2.6s ease-out infinite;'
          + 'transition:transform 200ms ease,box-shadow 200ms ease;'
          + 'will-change:transform,box-shadow;}'
          + '.home-fab svg{width:24px;height:24px;display:block;'
          + 'transition:transform 200ms ease;}'
          + '.home-fab:hover,.home-fab:focus-visible{outline:none;'
          + 'transform:scale(1.12) translateZ(0);'
          + 'box-shadow:0 8px 28px rgba(0,0,0,.36),0 0 0 8px rgba(209,139,58,.18);}'
          + '.home-fab:hover svg,.home-fab:focus-visible svg{'
          + 'transform:translateY(-1px) scale(1.04);}'
          + '.home-fab:active{transform:scale(.94);}'
          + '.home-fab-tip{position:absolute;left:64px;top:50%;'
          + 'transform:translateY(-50%) translateX(-6px);'
          + 'background:rgba(0,0,0,.78);color:#f0e6cf;'
          + 'font-family:var(--mono,"JetBrains Mono",ui-monospace,monospace);'
          + 'font-size:11px;letter-spacing:.22em;text-transform:uppercase;'
          + 'padding:6px 10px;border-radius:6px;white-space:nowrap;'
          + 'opacity:0;pointer-events:none;'
          + 'transition:opacity 180ms ease,transform 180ms ease;}'
          + '.home-fab:hover .home-fab-tip,'
          + '.home-fab:focus-visible .home-fab-tip{'
          + 'opacity:1;transform:translateY(-50%) translateX(0);}'
          + '@keyframes home-fab-breathe{'
          + '0%,100%{transform:scale(1) translateZ(0);}'
          + '50%{transform:scale(1.08) translateZ(0);}}'
          + '@keyframes home-fab-pulse{'
          + '0%{box-shadow:0 4px 18px rgba(0,0,0,.28),'
          +     '0 0 0 0 rgba(209,139,58,.55);}'
          + '70%{box-shadow:0 4px 18px rgba(0,0,0,.28),'
          +     '0 0 0 16px rgba(209,139,58,0);}'
          + '100%{box-shadow:0 4px 18px rgba(0,0,0,.28),'
          +     '0 0 0 0 rgba(209,139,58,0);}}'
          + '@media (prefers-reduced-motion: reduce){'
          + '.home-fab{animation:none;}'
          + '.home-fab:hover{transform:scale(1.06);}}'
          // Don't fight the bottom appbar - sit clear of the music toggle
          // and any inline ← Home article links.
          + '@media (max-width:520px){.home-fab{width:48px;height:48px;}'
          + '.home-fab svg{width:22px;height:22px;}'
          + '.home-fab-tip{display:none;}}';
        const style = document.createElement('style');
        style.id = 'home-fab-styles';
        style.textContent = css;
        document.head.appendChild(style);
      }

      const a = document.createElement('a');
      a.className = 'home-fab';
      a.href = '/';
      a.setAttribute('aria-label', 'Back to home');
      a.setAttribute('title', 'Home');
      a.innerHTML = ''
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        +      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" '
        +      'aria-hidden="true">'
        +   '<path d="M3 11.5 12 4l9 7.5"/>'
        +   '<path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/>'
        + '</svg>'
        + '<span class="home-fab-tip">Home</span>';
      document.body.appendChild(a);
    } catch (e) {
      // Home button is non-critical; never let an injection bug break the page.
    }
  }

  // ─── Site footer (SEO internal-link graph) ─────────────────────
  // Injects the same comprehensive footer as the homepage onto every
  // sub-page so PageRank flows from the most-authoritative page down
  // to all 80+ pages. Skipped if a page already inlines its own
  // .site-foot (e.g. the homepage).
  function mountFooter() {
    try {
      if (!document.body) return;
      if (document.querySelector('.site-foot')) return;

      // Self-contained styles. Uses var(--bg-deep) etc when defined
      // (DS/SS bar pages) and falls back to a dark dock on article and
      // location pages that don't define those tokens.
      if (!document.getElementById('site-foot-styles')) {
        const css = ''
          + '.site-foot{padding:80px clamp(28px,6.5vw,180px) 160px;'
          + 'background:var(--bg-deep,#08080a);color:var(--ink,#f0e6cf);'
          + 'font-family:var(--mono,"JetBrains Mono",ui-monospace,monospace);'
          + 'border-top:1px solid rgba(240,230,207,0.12);}'
          + '.site-foot *{box-sizing:border-box;}'
          + '.site-foot-inner{max-width:var(--maxw,1440px);margin:0 auto;}'
          + '.site-foot-kicker{font-size:11px;letter-spacing:.26em;'
          + 'text-transform:uppercase;color:rgba(240,230,207,.6);margin:0 0 8px;}'
          + '.site-foot-lede{font-family:var(--serif,"DM Serif Display","Times New Roman",serif);'
          + 'font-size:clamp(32px,4.5vw,56px);line-height:1.02;letter-spacing:-.02em;'
          + 'margin:0 0 56px;color:var(--ink,#f0e6cf);max-width:780px;font-weight:400;}'
          + '.site-foot-lede em{color:var(--accent,#d18b3a);font-style:normal;}'
          + '.site-foot-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:36px 28px;}'
          + '.site-foot-col h4{font-size:11px;letter-spacing:.22em;text-transform:uppercase;'
          + 'font-weight:600;color:var(--accent,#d18b3a);margin:0 0 14px;'
          + 'font-family:var(--mono,"JetBrains Mono",ui-monospace,monospace);}'
          + '.site-foot-col ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;}'
          + '.site-foot-col a{color:rgba(240,230,207,.82);text-decoration:none;font-size:14px;'
          + 'line-height:1.45;border-bottom:1px solid transparent;transition:color 160ms,border-color 160ms;}'
          + '.site-foot-col a:hover,.site-foot-col a:focus-visible{color:var(--ink,#f0e6cf);'
          + 'border-bottom-color:rgba(209,139,58,.7);}'
          + '.site-foot-meta{display:flex;flex-wrap:wrap;gap:12px 24px;margin-top:56px;'
          + 'padding-top:28px;border-top:1px solid rgba(240,230,207,.1);font-size:11px;'
          + 'letter-spacing:.12em;text-transform:uppercase;color:rgba(240,230,207,.55);}'
          + '.site-foot-meta a{color:inherit;text-decoration:none;'
          + 'border-bottom:1px dotted rgba(240,230,207,.3);}'
          + '.site-foot-meta a:hover{color:var(--ink,#f0e6cf);}';
        const style = document.createElement('style');
        style.id = 'site-foot-styles';
        style.textContent = css;
        document.head.appendChild(style);
      }

      // Link clusters. Mirror what the homepage already inlines so AI
      // crawlers see a consistent internal-link graph.
      const cols = [
        ['Our bars', [
          ['/dissolvedsolids/', 'Dissolved Solids · Damansara Kim'],
          ['/solublesolids/',   'Soluble Solids · SS2'],
          ['/visit/',           'Visit · hours, parking, transit'],
          ['/reserve/',         'Reserve a table'],
          ['/venue-hire/',      'Private venue hire'],
          ['/snacks/',          'Snacks & bar food'],
          ['/faq/',             'FAQ']
        ]],
        ['Find us in', [
          ['/find-a-cocktail-bar/',       'All neighbourhoods (hub)'],
          ['/cocktail-bars-pj/',          'Cocktail bars in PJ'],
          ['/cocktail-bars-damansara/',   'Damansara'],
          ['/cocktail-bars-ss2/',         'SS2'],
          ['/cocktail-bars-ttdi/',        'TTDI'],
          ['/cocktail-bars-mont-kiara/',  'Mont Kiara'],
          ['/cocktail-bars-bangsar/',     'Bangsar'],
          ['/cocktail-bars-subang/',      'Subang Jaya'],
          ['/cocktail-bars-puchong/',     'Puchong'],
          ['/cocktail-bars-kl/',          'Kuala Lumpur'],
          ['/cocktail-bars-klang-valley/', 'Klang Valley (overview)']
        ]],
        ['More of Selangor', [
          ['/cocktail-bars-cheras/',     'Cheras'],
          ['/cocktail-bars-shah-alam/',  'Shah Alam'],
          ['/cocktail-bars-cyberjaya/',  'Cyberjaya'],
          ['/cocktail-bars-putrajaya/',  'Putrajaya'],
          ['/cocktail-bars-kepong/',     'Kepong'],
          ['/cocktail-bars-setapak/',    'Setapak'],
          ['/cocktail-bars-selayang/',   'Selayang'],
          ['/cocktail-bars-ampang/',     'Ampang']
        ]],
        ['Drinks & recipes', [
          ['/cocktails/',                       'All cocktails'],
          ['/cocktails/guide/',                 'Complete recipe guide'],
          ['/cocktail-glossary/',               'Cocktail glossary (A–Z)'],
          ['/cocktails/pandan-collins/',        'Pandan Collins'],
          ['/cocktails/gula-melaka-old-fashioned/', 'Gula Melaka Old Fashioned'],
          ['/cocktails/kopi-sour/',             'Kopi Sour'],
          ['/cocktails/calamansi-highball/',    'Calamansi Highball'],
          ['/cocktails/jungle-bird/',           'Jungle Bird'],
          ['/cocktails/martini/',               'Martini'],
          ['/cocktails/negroni/',               'Negroni']
        ]],
        ['The Journal', [
          ['/journal/',                                   'Journal index'],
          ['/journal/cocktail-bars-petaling-jaya/',       'PJ cocktail bars guide'],
          ['/journal/best-malaysian-cocktails-2026/',     'Best Malaysian cocktails 2026'],
          ['/journal/home-bar-malaysia/',                 'A home bar in Malaysia'],
          ['/journal/malaysian-kopi-explained/',          'Malaysian kopi explained'],
          ['/journal/pandan-in-beverages/',               'Pandan in beverages'],
          ['/journal/martini-deep-dive/',                 'The Martini deep dive'],
          ['/journal/how-to-order-cocktail/',             'How to order a cocktail'],
          ['/journal/non-alcoholic-bars-kl/',             'Non-alcoholic bars in KL']
        ]],
        ['By the evening', [
          ['/journal/date-night-cocktail-bars-pj/',       'Date night in PJ'],
          ['/journal/cocktail-bar-first-date-pj/',        'First date in PJ'],
          ['/journal/anniversary-cocktail-bar-pj/',       'Anniversary in PJ'],
          ['/journal/groups-celebrations-cocktail-bar-pj/', 'Groups & celebrations'],
          ['/journal/business-dinner-drinks-pj/',         'Business dinner drinks'],
          ['/journal/cocktail-bar-solo-pj/',              'Drinking alone'],
          ['/journal/cocktail-bar-non-drinkers/',         'For non-drinkers'],
          ['/journal/late-night-drinks-damansara-kim/',   'Late-night Damansara Kim'],
          ['/journal/cocktail-bar-tourists-kl-pj/',       'For tourists'],
          ['/journal/cocktail-bar-pricing-pj/',           'Cocktail prices in PJ']
        ]]
      ];

      function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      function colHTML(title, links) {
        let html = '<div class="site-foot-col"><h4>' + esc(title) + '</h4><ul>';
        for (let i = 0; i < links.length; i++) {
          html += '<li><a href="' + links[i][0] + '">' + links[i][1] + '</a></li>';
        }
        return html + '</ul></div>';
      }

      let inner = ''
        + '<div class="site-foot-inner">'
        +   '<p class="site-foot-kicker">Two states · one chemistry</p>'
        +   '<p class="site-foot-lede">Cocktail bars in <em>Petaling Jaya</em>. '
        +     'A library for the rest of the Klang&nbsp;Valley.</p>'
        +   '<div class="site-foot-grid">';
      for (let i = 0; i < cols.length; i++) inner += colHTML(cols[i][0], cols[i][1]);
      inner += '</div>'
        +   '<div class="site-foot-meta">'
        +     '<span>Dissolved Solids &amp; Soluble Solids · Petaling Jaya, Malaysia</span>'
        +     '<span>Tatler Asia Top 20 Bars 2025/26</span>'
        +     '<a href="/privacy/">Privacy</a>'
        +     '<a href="/terms/">Terms</a>'
        +     '<a href="https://instagram.com/dissolvedsolids" target="_blank" rel="noopener">Instagram · DS</a>'
        +     '<a href="https://instagram.com/solublesolids" target="_blank" rel="noopener">Instagram · SS</a>'
        +   '</div>'
        + '</div>';

      const footer = document.createElement('footer');
      footer.className = 'site-foot';
      footer.setAttribute('role', 'contentinfo');
      footer.setAttribute('aria-label', 'Site links');
      footer.innerHTML = inner;

      // Insert before the appbar if it exists; otherwise append.
      const appbar = document.querySelector('.appbar');
      if (appbar && appbar.parentNode) {
        appbar.parentNode.insertBefore(footer, appbar);
      } else {
        document.body.appendChild(footer);
      }
    } catch (e) {
      // Footer is non-critical; never let an injection bug break the page.
    }
  }
})();
