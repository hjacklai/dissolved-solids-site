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

    // Inject the WA/IG float CSS inline so it applies even on pages
    // that don't load styles.css (e.g. journal/, which is self-contained).
    if (!document.getElementById('atmoFloatsCSS')) {
      const css = document.createElement('style');
      css.id = 'atmoFloatsCSS';
      css.textContent =
        /* Music bubble (bottom-left). Self-contained CSS so pages
           that don't load /styles.css still render it correctly. */
        '.atmo-music{position:fixed;bottom:96px;left:16px;z-index:60;width:46px;height:46px;border-radius:50%;background:rgba(0,0,0,.65);backdrop-filter:blur(14px) saturate(140%);-webkit-backdrop-filter:blur(14px) saturate(140%);border:1px solid rgba(255,255,255,.22);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;transition:transform .25s,background .25s,border-color .25s;}' +
        '.atmo-music:hover{transform:translateY(-2px) scale(1.05);border-color:rgba(255,255,255,.5);}' +
        '.atmo-music.playing{background:#ff3d8a;border-color:#ff3d8a;color:#fff;}' +
        '.atmo-music .bars{display:flex;align-items:end;gap:2px;height:14px;}' +
        '.atmo-music .bars i{display:block;width:2.5px;background:currentColor;border-radius:1px;animation-play-state:paused;}' +
        '.atmo-music .bars i:nth-child(1){height:40%;animation:atmoBarA .9s ease-in-out infinite alternate;}' +
        '.atmo-music .bars i:nth-child(2){height:80%;animation:atmoBarB .7s ease-in-out infinite alternate;}' +
        '.atmo-music .bars i:nth-child(3){height:60%;animation:atmoBarA 1.1s ease-in-out infinite alternate;}' +
        '.atmo-music .bars i:nth-child(4){height:90%;animation:atmoBarB .8s ease-in-out infinite alternate;}' +
        '.atmo-music.playing .bars i{animation-play-state:running;}' +
        '@keyframes atmoBarA{from{height:30%;}to{height:95%;}}' +
        '@keyframes atmoBarB{from{height:85%;}to{height:25%;}}' +
        '.atmo-music .tip{display:none;}' +
        /* WA/IG floats (bottom-right) */
        '.atmo-floats{position:fixed;bottom:96px;right:16px;z-index:60;display:flex;flex-direction:column;gap:10px;}' +
        '.atmo-float{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;background:rgba(0,0,0,.65);backdrop-filter:blur(14px) saturate(140%);-webkit-backdrop-filter:blur(14px) saturate(140%);border:1px solid rgba(255,255,255,.22);color:#fff;transition:transform .25s,background .25s,border-color .25s;}' +
        '.atmo-float svg{width:20px;height:20px;}' +
        '.atmo-float:hover{transform:translateY(-2px) scale(1.05);}' +
        '.atmo-float.atmo-wa:hover{background:#25d366;border-color:#25d366;}' +
        '.atmo-float.atmo-ig:hover{background:linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);border-color:transparent;}' +
        '.atmo-float:focus-visible{outline:2px solid #ff3d8a;outline-offset:3px;}' +
        '@media (max-width:640px){.atmo-music,.atmo-floats{bottom:100px;}.atmo-music{left:12px;width:44px;height:44px;}.atmo-floats{right:12px;gap:8px;}.atmo-float{width:44px;height:44px;}}' +
        '@media (prefers-reduced-motion:reduce){.atmo-music,.atmo-music:hover,.atmo-float,.atmo-float:hover{transform:none;transition:none;}.atmo-music .bars i{animation:none !important;}}';
      document.head.appendChild(css);
    }

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

    // WhatsApp + Instagram floats, bottom-right. State-aware: on a
    // soluble-state page they link to Soluble Solids' WhatsApp; on
    // dissolved-state pages to Dissolved Solids'. Sub-pages set
    // data-state once and don't flip mid-session, so we just read it.
    const state = document.documentElement.dataset.state || 'soluble';
    const waNumber = state === 'dissolved' ? '601140087607' : '601116828651';
    const igHandle = state === 'dissolved' ? 'dissolvedsolids.kl' : 'solublesolids.kl';
    const floats = document.createElement('div');
    floats.className = 'atmo-floats';
    floats.setAttribute('aria-hidden', 'false');
    floats.innerHTML =
      '<a class="atmo-float atmo-wa" href="https://wa.me/' + waNumber + '" target="_blank" rel="noopener" aria-label="WhatsApp us">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<path d="M3 21l1.65-4.95A8 8 0 1 1 12 20a8.06 8.06 0 0 1-3.94-1.03L3 21z"/>' +
          '<path d="M8.5 9c0 4 3 6 6 6-.3 1-1 1.5-1.7 1.5-3.3 0-6-2.7-6-6 0-.7.5-1.4 1.5-1.7l.5 1.2-.3.5z" fill="currentColor" stroke="none"/>' +
        '</svg>' +
      '</a>' +
      '<a class="atmo-float atmo-ig" href="https://instagram.com/' + igHandle + '" target="_blank" rel="noopener" aria-label="Instagram">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<rect x="3" y="3" width="18" height="18" rx="5"/>' +
          '<circle cx="12" cy="12" r="4"/>' +
          '<circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>' +
        '</svg>' +
      '</a>';
    document.body.appendChild(floats);
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
      // preload=metadata loads ~few KB only - full bytes fetch on
      // play(). Saves ~2MB per page load for users who never start
      // the music. (The aggressive <link rel="preload"> hint that
      // used to inject here is also gone - it was forcing the full
      // track onto every visitor's connection even before the script
      // ran.)
      audio.preload = 'metadata';
      audio.volume = 0;
    }
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
    // Autoplay engine + pause-on-tab-hidden. Browsers block audio
    // without a user gesture and the gesture allowance does NOT carry
    // across navigations, so we retry on every visible lifecycle event
    // (load, pageshow incl. BFCache, tab refocus) AND keep a
    // gesture-fallback armed for any pointer / key / scroll / wheel
    // input. Re-armed after every retry. The hide branch pauses the
    // audio when the tab/app loses focus and resumes when it returns,
    // unless the user had explicitly stopped via the toggle.
    var gestureEvts = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel'];
    var armed = false;
    var wasPlayingBeforeHide = false;
    var userStopped = false;
    function tryStart() { if (!mt.classList.contains('playing') && !userStopped) start(); }
    function onGesture(e) {
      var onToggle = e.target && e.target.closest && e.target.closest('.atmo-music');
      if (!mt.classList.contains('playing') && !onToggle && !userStopped) start();
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
    new MutationObserver(function () {
      if (!mt.classList.contains('playing') && !document.hidden) userStopped = true;
      if (mt.classList.contains('playing')) userStopped = false;
    }).observe(mt, { attributes: true, attributeFilter: ['class'] });
    function pauseForHide() {
      if (audio && !audio.paused) {
        wasPlayingBeforeHide = true;
        audio.pause();
        mt.classList.remove('playing');
      }
    }
    function resumeAfterShow() {
      if (wasPlayingBeforeHide && !userStopped) {
        wasPlayingBeforeHide = false;
        start();
      }
    }
    tryStart();
    armGesture();
    window.addEventListener('pageshow', function () { tryStart(); armGesture(); });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        pauseForHide();
      } else if (wasPlayingBeforeHide) {
        resumeAfterShow();
      } else {
        tryStart();
        armGesture();
      }
    });
    window.addEventListener('blur', pauseForHide);
    window.addEventListener('focus', function () { if (wasPlayingBeforeHide) resumeAfterShow(); });
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
