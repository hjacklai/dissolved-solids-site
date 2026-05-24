/*
 * cocktail-tools.js
 *
 * Auto-injects two utilities onto every cocktail recipe page:
 *
 *   1. "Print recipe" button - opens browser print dialog with a
 *      cocktail-print-friendly stylesheet applied. Saves a clean PDF.
 *
 *   2. "Embed this recipe" snippet - small modal/disclosure that
 *      reveals an iframe snippet other sites can paste into their
 *      blog. Each embed includes attribution back to dissolvedsolids.co
 *      for backlink value.
 *
 * Loaded via appbar.js auto-loader on /cocktails/<slug>/ pages.
 * Self-detects: only injects if a Recipe schema block is present.
 */
(function () {
  'use strict';
  // Only run on cocktail recipe pages (have a Recipe schema)
  var recipeSchemaEl = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).find(function (s) {
    try { return JSON.parse(s.textContent)['@type'] === 'Recipe'; } catch (e) { return false; }
  });
  if (!recipeSchemaEl) return;
  if (document.querySelector('.cocktail-tools')) return; // idempotent

  // Recipe data
  var recipeData;
  try { recipeData = JSON.parse(recipeSchemaEl.textContent); } catch (e) { return; }
  var recipeName = recipeData.name || 'Cocktail';
  var recipeUrl = recipeData.url || window.location.href;

  // Language detection — ZH on /zh/ pages, EN otherwise
  var isZh = /^zh(-|$)/i.test(document.documentElement.lang || '');
  var T = isZh ? {
    tools: '工具',
    print: '⎙ 打印配方',
    copyLink: '🔗 复制链接',
    copied: '✓ 已复制',
    embedSummary: '📎 将此配方嵌入你的网站',
    embedHelp: '复制以下代码段粘贴到你的博客或网站。自动包含返回我们的署名链接。',
    copySnippet: '📋 复制代码',
    recipeFrom: '配方由 Dissolved Solids 提供',
    recipeLabel: '配方',
    by: '·'
  } : {
    tools: 'Tools',
    print: '⎙ Print recipe',
    copyLink: '🔗 Copy link',
    copied: '✓ Copied',
    embedSummary: '📎 Embed this recipe on your site',
    embedHelp: 'Copy and paste this snippet into your blog or website. Auto-includes attribution back to us.',
    copySnippet: '📋 Copy snippet',
    recipeFrom: 'recipe from Dissolved Solids',
    recipeLabel: 'Recipe:',
    by: 'by'
  };

  // Find the article-body to mount inside; fall back to article
  var body = document.querySelector('.article-body') || document.querySelector('article');
  if (!body) return;

  // Build the panel
  var panel = document.createElement('section');
  panel.className = 'cocktail-tools';
  panel.innerHTML = ''
    + '<style>'
    + '.cocktail-tools { margin: 36px 0; padding: 22px 24px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.10); border-radius: 10px; }'
    + '.cocktail-tools .ct-head { font-family: var(--mono); font-size: 10px; letter-spacing: .22em; text-transform: uppercase; color: rgba(255,255,255,.55); margin: 0 0 12px; }'
    + '.cocktail-tools .ct-actions { display: flex; gap: 10px; flex-wrap: wrap; }'
    + '.cocktail-tools .ct-btn { padding: 10px 18px; border-radius: 22px; background: transparent; border: 1px solid rgba(255,255,255,.25); color: var(--paper); font-family: var(--mono); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; cursor: pointer; transition: all .18s ease; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }'
    + '.cocktail-tools .ct-btn:hover { border-color: var(--accent); color: var(--accent); }'
    + '.cocktail-tools details { margin-top: 14px; }'
    + '.cocktail-tools details summary { cursor: pointer; font-family: var(--mono); font-size: 11px; color: rgba(255,255,255,.55); letter-spacing: .14em; text-transform: uppercase; }'
    + '.cocktail-tools details[open] summary { color: var(--paper); margin-bottom: 8px; }'
    + '.cocktail-tools .embed-code { display: block; width: 100%; min-height: 60px; margin: 8px 0; padding: 12px; background: rgba(0,0,0,.4); border: 1px solid rgba(255,255,255,.12); border-radius: 6px; font-family: var(--mono); font-size: 11px; line-height: 1.4; color: var(--paper); resize: vertical; }'
    + '.cocktail-tools .copy-help { font-family: var(--mono); font-size: 9.5px; letter-spacing: .14em; color: rgba(255,255,255,.45); margin: 0; text-transform: uppercase; }'
    + '@media print { .cocktail-tools { display: none !important; } }'
    + '</style>'
    + '<p class="ct-head">' + T.tools + '</p>'
    + '<div class="ct-actions">'
    +   '<button type="button" class="ct-btn" id="ctPrint">' + T.print + '</button>'
    +   '<a class="ct-btn" id="ctShare" href="#">' + T.copyLink + '</a>'
    + '</div>'
    + '<details>'
    +   '<summary>' + T.embedSummary + '</summary>'
    +   '<p class="copy-help">' + T.embedHelp + '</p>'
    +   '<textarea class="embed-code" readonly id="ctEmbedCode"></textarea>'
    +   '<button type="button" class="ct-btn" id="ctCopyEmbed">' + T.copySnippet + '</button>'
    + '</details>';
  // Insert at the END of the article body, before any aside/footer
  body.appendChild(panel);

  // Print
  document.getElementById('ctPrint').addEventListener('click', function () {
    window.print();
  });

  // Share link (copies URL to clipboard with subtle confirmation)
  document.getElementById('ctShare').addEventListener('click', function (e) {
    e.preventDefault();
    var url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () {
        var btn = e.target;
        var orig = btn.textContent;
        btn.textContent = T.copied;
        setTimeout(function () { btn.textContent = orig; }, 1800);
      });
    }
  });

  // Embed snippet
  var embed = '<iframe src="' + recipeUrl + '?embed=1" '
    + 'width="100%" height="640" '
    + 'frameborder="0" '
    + 'style="border:1px solid #e0d8c8;border-radius:10px;max-width:560px;" '
    + 'title="' + escapeHtml(recipeName) + ' ' + T.recipeFrom + '"></iframe>\n'
    + '<p style="font-size:11px;color:#888;font-family:sans-serif;margin:6px 0 0;">'
    + T.recipeLabel + ' <a href="' + recipeUrl + '" rel="noopener" target="_blank">'
    + escapeHtml(recipeName) + '</a> ' + T.by + ' '
    + '<a href="https://dissolvedsolids.co/" rel="noopener" target="_blank">Dissolved Solids</a></p>';
  document.getElementById('ctEmbedCode').value = embed;
  document.getElementById('ctCopyEmbed').addEventListener('click', function (e) {
    var ta = document.getElementById('ctEmbedCode');
    ta.select();
    try { document.execCommand('copy'); } catch (err) {}
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ta.value);
    }
    var btn = e.target;
    var orig = btn.textContent;
    btn.textContent = T.copied;
    setTimeout(function () { btn.textContent = orig; }, 1800);
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  // If URL has ?embed=1, strip the chrome for embedded iframe display
  if (location.search.indexOf('embed=1') !== -1) {
    var hideSel = ['header', '.journal-bar', '.appbar', '.floats', '.cocktail-tools', '.similar-drinks', '.journal-cta', '.article-foot', '.journal-related'];
    hideSel.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) { el.style.display = 'none'; });
    });
    document.documentElement.style.background = '#faf3df';
    document.body.style.background = '#faf3df';
    document.body.style.color = '#18181c';
    document.body.style.padding = '20px';
    // Force-show all text content in dark colors for embed
    var st = document.createElement('style');
    st.textContent = 'body, body *, .article-title, .article-dek, .article-meta, h1, h2, h3, p, li, span, ul, ol { color: #18181c !important; background-color: transparent !important; }'
      + '.state-layer, .grain, .dissolve-overlay, .pattern, .scrim, .hero-photo { display: none !important; }'
      + '.article { padding: 0; }';
    document.head.appendChild(st);
  }
})();
