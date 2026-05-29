# Content-Depth Audit ,  Dissolved Solids / Soluble Solids

Triage document for SEO + LLM trust review. **No deletions.** Every flagged page should be strengthened, not removed. Scoped to production HTML at the repository root, `cocktails/`, `journal/`, `ingredients/`, and the neighbourhood landers (`cocktail-bars-*/`, occasion landers, etc.). Worktree copies under `.claude/` were excluded throughout.

Totals seen: 406 production HTML files with `<title>`. Of those, 393 use the `article-body` content container; 393 carry `<meta name="description">`; 406 carry `<link rel="canonical">`; 405 carry `application/ld+json`.

---

## 1. Thin-content pages (body <300 words)

The site enforces a consistent article skeleton, so file size correlates closely with body word count (one-paragraph lede + section headings + ~6 short paragraphs runs about 6.5-7 KB). Sampling the smallest files in each section:

**Cocktails ,  borderline (260-300 body words):**
- `cocktails/mezcal-negroni/index.html` ,  ~260 words. Missing: history of the variation (when did the mezcal sub start showing up), tasting-arc paragraph, what guests typically reach for after it.
- `cocktails/french-75/index.html` ,  ~280 words. Missing: WWI naming context, who codified the modern build (Harry Craddock), how the prosecco swap changes texture.
- `cocktails/godfather/index.html`, `cocktails/moscow-mule/index.html`, `cocktails/vieux-carre/index.html`, `cocktails/hot-toddy/index.html`, `cocktails/bijou/index.html`, `cocktails/southside/index.html`, `cocktails/bobby-burns/index.html`, `cocktails/paper-plane/index.html`, `cocktails/bramble/index.html`, `cocktails/mint-julep/index.html`, `cocktails/gin-basil-smash/index.html` ,  same ~260-290 body-word range. Each is a classic with deep public history (named bartender, named year, named bar of origin) that is currently absent from the page.

**Ingredients ,  borderline (260-300 body words):**
- `ingredients/thyme/index.html` ,  ~280 words. Missing: a sentence on traditional Malaysian use (or honest "not native to Malaysia") and one named-cocktail history beat.
- `ingredients/sage/index.html` ,  ~290 words. Missing: same.
- `ingredients/apricot/`, `ingredients/rambutan/`, `ingredients/allspice/`, `ingredients/lavender/`, `ingredients/star-anise/`, `ingredients/longan/`, `ingredients/clove/`, `ingredients/soursop/`, `ingredients/rosemary/`, `ingredients/galangal/`, `ingredients/pomelo/`, `ingredients/basil/`, `ingredients/coriander/`, `ingredients/elderflower/`, `ingredients/chamomile/`, `ingredients/peach/`, `ingredients/mango/`, `ingredients/fennel/`, `ingredients/cucumber/`, `ingredients/cinnamon/`, `ingredients/saffron/`, `ingredients/cili-padi/`, `ingredients/mangosteen/`, `ingredients/tamarind/` ,  all under ~7.2 KB, body word counts hovering at the 280-310 threshold. Most lack a Malaysian-context paragraph (where to source, what dish uses it locally) and a "the bartender's calibration" beat that would differentiate them from a generic encyclopaedia entry.

**Journal ,  borderline (note: smallest journal page is `chrysanthemum-tea-cocktails` at ~500 body words, which is fine). No journal entry tested under 300 words. Journal depth is healthy across the board.**

Rough estimate: 35-45 pages site-wide sit in the 260-300 body-word band. None is broken; each is one extra paragraph (Malaysia-context, named history, or signature-cocktail pairing) away from comfortable.

---

## 2. Voice rule violations

### Em-dashes (, )
- `journal/index.html:1448` ,  `const k = a.section || ',  more , ';` ,  in the journal index page's JavaScript fallback label. This em-dash is rendered to readers as the "more" group header on the journal index. Replace with periods or "More" plain text.

### "DSSS" abbreviation
- `journal/index.html:910` ,  string `DSSS · The Journal` (visible content). Direct violation of the writing-rule "never abbreviate to DSSS". Must be replaced with `Dissolved Solids and Soluble Solids · The Journal` or similar.

### "best in / world's best / leading" claims
- `ingredients/sarawak-black-pepper/index.html:43` ,  article lede: "Sarawak grows what most peppercorn nerds consider the world's best black pepper." This phrasing is a humility-rule violation. Reword to "...what many peppercorn growers and chefs consider one of the finest..." or attribute to a named source.
- `journal/tequila-aging-spectrum/index.html:69` ,  "Reposado is the best cocktail base for most bartenders." This is a craft opinion, not a self-promotion claim, so it reads as borderline acceptable. Recommended softening: "Reposado is the most-versatile cocktail base for most bartenders."
- `journal/best-cocktails-for-beginners/index.html` and `best-cocktails-kl/index.html` use "best" in their title slugs as SEO terms (search-volume words). Acceptable as titles describing the topic; the body copy of both stays neutral on first inspection.

### Tracia
- No occurrences. Clean.

---

## 3. Schema and metadata gaps

### Files missing key tags
- `builder/index.html` ,  missing `<meta name="description">` and `application/ld+json`. **Intentional**: file is `<meta robots="noindex">` with a 0-second meta-refresh to `/#builder`. Not a real SEO concern; can be left alone.
- All other 405 production pages carry title + description + canonical + ld+json. **Clean.**

### Descriptions over 160 chars (SERP truncation risk)
Top 20, longest first (all over 160; only a sample of the over-160 set, which is large ,  easily 60+ pages):

1. `dissolvedsolids/index.html` ,  282 chars
2. `solublesolids/index.html` ,  278 chars
3. `cocktails/scented-negroni/index.html` ,  273 chars
4. `cocktails/index.html` ,  268 chars
5. `calculators/index.html` ,  257 chars
6. `journal/calamansi-bar-ingredient/index.html` ,  256 chars
7. `cheatsheets/index.html` ,  247 chars
8. `journal/coffee-cocktails-malaysia/index.html` ,  242 chars
9. `journal/malaysian-kopi-explained/index.html` ,  240 chars
10. `cocktail-bars-pj/index.html` ,  240 chars
11. `cocktail-bars-kl/index.html` ,  237 chars
12. `journal/index.html` ,  236 chars
13. `index.html` ,  235 chars
14. `story/index.html` ,  233 chars
15. `journal/robusta-for-coffee-cocktails/index.html` ,  232 chars
16. `journal/the-tesseract-philosophy/index.html` ,  232 chars
17. `cocktail-bars-klang-valley/index.html` ,  227 chars
18. `cocktail-bars-puchong/index.html` ,  220 chars
19. `cocktail-bars-cyberjaya/index.html` ,  218 chars
20. `journal/late-night-drinks-damansara-kim/index.html` ,  218 chars

Truncation hurts mainly when the first 155 chars omit the value-prop. Most of these front-load well, so the practical SEO penalty is mild. Recommend trimming the most-visited ones (`/`, `/dissolvedsolids/`, `/solublesolids/`, `/journal/`, `/cocktails/`) to under 158 chars.

---

## 4. Title length (>79 chars)

70+ pages exceed 79 chars. Top truncation-risk titles (sorted by length, ~90+ chars):

1. `journal/spice-and-cocktails/` ,  "Spice and Cocktails: Cinnamon, Clove, Cardamom, Sarawak Black Pepper · The Journal · Dissolved Solids" (~102 chars)
2. `cheatsheets/four-templates/` ,  "Four Cocktail Templates · Sour, Sazerac, Spritz, Highball · Printable Cheat Sheet · Dissolved Solids" (~101 chars)
3. `cheatsheets/100-classics/` ,  "100 Classic Cocktails Every Home Bartender Should Know · Printable Cheat Sheet · Dissolved Solids" (~98 chars)
4. `journal/gin-styles-explained/` ,  "Gin Styles Explained: London Dry, Plymouth, Old Tom, Navy Strength, and the Modern Ones · The Journal" (~101 chars)
5. `journal/groups-celebrations-cocktail-bar-pj/` ,  "Birthdays, Hen Nights, Reunions: A Cocktail Bar in PJ for Group Celebrations · The Journal" (~91 chars)
6. `journal/carbonation-at-home/` ,  "Carbonation at Home: SodaStream, iSi Whippers, Kegs, and Choosing Your System · The Journal" (~91 chars)
7. `journal/best-cocktails-for-beginners/` ,  "The Best Cocktails for Beginners: What to Order First · The Journal" (~67 chars ,  within limit; skip)
8. `cocktails/guide/` ,  "Complete Cocktail Recipes Guide · Dissolved Solids and Soluble Solids · Petaling Jaya" (~85 chars)
9. `journal/martini-deep-dive/` ,  "The Martini: A Practical Deep Dive Into the Most-Discussed Cocktail on Earth · The Journal" (~90 chars)
10. `cocktail-bars-ttdi/` ,  "Cocktail Bar near TTDI · Dissolved Solids · Eight Minutes from Taman Tun · 2026 Guide" (~85 chars)
11. `index.html` ,  "Cocktail Bars in PJ (Petaling Jaya) · Dissolved Solids & Soluble Solids · Klang Valley, KL" (~92 chars)
12. `dissolvedsolids/` ,  "Cocktail Bar in Damansara Kim · Dissolved Solids · Petaling Jaya, Klang Valley, KL" (~83 chars)
13. `find-a-cocktail-bar/` ,  "Find a Cocktail Bar in PJ, KL, or the Klang Valley · Dissolved Solids and Soluble Solids" (~88 chars)
14. `cocktail-bars-klang-valley/`, `cocktail-bars-subang/` ,  both ~82 chars (close to limit).
15. `journal/rum-types-explained/` ,  "Rum Types Explained: White, Aged, Dark, Spiced, Overproof, Cachaça · The Journal" (~80 chars)
16. `cocktail-glossary/` ,  "Cocktail Glossary: A-Z of Bartending Terminology · Dissolved Solids and Soluble Solids" (~88 chars)
17. `journal/non-alcoholic-bitterness/` ,  ~93 chars (estimated from list).
18. `mid-autumn-cocktail-pj/`, `mid-autumn-cocktail-kl/` ,  both ~84-85 chars.
19. `cocktail-workshop-kl/`, `mothers-day-cocktail-bar-kl/`, `fathers-day-cocktail-bar-pj/` ,  all ~85-92 chars.
20. `best-cocktails-kl/` ,  "Best Cocktails to Try in KL · What to Order on a Klang Valley Cocktail Night · Dissolved Solids" (~97 chars)

Google generally cuts mobile SERP titles around 50-60 chars; 79 is the desktop comfort line. Recommended: drop "Dissolved Solids" from the suffix on long-title pages (the brand already appears in the URL), keeping the topical keywords forward.

---

## 5. Internal-link 404 risk

Cross-checked all `href="/cocktails/{slug}/"`, `href="/journal/{slug}/"`, and `href="/ingredients/{slug}/"` references against the directories actually present.

- **87 unique cocktail link targets** referenced ,  **all 87 map to existing directories.** No broken cocktail links.
- **136 unique journal link targets** referenced ,  **all 136 map to existing directories.** No broken journal links.
- **49 unique ingredient link targets** referenced ,  **all 49 map to existing directories.** No broken ingredient links.

**Verdict: clean. No internal 404 risk in the audited link patterns.**

---

## 6. Page-pair duplication risk ,  `cocktail-bars-*/`

Eighteen `cocktail-bars-*` pages exist. Two distinct populations are visible:

### Population A ,  Detailed, neighbourhood-differentiated (lower duplication risk)
- `cocktail-bars-pj/`, `cocktail-bars-kl/`, `cocktail-bars-damansara/`, `cocktail-bars-klang-valley/`, `cocktail-bars-ss2/`, `cocktail-bars-ttdi/`, `cocktail-bars-mont-kiara/`, `cocktail-bars-bangsar/`, `cocktail-bars-subang/`, `cocktail-bars-puchong/`

These pages each carry neighbourhood-specific colour: signature cocktail callouts (TTDI page), Sentral-MRT routes (Subang), LDP-northbound directions (Puchong), Bangsar drive context. Lower template-overlap risk.

### Population B ,  High-template duplication risk
Five "far/thin neighbourhood" pages share a near-identical structural template. All carry: identical Lede ("X is a [district description] with thin cocktail-bar scene"), identical two-bars block (Dissolved Solids address + WhatsApp / Soluble Solids address + WhatsApp), Drive Times bullet list (only place names + minute counts swapped), Route paragraph (highway name swapped), Hours block (literally identical), Related reading (the same three target links rotated). The fixed structural content is ~70-80% of the body.

Highest pair-similarity:
- **`cocktail-bars-cheras/` vs `cocktail-bars-setapak/`** ,  structurally near-identical, only neighbourhood names + drive-time numbers + 1 route name differ. **Highest risk.**
- **`cocktail-bars-cyberjaya/` vs `cocktail-bars-putrajaya/`** ,  same; ELITE/Maju phrasing repeats in both, drive times overlap (40 min vs 40-42 min), "after-work tech evening" vs "after-work Friday evening" reads as the same point reworded.
- **`cocktail-bars-kepong/` vs `cocktail-bars-selayang/`** ,  same skeleton, identical MRR2-southbound routing, only neighbourhood names + drive-time minutes differ.
- **`cocktail-bars-ampang/`** ,  also follows the Population B template (with embassy-belt flavour as the only differentiator).
- **`cocktail-bars-shah-alam/`** ,  Population B template + a one-line religious-context callout.

Each Population B page is roughly 280-330 body words, of which 200-220 are template. **Google's duplicate-content classifiers will probably cluster these and only index one or two.**

Recommended: rewrite each Population B page with at least one substantial neighbourhood-specific paragraph (200-300 words) that does not exist on any other page. Topic suggestions: the local food scene context, the historical drinking culture (Cheras kopitiams, Setapak Cantonese coffee shops, Ampang Hilir embassy parties, Cyberjaya tech-worker evening rhythms, Putrajaya's planned-city dry-zone history).

---

## Notes for the owner

- No deletions recommended. Every flagged page has SEO value at its slug; strengthen rather than remove.
- The voice violations (`DSSS · The Journal` on the journal index, em-dash in journal index JS, "world's best" on Sarawak pepper) are quick string-replace fixes.
- The thin-content + duplication risks together affect maybe 50-60 pages; not a site-wide problem, but worth one batch of rewrites.
- Title and description trimming for the home page, both outlet pages, and the journal/cocktails hub pages will give the largest SERP-CTR uplift per minute of work.
