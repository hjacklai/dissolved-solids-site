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

    // Subtle drift dots — visible but unobtrusive on any background
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
    const count = isTouch || isSmall ? 8 : 22;
    for (let i = 0; i < count; i++) {
      const d = document.createElement('span');
      d.className = 'atmo-dot';
      d.style.left = Math.random() * 100 + '%';
      d.style.bottom = -5 - Math.random() * 30 + 'vh';
      d.style.animationDuration = 18 + Math.random() * 22 + 's';
      d.style.animationDelay = -Math.random() * 35 + 's';
      const size = 2 + Math.random() * 3;
      d.style.width = d.style.height = size + 'px';
      container.appendChild(d);
    }
  }

  function initMusic() {
    const mt = document.querySelector('.atmo-music');
    if (!mt) return;
    const tip = mt.querySelector('.tip');
    let audioCtx = null;
    let nodes = null;

    function buildPad() {
      const ctx = (audioCtx = new (window.AudioContext || window.webkitAudioContext)());
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      filter.Q.value = 0.6;
      filter.connect(master);
      function voice(freq, type, detune) {
        const o = ctx.createOscillator();
        o.type = type || 'sine';
        o.frequency.value = freq;
        o.detune.value = detune || 0;
        const g = ctx.createGain();
        g.gain.value = 0.25;
        o.connect(g);
        g.connect(filter);
        o.start();
        return { osc: o, gain: g };
      }
      voice(98, 'sine');
      voice(146.8, 'sine', -4);
      const v3 = voice(196, 'triangle', 6);
      v3.gain.gain.value = 0.12;
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.05;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 320;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      return { ctx, master, filter };
    }

    async function start() {
      if (!nodes) nodes = buildPad();
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      nodes.master.gain.cancelScheduledValues(audioCtx.currentTime);
      nodes.master.gain.setTargetAtTime(0.06, audioCtx.currentTime, 0.8);
      mt.classList.add('playing');
      if (tip) tip.textContent = 'ambient · tap to stop';
    }
    function stop() {
      if (!nodes) return;
      nodes.master.gain.cancelScheduledValues(audioCtx.currentTime);
      nodes.master.gain.setTargetAtTime(0, audioCtx.currentTime, 0.6);
      mt.classList.remove('playing');
      if (tip) tip.textContent = 'tap to play · ambient';
    }
    mt.addEventListener('click', function () {
      if (mt.classList.contains('playing')) stop();
      else start();
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
