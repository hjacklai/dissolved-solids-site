/*
 * Shared atmosphere: subtle floating motes + procedural ambient music.
 * Self-injects markup so the only include each page needs is:
 *   <script src="/atmosphere.js" defer></script>
 *
 * Atmosphere is intentionally lighter than the landing page so it
 * doesn't fight content readability. Music toggle is the same
 * procedural pad as the landing.
 */
(function () {
  'use strict';

  function inject() {
    if (document.querySelector('.atmo-music')) return; // already there

    // Subtle drift dots - visible but unobtrusive on any background
    const dots = document.createElement('div');
    dots.className = 'atmo-dots';
    dots.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dots);

    // Music toggle, bottom-left
    const mt = document.createElement('button');
    mt.className = 'atmo-music';
    mt.type = 'button';
    mt.setAttribute('aria-label', 'toggle ambient music');
    mt.innerHTML =
      '<span class="bars"><i></i><i></i><i></i><i></i></span>' +
      '<span class="tip">tap to play · ambient</span>';
    document.body.appendChild(mt);
  }

  function initParticles() {
    const container = document.querySelector('.atmo-dots');
    if (!container) return;
    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const isSmall = window.innerWidth < 700;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    // Drift dots - rising upward, varied amber/rose/cream
    const dotCount = isTouch || isSmall ? 14 : 40;
    const dotTints = ['', 'rose', 'cream'];
    for (let i = 0; i < dotCount; i++) {
      const d = document.createElement('span');
      d.className = 'atmo-dot ' + dotTints[i % 3];
      d.style.left = Math.random() * 100 + '%';
      d.style.bottom = -5 - Math.random() * 30 + 'vh';
      d.style.animationDuration = 16 + Math.random() * 24 + 's';
      d.style.animationDelay = -Math.random() * 35 + 's';
      const size = 2 + Math.random() * 5;
      d.style.width = d.style.height = size + 'px';
      container.appendChild(d);
    }

    // Petal flakes - slower, falling downward, organic rotation
    const flakeCount = isTouch || isSmall ? 5 : 12;
    const flakeTints = ['', 'amber', 'cream'];
    for (let i = 0; i < flakeCount; i++) {
      const f = document.createElement('span');
      f.className = 'atmo-flake ' + flakeTints[i % 3];
      f.style.left = Math.random() * 100 + '%';
      f.style.animationDuration = 22 + Math.random() * 20 + 's';
      f.style.animationDelay = -Math.random() * 40 + 's';
      const scale = 0.7 + Math.random() * 0.8;
      f.style.transform = 'scale(' + scale + ')';
      container.appendChild(f);
    }
  }

  function initMusic() {
    const mt = document.querySelector('.atmo-music');
    if (!mt) return;
    const tip = mt.querySelector('.tip');
    const TARGET = 0.35;
    const FADE_MS = 1200;
    // Sub-pages have a fixed data-state - pick the matching track.
    const state = document.documentElement.dataset.state || 'soluble';
    const src = state === 'dissolved'
      ? '/photos/audio/fashion-house.mp3'
      : '/photos/audio/lofi-beat.mp3';
    let audio = null;
    let fadeTimer = null;

    function setupAudio() {
      audio = new Audio(src);
      audio.loop = true;
      // preload=auto starts buffering immediately so the toggle is
      // responsive the moment the user (or autoplay) tries to play.
      audio.preload = 'auto';
      audio.volume = 0;
    }
    // Eagerly create the audio object so the download starts ASAP,
    // not at first click. Also inject a <link rel="preload"> hint so
    // the browser starts fetching even before this script runs.
    (function preloadHint() {
      try {
        const l = document.createElement('link');
        l.rel = 'preload';
        l.as = 'audio';
        l.href = src;
        l.type = 'audio/mpeg';
        document.head.appendChild(l);
      } catch (e) {}
    })();
    setupAudio();
    function fadeTo(target, duration) {
      if (!audio) return;
      if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
      const startVol = audio.volume;
      const startTime = Date.now();
      fadeTimer = setInterval(function () {
        const t = Math.min(1, (Date.now() - startTime) / duration);
        audio.volume = Math.max(0, Math.min(1, startVol + (target - startVol) * t));
        if (t >= 1) {
          clearInterval(fadeTimer);
          fadeTimer = null;
          if (target === 0 && !audio.paused) audio.pause();
        }
      }, 60);
    }
    async function start() {
      try {
        if (!audio) setupAudio();
        await audio.play();
        fadeTo(TARGET, FADE_MS);
        mt.classList.add('playing');
        if (tip) tip.textContent = state === 'dissolved' ? 'house · tap to stop' : 'lofi · tap to stop';
      } catch (e) {
        console.warn('music start failed', e);
        if (tip) tip.textContent = 'audio unavailable';
      }
    }
    function stop() {
      if (!audio) return;
      try {
        fadeTo(0, FADE_MS * 0.6);
        mt.classList.remove('playing');
        if (tip) tip.textContent = 'tap to play · music';
      } catch (e) {
        console.warn('music stop failed', e);
      }
    }
    mt.addEventListener('click', function () {
      if (mt.classList.contains('playing')) stop();
      else start();
    });
    // Autoplay engine. Browsers block audio without a user gesture and the
    // gesture allowance does NOT carry across navigations, so we retry on
    // every visible lifecycle event (load, pageshow incl. BFCache, tab
    // refocus) AND keep a gesture-fallback armed for any pointer / key /
    // scroll / wheel input. Re-armed after every retry so a back-navigation
    // followed by any scroll/click is enough to start music.
    var gestureEvts = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel'];
    var armed = false;
    function tryStart() { if (!mt.classList.contains('playing')) start(); }
    function onGesture(e) {
      var onToggle = e.target && e.target.closest && e.target.closest('.atmo-music');
      if (!mt.classList.contains('playing') && !onToggle) start();
      disarmGesture();
    }
    function armGesture() {
      if (armed) return;
      armed = true;
      gestureEvts.forEach(function (ev) { document.addEventListener(ev, onGesture, { capture: true, passive: true }); });
    }
    function disarmGesture() {
      if (!armed) return;
      armed = false;
      gestureEvts.forEach(function (ev) { document.removeEventListener(ev, onGesture, true); });
    }
    tryStart();
    armGesture();
    window.addEventListener('pageshow', function () { tryStart(); armGesture(); });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') { tryStart(); armGesture(); }
    });
  }

  function ready(fn) {
    if (document.readyState === 'loading')
      document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  ready(function () {
    inject();
    initParticles();
    initMusic();
  });
})();
