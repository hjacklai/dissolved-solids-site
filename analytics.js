/*
 * Google Analytics 4 loader. Shared across every page so a single
 * <script src="/analytics.js" defer> tag in <head> activates GA4.
 *
 * Property: G-4LMG13WS1T (Dissolved Solids and Soluble Solids)
 *
 * Loads asynchronously, does not block render. Honours DNT (do-not-track)
 * by skipping the load entirely if the browser has set the header. Safe to
 * include on every page including /privacy/ and /terms/.
 */
(function () {
  'use strict';
  if (window.doNotTrack === '1' || navigator.doNotTrack === '1' || navigator.msDoNotTrack === '1') {
    return;
  }

  // Inject the gtag.js script.
  var gtagScript = document.createElement('script');
  gtagScript.async = true;
  gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-4LMG13WS1T';
  document.head.appendChild(gtagScript);

  // gtag bootstrap.
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', 'G-4LMG13WS1T', {
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure'
  });
})();
