/*
 * journal-related.js
 *
 * Auto-injects a "More from the journal" cross-link block on every
 * article page (anything with .article-mount as the main container).
 *
 * Strategy: keep a single curated list of articles across all categories,
 * filter out the current page's URL, shuffle, take 6, render them as a
 * tidy grid before the existing <footer class="article-foot">. No edits
 * needed to individual article files - this script is loaded globally
 * via appbar.js and self-mounts on detect.
 *
 * Adding a new article: drop one line into ARTICLES. Done.
 */
(function () {
  'use strict';

  // Curated cross-link pool - articles, location pages, recipe hubs.
  // Tag with `cat` so we can balance the 6 picks across categories
  // (otherwise the random shuffle clusters by topic).
  const ARTICLES = [
    // Local guides & funnels
    { url: '/cocktail-bars-pj/',                                  title: 'Cocktail bars in PJ',                          cat: 'local' },
    { url: '/cocktail-bars-damansara/',                           title: 'Cocktail bar in Damansara',                    cat: 'local' },
    { url: '/cocktail-bars-ss2/',                                 title: 'Cocktail bar in SS2',                          cat: 'local' },
    { url: '/cocktail-bars-ttdi/',                                title: 'Cocktail bar near TTDI',                       cat: 'local' },
    { url: '/cocktail-bars-mont-kiara/',                          title: 'Cocktail bar near Mont Kiara',                 cat: 'local' },
    { url: '/cocktail-bars-bangsar/',                             title: 'Cocktail bar near Bangsar',                    cat: 'local' },
    { url: '/cocktail-bars-subang/',                              title: 'Cocktail bar near Subang Jaya',                cat: 'local' },
    { url: '/cocktail-bars-puchong/',                             title: 'Cocktail bar near Puchong',                    cat: 'local' },
    { url: '/cocktail-bars-cheras/',                              title: 'Cocktail bar near Cheras',                     cat: 'local' },
    { url: '/cocktail-bars-shah-alam/',                           title: 'Cocktail bar near Shah Alam',                  cat: 'local' },
    { url: '/cocktail-bars-cyberjaya/',                           title: 'Cocktail bar near Cyberjaya',                  cat: 'local' },
    { url: '/cocktail-bars-putrajaya/',                           title: 'Cocktail bar near Putrajaya',                  cat: 'local' },
    { url: '/cocktail-bars-kepong/',                              title: 'Cocktail bar near Kepong',                     cat: 'local' },
    { url: '/cocktail-bars-setapak/',                             title: 'Cocktail bar near Setapak',                    cat: 'local' },
    { url: '/cocktail-bars-selayang/',                            title: 'Cocktail bar near Selayang',                   cat: 'local' },
    { url: '/cocktail-bars-ampang/',                              title: 'Cocktail bar near Ampang',                     cat: 'local' },
    { url: '/cocktail-glossary/',                                 title: 'Cocktail glossary (A-Z)',                      cat: 'practical' },
    { url: '/cocktail-bars-kl/',                                  title: 'Cocktail bars in KL',                          cat: 'local' },
    { url: '/venue-hire/',                                        title: 'Private venue hire (buy-out)',                 cat: 'local' },
    { url: '/cocktails/guide/',                                   title: 'Complete cocktail recipes guide',              cat: 'practical' },
    { url: '/cocktail-bars-klang-valley/',                        title: 'Cocktail bars in the Klang Valley',            cat: 'local' },
    { url: '/find-a-cocktail-bar/',                               title: 'Find a cocktail bar (hub)',                    cat: 'local' },

    // Practical / context guides
    { url: '/journal/cocktail-bars-petaling-jaya/',               title: 'PJ cocktail bars: neighbourhood guide',        cat: 'practical' },
    { url: '/journal/late-night-drinks-damansara-kim/',           title: 'Late-night drinks in Damansara Kim',           cat: 'practical' },
    { url: '/journal/cocktail-bar-with-parking-pj/',              title: 'Cocktail bar with parking in PJ',              cat: 'practical' },
    { url: '/journal/cocktail-bars-near-1utama/',                 title: 'Cocktail bars near 1Utama',                    cat: 'practical' },
    { url: '/journal/best-time-cocktail-bar-pj/',                 title: 'Best time to visit a cocktail bar in PJ',      cat: 'practical' },
    { url: '/journal/cocktail-bar-pricing-pj/',                   title: 'Cocktail bar prices in PJ',                    cat: 'practical' },
    { url: '/journal/what-to-wear-cocktail-bar-pj/',              title: 'What to wear to a cocktail bar in PJ',         cat: 'practical' },
    { url: '/journal/cocktail-bar-etiquette-malaysia/',           title: 'Cocktail bar etiquette in Malaysia',           cat: 'practical' },
    { url: '/journal/cocktail-bar-near-klcc/',                    title: 'Cocktail bar near KLCC (the PJ alternative)',  cat: 'practical' },
    { url: '/journal/how-to-order-cocktail/',                     title: 'How to order a cocktail',                      cat: 'practical' },
    { url: '/journal/glassware-explained/',                       title: 'Cocktail glassware explained',                 cat: 'practical' },

    // Occasion guides
    { url: '/journal/date-night-cocktail-bars-pj/',               title: 'Date night at a cocktail bar in PJ',           cat: 'occasion' },
    { url: '/journal/cocktail-bar-first-date-pj/',                title: 'Cocktail bar for a first date in PJ',          cat: 'occasion' },
    { url: '/journal/anniversary-cocktail-bar-pj/',               title: 'An anniversary at a cocktail bar in PJ',       cat: 'occasion' },
    { url: '/journal/business-dinner-drinks-pj/',                 title: 'Business dinner drinks in PJ',                 cat: 'occasion' },
    { url: '/journal/cocktail-bar-tourists-kl-pj/',               title: 'Cocktail bars in KL and PJ for tourists',      cat: 'practical' },
    { url: '/journal/things-to-do-damansara-kim/',                title: 'Things to do near Damansara Kim',              cat: 'practical' },
    { url: '/journal/things-to-do-ss2/',                          title: 'Things to do near SS2',                        cat: 'practical' },
    { url: '/journal/cocktail-bar-solo-pj/',                      title: 'Drinking alone at a cocktail bar in PJ',       cat: 'occasion' },
    { url: '/journal/groups-celebrations-cocktail-bar-pj/',       title: 'Groups, celebrations, reunions in PJ',         cat: 'occasion' },
    { url: '/journal/cocktail-bar-non-drinkers/',                 title: 'A cocktail bar for non-drinkers',              cat: 'occasion' },

    // Spirits & ingredients
    { url: '/journal/whisky-bar-pj/',                             title: 'Whisky bar in PJ',                             cat: 'spirits' },
    { url: '/journal/gin-bar-pj/',                                title: 'Gin bar in PJ',                                cat: 'spirits' },
    { url: '/journal/gin-styles-explained/',                      title: 'Gin styles explained',                         cat: 'spirits' },
    { url: '/journal/whisky-vs-whiskey/',                         title: 'Whisky vs whiskey',                            cat: 'spirits' },
    { url: '/journal/rum-types-explained/',                       title: 'Rum types explained',                          cat: 'spirits' },
    { url: '/journal/mezcal-vs-tequila/',                         title: 'Mezcal vs tequila',                            cat: 'spirits' },
    { url: '/journal/vermouth-explained/',                        title: 'Vermouth explained',                           cat: 'spirits' },
    { url: '/journal/amaro-explained/',                           title: 'Amaro explained',                              cat: 'spirits' },
    { url: '/journal/bitters-explained/',                         title: 'Bitters explained',                            cat: 'spirits' },

    // Technique
    { url: '/journal/how-to-taste-spirit/',                       title: 'How to taste a spirit',                        cat: 'technique' },
    { url: '/journal/stirred-vs-shaken/',                         title: 'Stirred vs shaken',                            cat: 'technique' },
    { url: '/journal/sour-template/',                             title: 'The sour template',                            cat: 'technique' },
    { url: '/journal/cocktail-flavor-wheel/',                     title: 'The cocktail flavour wheel',                   cat: 'technique' },
    { url: '/journal/acid-adjustment-cocktails/',                 title: 'Acid adjustment in cocktails',                 cat: 'technique' },
    { url: '/journal/clear-ice-at-home/',                         title: 'Clear ice at home',                            cat: 'technique' },
    { url: '/journal/salt-in-cocktails/',                         title: 'Salt in cocktails',                            cat: 'technique' },
    { url: '/journal/tinctures-and-bitters/',                     title: 'Tinctures and bitters at home',                cat: 'technique' },
    { url: '/journal/fat-washing-spirits/',                       title: 'Fat-washing spirits',                          cat: 'technique' },
    { url: '/journal/milk-washing-clarified/',                    title: 'Milk-washing and clarified cocktails',         cat: 'technique' },
    { url: '/journal/carbonation-at-home/',                       title: 'Carbonation at home',                          cat: 'technique' },
    { url: '/journal/oleo-saccharum/',                            title: 'Oleo saccharum',                               cat: 'technique' },
    { url: '/journal/garnish-theory/',                            title: 'Garnish theory',                               cat: 'technique' },
    { url: '/journal/why-egg-white-cocktails/',                   title: 'Why egg white in cocktails',                   cat: 'technique' },
    { url: '/journal/ice-in-cocktails/',                          title: 'Ice in cocktails',                             cat: 'technique' },

    // Malaysian-local & ingredients
    { url: '/journal/best-malaysian-cocktails-2026/',             title: 'Best Malaysian cocktails to try in 2026',      cat: 'malaysian' },
    { url: '/journal/pandan-in-beverages/',                       title: 'Pandan in beverages',                          cat: 'malaysian' },
    { url: '/journal/gula-melaka-palm-sugar/',                    title: 'Gula melaka and the palm sugar spectrum',      cat: 'malaysian' },
    { url: '/journal/calamansi-bar-ingredient/',                  title: 'Calamansi: the Malaysian citrus',              cat: 'malaysian' },
    { url: '/journal/malaysian-kopi-explained/',                  title: 'Malaysian kopi explained',                     cat: 'malaysian' },
    { url: '/journal/teh-tarik-bartending/',                      title: 'Teh tarik, deconstructed',                     cat: 'malaysian' },
    { url: '/journal/cold-brew-cocktails/',                       title: 'Cold brew coffee for cocktails',               cat: 'malaysian' },
    { url: '/journal/espresso-cocktails-technique/',              title: 'Espresso in cocktails: technique',             cat: 'malaysian' },
    { url: '/journal/white-coffee-ipoh-cocktails/',               title: 'Ipoh white coffee in cocktails',               cat: 'malaysian' },
    { url: '/journal/coffee-chocolate-pairings/',                 title: 'Coffee and chocolate in cocktails',            cat: 'malaysian' },
    { url: '/journal/vietnamese-phin-cocktails/',                 title: 'Vietnamese phin in cocktails',                 cat: 'malaysian' },
    { url: '/journal/decaf-coffee-cocktails/',                    title: 'Decaf coffee cocktails',                       cat: 'practical' },
    { url: '/journal/single-origin-coffee-cocktails/',            title: 'Single-origin coffee in cocktails',            cat: 'malaysian' },
    { url: '/journal/history-of-coffee-cocktails/',               title: 'History of coffee cocktails',                  cat: 'deepdive' },
    { url: '/journal/pu-erh-tea-cocktails/',                      title: 'Pu-erh tea in cocktails',                      cat: 'malaysian' },
    { url: '/journal/chamomile-cocktails/',                       title: 'Chamomile in cocktails',                       cat: 'malaysian' },
    { url: '/journal/iced-lemon-tea-cocktails/',                  title: 'Iced lemon tea, deconstructed',                cat: 'malaysian' },
    { url: '/journal/chrysanthemum-tea-cocktails/',               title: 'Chrysanthemum tea in cocktails',               cat: 'malaysian' },
    { url: '/journal/cider-cocktails/',                           title: 'Cider in cocktails',                           cat: 'ferment' },
    { url: '/journal/mead-cocktails/',                            title: 'Mead in cocktails',                            cat: 'ferment' },
    { url: '/journal/beer-cocktails/',                            title: 'Beer in cocktails',                            cat: 'ferment' },
    { url: '/journal/pickle-brine-cocktails/',                    title: 'Pickle brine in cocktails',                    cat: 'ferment' },
    { url: '/journal/pregnancy-cocktail-menu/',                   title: 'Pregnancy cocktail menu',                      cat: 'zero' },
    { url: '/journal/non-alcoholic-bitterness/',                  title: 'NA bitterness in cocktails',                   cat: 'zero' },
    { url: '/journal/non-alcoholic-malaysian-food-pairing/',      title: 'NA pairings for Malaysian food',               cat: 'zero' },
    { url: '/journal/non-alcoholic-beer-cocktails/',              title: 'Non-alcoholic beer in cocktails',              cat: 'zero' },
    { url: '/journal/new-year-eve-cocktails-pj/',                 title: "New Year's Eve cocktails in PJ",               cat: 'occasion' },
    { url: '/journal/chinese-new-year-cocktails/',                title: 'Chinese New Year cocktails in PJ',             cat: 'occasion' },
    { url: '/journal/hari-raya-non-alcoholic-drinks/',            title: 'Hari Raya non-alcoholic drinks',               cat: 'occasion' },
    { url: '/journal/christmas-cocktails-pj/',                    title: 'Christmas cocktails in PJ',                    cat: 'occasion' },
    { url: '/journal/bandung-cocktail/',                          title: 'Bandung, grown up',                            cat: 'malaysian' },
    { url: '/journal/cili-padi-cocktails/',                       title: 'Cili padi in cocktails',                       cat: 'malaysian' },
    { url: '/journal/lemongrass-cocktails/',                      title: 'Lemongrass in cocktails',                      cat: 'malaysian' },
    { url: '/journal/kaffir-lime-leaf-cocktails/',                title: 'Kaffir lime leaf in cocktails',                cat: 'malaysian' },
    { url: '/journal/hibiscus-roselle-cocktails/',                title: 'Hibiscus and roselle',                         cat: 'malaysian' },
    { url: '/journal/bunga-kantan-cocktails/',                    title: 'Bunga kantan in cocktails',                    cat: 'malaysian' },
    { url: '/journal/sambal-in-cocktails/',                       title: 'Sambal in cocktails',                          cat: 'malaysian' },
    { url: '/journal/coconut-water-cocktails/',                   title: 'Coconut water in cocktails',                   cat: 'malaysian' },
    { url: '/journal/malaysian-fruits-cocktails/',                title: 'Malaysian fruits in cocktails',                cat: 'malaysian' },
    { url: '/journal/pairing-cocktails-malaysian-food/',          title: 'Cocktails with Malaysian food',                cat: 'malaysian' },
    { url: '/journal/malaysian-tea-culture/',                     title: 'Malaysian tea culture',                        cat: 'malaysian' },
    { url: '/journal/robusta-for-coffee-cocktails/',              title: 'Robusta for coffee cocktails',                 cat: 'malaysian' },

    // Mocktails & fermentation
    { url: '/journal/the-savoury-mocktail/',                      title: 'The savoury mocktail manifesto',               cat: 'zero' },
    { url: '/journal/non-alcoholic-bars-kl/',                     title: 'Non-alcoholic cocktail bars in KL',            cat: 'zero' },
    { url: '/journal/tropical-kombucha-brewing/',                 title: 'Brewing kombucha in tropical climates',        cat: 'ferment' },
    { url: '/journal/shrubs-and-switchels/',                      title: 'Shrubs and switchels',                         cat: 'ferment' },
    { url: '/journal/lacto-fermentation-cocktails/',              title: 'Lacto-fermentation in cocktails',              cat: 'ferment' },
    { url: '/journal/tepache-cocktails/',                         title: 'Tepache for cocktails',                        cat: 'ferment' },
    { url: '/journal/vinegar-mother-at-home/',                    title: 'Making a vinegar mother at home',              cat: 'ferment' },
    { url: '/journal/wild-fermentation-safety/',                  title: 'Wild fermentation safety',                     cat: 'ferment' },
    { url: '/journal/cold-brew-tea-cocktails/',                   title: 'Cold-brew tea for cocktails',                  cat: 'malaysian' },
    { url: '/journal/matcha-cocktails/',                          title: 'Matcha in cocktails',                          cat: 'malaysian' },
    { url: '/journal/butterfly-pea-flower-cocktails/',            title: 'Butterfly pea flower in cocktails',            cat: 'malaysian' },
    { url: '/journal/earl-grey-cocktails/',                       title: 'Earl Grey in cocktails',                       cat: 'malaysian' },
    { url: '/journal/non-alcoholic-spirit-substitutes/',          title: 'Non-alcoholic spirit substitutes',             cat: 'zero' },
    { url: '/journal/zero-proof-spritz-formats/',                 title: 'Zero-proof spritz formats',                    cat: 'zero' },
    { url: '/journal/non-alcoholic-negroni/',                     title: 'Non-alcoholic Negroni',                        cat: 'zero' },
    { url: '/journal/asam-boi-cocktails/',                        title: 'Asam boi in cocktails',                        cat: 'malaysian' },
    { url: '/journal/tamarind-cocktails/',                        title: 'Tamarind in cocktails',                        cat: 'malaysian' },
    { url: '/journal/negroni-family-tree/',                       title: 'The Negroni family tree',                      cat: 'deepdive' },
    { url: '/journal/daiquiri-deep-dive/',                        title: 'Why the Daiquiri is the maker\'s test',        cat: 'deepdive' },
    { url: '/journal/how-we-batch-infusions/',                    title: 'Behind the back shelf - how we batch',         cat: 'deepdive' },
    { url: '/journal/music-at-cocktail-bar/',                     title: 'Music at a cocktail bar',                      cat: 'deepdive' },

    // Deep dives
    { url: '/journal/martini-deep-dive/',                         title: 'The Martini deep dive',                        cat: 'deepdive' },
    { url: '/journal/why-our-menu-is-short/',                     title: 'Why our menu is short on purpose',             cat: 'deepdive' },
    { url: '/journal/best-cocktails-for-beginners/',              title: 'Cocktails for beginners',                      cat: 'deepdive' },
    { url: '/journal/home-bar-malaysia/',                         title: 'A home bar in Malaysia',                       cat: 'deepdive' },
    { url: '/journal/batching-cocktails-parties/',                title: 'Batching cocktails for a party',               cat: 'deepdive' },
    { url: '/journal/simple-syrup-guide/',                        title: 'Simple syrup, rich syrup, and the rest',       cat: 'deepdive' },
    { url: '/journal/smoke-in-cocktails/',                        title: 'Smoke in cocktails',                           cat: 'deepdive' },
    { url: '/journal/how-to-shake-cocktail/',                     title: 'How to shake a cocktail',                      cat: 'deepdive' },
  ];

  // Pick 6 items balanced across categories, excluding the current page.
  function pickSix(currentUrl) {
    const norm = currentUrl.replace(/\/$/, '');
    const pool = ARTICLES.filter((a) => a.url.replace(/\/$/, '') !== norm);

    // Bucket by category, shuffle each bucket, take 1 from each in rotation.
    const buckets = {};
    pool.forEach((a) => {
      (buckets[a.cat] = buckets[a.cat] || []).push(a);
    });
    Object.keys(buckets).forEach((k) => shuffle(buckets[k]));

    const catOrder = Object.keys(buckets);
    shuffle(catOrder);

    const picked = [];
    let i = 0;
    while (picked.length < 6 && catOrder.length) {
      const cat = catOrder[i % catOrder.length];
      if (buckets[cat] && buckets[cat].length) {
        picked.push(buckets[cat].shift());
      } else {
        // bucket exhausted, drop it
        catOrder.splice(i % catOrder.length, 1);
        if (!catOrder.length) break;
        continue;
      }
      i++;
    }
    return picked;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function build() {
    // Only inject on full article pages, not on the journal index itself.
    const mount = document.querySelector('main.article-mount > article.article');
    if (!mount) return;
    const foot = mount.querySelector('footer.article-foot');
    if (!foot) return;
    if (mount.querySelector('.journal-related')) return; // idempotent

    const picks = pickSix(window.location.pathname);
    if (!picks.length) return;

    const section = document.createElement('aside');
    section.className = 'journal-related';
    section.setAttribute('aria-label', 'More from the journal');
    section.innerHTML = `
      <div class="jr-head">
        <span class="jr-eyebrow">More from the journal</span>
        <h3>Keep <i>reading</i>.</h3>
        <p class="jr-sub">A small handful of unrelated angles. Pick the one that catches your eye.</p>
      </div>
      <ul class="jr-list">
        ${picks.map((p) => `
          <li><a href="${p.url}"><span class="jr-arrow" aria-hidden="true">→</span><span class="jr-title">${p.title}</span></a></li>
        `).join('')}
      </ul>
      <p class="jr-all"><a href="/journal/">See all 80+ journal entries →</a></p>
    `;
    mount.insertBefore(section, foot);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
