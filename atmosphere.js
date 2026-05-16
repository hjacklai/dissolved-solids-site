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

    // Drift dots — rising upward, varied amber/rose/cream
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

    // Petal flakes — slower, falling downward, organic rotation
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
    let audioCtx = null;
    let nodes = null;

    function buildMusic() {
      const ctx = (audioCtx = new (window.AudioContext || window.webkitAudioContext)());

      // Master out
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      // PAD BUS — low-pass filtered drone, slow LFO sweep
      const padBus = ctx.createGain();
      padBus.gain.value = 0.55;
      padBus.connect(master);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      filter.Q.value = 0.6;
      filter.connect(padBus);
      function voice(freq, type, detune) {
        const o = ctx.createOscillator();
        o.type = type || 'sine';
        o.frequency.value = freq;
        o.detune.value = detune || 0;
        const g = ctx.createGain();
        g.gain.value = 0.25;
        o.connect(g); g.connect(filter);
        o.start();
        return { osc: o, gain: g };
      }
      voice(98, 'sine');         // G2
      voice(146.8, 'sine', -4);  // D3
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

      // BEAT BUS — soft kick on 1+3, shaker on offbeats
      const beatBus = ctx.createGain();
      beatBus.gain.value = 0.9;
      beatBus.connect(master);

      function kick(when) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(120, when);
        o.frequency.exponentialRampToValueAtTime(45, when + 0.12);
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(0.45, when + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, when + 0.45);
        o.connect(g); g.connect(beatBus);
        o.start(when);
        o.stop(when + 0.5);
      }

      // Pre-build a noise buffer once for shaker reuse
      const noiseDur = 0.08;
      const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * noiseDur), ctx.sampleRate);
      const noiseData = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = (Math.random() - 0.5) * Math.exp(-i / (ctx.sampleRate * 0.02));
      }
      function shaker(when) {
        const src = ctx.createBufferSource();
        src.buffer = noiseBuf;
        const f = ctx.createBiquadFilter();
        f.type = 'highpass';
        f.frequency.value = 5500;
        const g = ctx.createGain();
        g.gain.value = 0.10;
        src.connect(f); f.connect(g); g.connect(beatBus);
        src.start(when);
      }

      // 8-step scheduler at 16th notes
      // Step pattern (4/4 at 76 BPM): K . S . K . S .   →   K on 0,4 + S on 2,6
      // With a quieter hat-shake on every odd step for swing texture.
      const BPM = 76;
      const stepTime = 60 / BPM / 4; // 16th-note duration
      let step = 0;
      let nextTime = 0;
      let intervalId = null;

      function tick() {
        const ahead = ctx.currentTime + 0.18;
        while (nextTime < ahead) {
          if (step === 0 || step === 8) kick(nextTime);            // downbeats 1 & 3
          if (step === 4 || step === 12) shaker(nextTime);         // 2 & 4 (heavier shake)
          if (step % 2 === 1) shaker(nextTime);                    // soft offbeat texture
          nextTime += stepTime;
          step = (step + 1) % 16;
        }
      }

      function startBeat() {
        if (intervalId) return;
        step = 0;
        nextTime = ctx.currentTime + 0.12;
        intervalId = setInterval(tick, 40);
      }
      function stopBeat() {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
      }

      return { ctx, master, padBus, beatBus, startBeat, stopBeat };
    }

    async function start() {
      try {
        if (!nodes) nodes = buildMusic();
        if (audioCtx.state === 'suspended') await audioCtx.resume();
        const now = audioCtx.currentTime;
        const g = nodes.master.gain;
        g.cancelScheduledValues(now);
        g.setValueAtTime(g.value, now);
        g.linearRampToValueAtTime(0.18, now + 1.2);
        nodes.startBeat();
        mt.classList.add('playing');
        if (tip) tip.textContent = 'ambient · tap to stop';
      } catch (e) {
        console.warn('music start failed', e);
        if (tip) tip.textContent = 'audio unavailable';
      }
    }
    function stop() {
      if (!nodes) return;
      try {
        const now = audioCtx.currentTime;
        const g = nodes.master.gain;
        g.cancelScheduledValues(now);
        g.setValueAtTime(g.value, now);
        g.linearRampToValueAtTime(0, now + 0.6);
        // Stop scheduling new beats slightly before mute so the trailing
        // kicks don't poke through silence
        setTimeout(function () { nodes.stopBeat(); }, 400);
        mt.classList.remove('playing');
        if (tip) tip.textContent = 'tap to play · ambient';
      } catch (e) {
        console.warn('music stop failed', e);
      }
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
