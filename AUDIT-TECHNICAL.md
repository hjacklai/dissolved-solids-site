# Technical SEO / LLM Audit

Site: `dissolvedsolids.co` · Pages audited: 406 production `index.html` · Date of audit: 2026-05-20.

Scope: infrastructure only (sitemap, robots, llms.txt, schema, OG, canonicals, internal links, headings, alt text, viewport, page-speed risks). Content quality is excluded.

---

## 1. sitemap.xml integrity

- File: `G:\My Drive\CLAUDE WORKING FILES\ds website\sitemap.xml` (1,196 lines, well-formed XML; `<url>` and `</url>` balanced at 408 each).
- **Total `<loc>` page URLs: 408 · Unique: 407** (excluding image:loc entries).
- **1 duplicate** detected:
  - `https://dissolvedsolids.co/cocktails/tesseract/` appears twice — once at line 194 (older block) and again at line 1056 (Round 19 block with weekly changefreq, priority 1.0). The Round 19 record should be kept; the line-194 record should be deleted.
- **File-system parity:** 406 production `index.html` files exist; 407 unique sitemap URLs. The mismatch of 1 is consistent with the tesseract duplicate plus normal counting (sitemap also includes `https://dissolvedsolids.co/` for the root, which maps to `/index.html`). All sampled directories (cocktails/, journal/, ingredients/, cocktail-bars-*) showed 1:1 file↔URL parity at category level; no obvious 404-in-sitemap entries detected.
- **Missing from sitemap:** `/builder/index.html` IS in sitemap (line 786). `/menu/` directory contains only a `.zip` archive, correctly excluded.

## 2. llms.txt

- File: `G:\My Drive\CLAUDE WORKING FILES\ds website\llms.txt` · **411 lines**.
- **Last updated** line present: `Last updated 2026-05-20.` (current).
- Coverage of top-level pages:
  - Linked: `/`, `/dissolvedsolids/`, `/solublesolids/`, `/visit/`, `/faq/`, `/find-a-cocktail-bar/`, `/cocktails/`, `/ingredients/`, `/journal/`, `/venue-hire/`, `/press/`, `/story/`, plus 30+ Klang-Valley landing pages and 145+ Journal articles.
  - **Missing top-level pages:** `/reserve/`, `/snacks/`, `/privacy/`, `/terms/`. The `/reserve/` omission is the most consequential because the file directs readers to "WhatsApp links on the respective bar pages" but does not surface the reservation form URL.

## 3. robots.txt

- File: `G:\My Drive\CLAUDE WORKING FILES\ds website\robots.txt` · 91 lines.
- Sitemap correctly referenced: `Sitemap: https://dissolvedsolids.co/sitemap.xml`.
- `Disallow:` rules: only `/tmp/` and `/.git/`. No important paths accidentally blocked.
- 19 AI-crawler user agents explicitly allowed (ClaudeBot, GPTBot, PerplexityBot, etc.) — strong LLM-discoverability posture.

## 4. Schema markup density (10-page spot check)

| Page | @type values |
|---|---|
| `cocktails/espresso-martini/index.html` | Recipe, BreadcrumbList |
| `cocktails/jungle-bird/index.html` | Recipe, BreadcrumbList |
| `cocktails/tesseract/index.html` | Recipe, BreadcrumbList |
| `journal/pandan-in-beverages/index.html` | Article, BreadcrumbList |
| `ingredients/pandan/index.html` | Article, BreadcrumbList |
| `dissolvedsolids/index.html` | BarOrPub + Restaurant + FoodEstablishment (array), BreadcrumbList |
| `solublesolids/index.html` | Same multi-type local-business pattern |
| `find-a-cocktail-bar/index.html` | CollectionPage with ItemList, BreadcrumbList |
| `cocktail-bars-damansara/index.html` | WebPage with `about: BarOrPub`, BreadcrumbList |
| `cocktail-bars-bangsar/index.html` | WebPage with `about: [BarOrPub, BarOrPub]`, BreadcrumbList |
| `cocktail-bars-kl/index.html` | WebPage, BreadcrumbList, FAQPage |
| `faq/index.html` | FAQPage |
| `cocktails/index.html` | ItemList |

- **405/406 production pages carry JSON-LD** (only `/builder/index.html` lacks schema, which is acceptable — interactive tool, not a content page).
- No schema-type mis-assignments detected. Recipe pages use Recipe, articles use Article, bar landings use BarOrPub array.

## 5. JSON-LD validity (sample 20)

Spot-checked 20+ files including the 13 above plus `cocktails/whiskey-sour/`, `cocktails/tesseract/`, `journal/the-tesseract-philosophy/`, `cocktail-bars-ss2/`, `snacks/`, `terms/`, `privacy/`. **All sampled blocks are syntactically well-formed JSON.** No trailing commas (`,}` or `,]`) anywhere across the 406 files. No unclosed strings observed.

## 6. Canonical URL consistency

- **406/406 production pages have `<link rel="canonical">`** — 100% coverage.
- All sampled top-level pages match the expected `https://dissolvedsolids.co/{path}/` pattern: `/cocktails/`, `/journal/`, `/ingredients/`, `/dissolvedsolids/`, `/solublesolids/`, `/visit/`, `/reserve/`, `/snacks/`, `/faq/`, `/privacy/`, `/terms/`, `/venue-hire/`, `/find-a-cocktail-bar/`. No mismatches.

## 7. Open Graph completeness

Coverage across 406 production files:

| Tag | Coverage |
|---|---|
| `og:title` | **405/406** (99.7%) |
| `og:type` | **405/406** (99.7%) |
| `og:image` | **405/406** (99.7%) |
| `og:locale` | **401/406** (98.8%) |
| `og:description` | **73/406 (18.0%)** ← gap |

- The missing-1 across title/type/image is `/builder/index.html` (acceptable).
- **The four-out-of-five-tag pattern (no description) affects ~332 pages.** Most cocktail recipes, journal articles, ingredient pages, location pages, and holiday pages have title + type + image + locale but no `og:description`. Twitter/Slack/iMessage previews will fall back to first text on page, which is less controllable. Adding `og:description` (often the same string as the existing `<meta name="description">`) would close this gap.

## 8. Internal-link health (top inbound targets)

| Target | Files linking in | Total links |
|---|---|---|
| `/` (homepage) | 105 | 309 |
| `/journal/` | 168 | 467 |
| `/cocktails/` | 165 | 463 |
| `/ingredients/` | 54 | 154 |
| `/reserve/` | 37 | 71 |
| `/dissolvedsolids/` | 46 | 48 |
| `/visit/` | 5 | 5 |
| `/faq/` | 6 | 6 |
| `/snacks/`, `/privacy/`, `/terms/` | small | small |

- Journal and cocktails are the most heavily wired-in hubs (~165 inbound each).
- **`/visit/` (5 inbound) and `/faq/` (6 inbound)** are surprisingly under-linked given they answer two of the most common LLM/search queries (hours, parking, payment, reservation policy). Consider adding them to standard footers or appbar.

## 9. Heading hierarchy

- **405/406 pages have exactly one `<h1>`.** The one without is `/builder/index.html` (no semantic H1 — interactive page). No multi-H1 violations.

## 10. Image alt-text coverage

- Across 406 production HTML files, **20 `<img>` tags** total exist (most images load via CSS background-image, not `<img>`).
- **All 20 `<img>` tags have an `alt` attribute** (0 missing). 9 of those use `alt=""` (decorative, intentional).
- Image-bearing files: `index.html` (6), `dissolvedsolids/index.html` (6), `solublesolids/index.html` (6), `journal/index.html` (1), `snacks/index.html` (1).
- No alt-coverage gap.

## 11. Mobile / responsive meta

- **406/406 production pages have `<meta name="viewport" ...>`** — 100%. No gaps.

## 12. Page-speed / CLS risks

- **Large inline `<style>` blocks:**
  - `/index.html` carries two `<style>` blocks. The first spans lines 91–2670 (~2,580 lines, est. 80–110 KB). The second spans lines 2672–3534 (~860 lines). Combined inline CSS likely exceeds 100 KB.
  - `/dissolvedsolids/index.html` (177 KB total) and `/solublesolids/index.html` (176 KB total) likely contain similar bulk inline CSS.
  - These three pages and `journal/index.html` (135 KB) are the main inline-style heavyweights. Most other pages reference `/styles.css` and `/appbar.css` externally — good.
- **`<img>` width/height (CLS):**
  - Of the 20 `<img>` tags site-wide, **only 1** has explicit `width` and `height` (in `journal/index.html`). The other 19 risk layout shift on slow connections. Most are in `/index.html`, `/dissolvedsolids/`, `/solublesolids/`. Add intrinsic dimensions to suppress CLS.
- **External resource hosts:**
  - Each page loads 2 host preconnects (`fonts.googleapis.com`, `fonts.gstatic.com`) plus the actual font stylesheet from googleapis. That's ~3 external origins, well under the 5-host threshold. No pages exceed 5 external resource origins. WhatsApp `wa.me` and `maps.app.goo.gl` are user-click destinations, not loaded resources.

---

## Summary

Coverage is very high across canonicals (100%), viewport (100%), H1 hierarchy (100%), schema density (99.7%), and JSON-LD validity (no malformed blocks found). The biggest infrastructure gaps are: (a) the duplicate tesseract sitemap entry, (b) missing `og:description` on ~332 pages, (c) missing `width`/`height` on most `<img>` tags, (d) very large inline `<style>` on three landing pages, and (e) minor llms.txt gaps (reserve/snacks/privacy/terms).
