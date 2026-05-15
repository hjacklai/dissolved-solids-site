# Dissolved Solids × Soluble Solids

Static site for two sister cocktail bars in Petaling Jaya, Malaysia. Each bar has its own URL so each can be linked from its own Instagram bio.

- **Dissolved Solids** · 43-1 Jalan SS20/11, Damansara Kim, 47400 PJ · "Serving you all sorts in liquid form." Tatler Asia Top 20 Bars 2025/26. → `dissolvedsolids.co/dissolvedsolids`
- **Soluble Solids** · 50-1 Jalan SS2/24, 47300 PJ · cocktail parlour, no fixed list, customised every pour. → `dissolvedsolids.co/solublesolids`
- **Root `/`** → redirects to `/dissolvedsolids/` (Dissolved is the senior, Tatler-recognised bar)

The lab-instrument toggle at the top of each page is a navigation tab. Clicking the inactive label takes you to the sister bar's page. Each page hardcodes its own `data-state` so the theme, copy, photos, and menu are right for that bar.

## Stack

Plain HTML + CSS. No build step. No dependencies. No JS. Two Google Fonts (Fraunces variable + JetBrains Mono).

## Files

| Path                              | What it is                                                       |
| --------------------------------- | ---------------------------------------------------------------- |
| `index.html`                      | Root redirect to `/dissolvedsolids/`.                            |
| `dissolvedsolids/index.html`      | Dedicated Dissolved Solids page. `<html data-state="dissolved">`. Hardcoded paper/ink theme. JSON-LD `BarOrPub` schema with full menu and Tatler award. |
| `solublesolids/index.html`        | Dedicated Soluble Solids page. `<html data-state="soluble">`. Hardcoded dark theme. JSON-LD schema with customisation menu structure. |
| `styles.css`                      | All styling, shared between both pages. Theme vars keyed on `[data-state]`. |
| `robots.txt`                      | Allows all bots including AI crawlers (ClaudeBot, GPTBot, PerplexityBot, Google-Extended, Applebot-Extended, etc.). |
| `sitemap.xml`                     | Three URLs (`/`, `/dissolvedsolids/`, `/solublesolids/`) with image sitemap entries. |
| `photos/banner.jpg`               | Dissolved Solids wordmark banner (OG share image).               |
| `photos/ds-logo.png`              | Dissolved Solids cube/droplet logo (favicon for Dissolved page). |
| `photos/ss-logo.jpg`              | Soluble Solids cube wireframe (favicon for Soluble page).        |
| `photos/*-hero.jpg`, `*-preview.jpg`, etc. | Drink photography. 14 cocktail shots in total. |

## Local preview

Open `index.html` directly in a browser, or:

```sh
python -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to GitHub Pages

The repo is already shaped for GitHub Pages: `CNAME` (custom domain), `.nojekyll` (skip Jekyll processing), and `.gitignore` (excludes `.claude/` per-developer config). Steps below assume the repo has been initialised locally; if starting fresh see "First-time push" further down.

**1. Push to GitHub.**
```sh
git push -u origin main
```

**2. Enable Pages.** Repo · Settings · Pages · Build and deployment · Source: **Deploy from a branch** · Branch: `main` / `/ (root)` · Save.

**3. Custom domain.** Same Pages screen, Custom domain: `dissolvedsolids.co` · Save. Tick **Enforce HTTPS** once the cert provisions (a few minutes after DNS resolves).

**4. DNS records at the domain registrar** (this is where the apex `dissolvedsolids.co` actually starts resolving to GitHub):

| Type  | Host        | Value                  |
| ----- | ----------- | ---------------------- |
| A     | `@`         | `185.199.108.153`      |
| A     | `@`         | `185.199.109.153`      |
| A     | `@`         | `185.199.110.153`      |
| A     | `@`         | `185.199.111.153`      |
| CNAME | `www`       | `<username>.github.io.` |

(The four A records are GitHub Pages' apex IPs. The `www` CNAME lets `www.dissolvedsolids.co` redirect to apex.)

Verify: `dig dissolvedsolids.co +short` should return the four IPs after the registrar propagates (usually 5-60 min).

**First-time push** (skip if the repo already has a remote):
```sh
git remote add origin git@github.com:<you>/<repo>.git
git branch -M main
git push -u origin main
```

> **Working-directory note:** This source tree lives in a Google Drive folder. Git itself works, but if Drive ever races with git during a write, you may see `index.lock` files or weird detached HEADs. If that happens, the safe move is to clone the GitHub repo into a non-synced local path (e.g., `C:\dev\ds-site`) and continue work from there.

## SEO and LLM-discoverability foundation

This site is built to rank for beverage queries across Klang Valley (KL, PJ, Selangor) and to be ingested by AI search assistants. Foundation already in place:

- **JSON-LD `BarOrPub` schema** on both pages. Google's rich results pulls hours, address, phone, menu items, prices, and the Tatler accolade into search cards.
- **`ReserveAction` schema** tells search engines and AI assistants that the WhatsApp link is a reservation action (so AI chatbots can recommend it as a "book now" path).
- **Per-bar `Menu` + `MenuItem` + `Offer` structured data** with real prices in MYR. Feeds Google's "menu preview" rich results.
- **`robots.txt` explicitly welcomes AI crawlers:** ClaudeBot, GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, Google-Extended, Applebot-Extended, Amazonbot, CCBot, Meta-ExternalAgent, Bytespider. Most sites accidentally block these.
- **`sitemap.xml`** with image sitemap entries so Google Image search picks up the cocktail photos.
- **Canonical URLs + hreflang** to prevent duplicate-content penalties between pages.
- **Geo meta tags** (`geo.region MY-10`, `geo.position`, `ICBM`) for local "bar near me" queries.
- **Open Graph + Twitter cards** so IG / WhatsApp / Slack link previews render correctly.
- **Semantic HTML:** `<address>`, `<section aria-label>`, descriptive `alt` on all images.

### After deploying, do these once (15 minutes total)

1. Verify ownership in **Google Search Console** (DNS TXT record or upload an HTML verification file).
2. Submit `https://dissolvedsolids.co/sitemap.xml` in Search Console.
3. Create a **Google Business Profile** for each bar, separate from the website but enormous for local search ("cocktail bar Damansara Kim", "cocktail bar SS2"). Link the GBP listings to the website.
4. Submit the site to **Bing Webmaster Tools** the same way.
5. (Optional but easy) Add the live URL to each bar's **Instagram bio** + the **WhatsApp business profile**.

### To grow the SEO / LLM moat (next content moves)

- **Beverage Journal.** Start publishing articles at `/journal/[slug]/` covering coffee origin, fermentation, vermouth, spirit infusions, cocktail technique, ingredient guides specific to Malaysia (pandan, mangosteen, gula melaka). Each article gets its own `<article>` schema. This is the long-term play to become the #1 Klang Valley beverage resource.
- **Drink-specific pages:** `/cocktails/scented-negroni/`, `/cocktails/too-gouda-to-be-true/`. Each with photo + recipe-ish description + the bar that serves it. Pulls in long-tail traffic.
- **FAQ section per page** with `FAQPage` schema. Common questions ("do you take walk-ins?", "what's a customised cocktail?") that LLMs love to cite.

## Primary CTA: WhatsApp

The page leads with **"WhatsApp us to design a drink"** as the main action, in four places:

1. Hero · primary WhatsApp button, state-specific prefilled message.
2. Custom Drinks section · bigger pitch + WhatsApp button.
3. Preview-other · WhatsApp button for the other bar (so visitors can message either side without flipping state).
4. Footer · WhatsApp link in the contact column.

Each bar has its own WhatsApp number, wired in based on the page's state:

- **Soluble Solids:** `wa.me/601116828651` (= `+60 11-1682 8651`)
- **Dissolved Solids:** `wa.me/601140087607` (= `+60 11-4008 7607`)

## What needs confirming before launch

1. **Hours.** Dissolved hours are sourced from `dissolvedsolids.storehub.me/contact-us` (Mon, Thu 15:00 to 00:00; Fri, Sat, Sun 12:00 to 00:00; Tue, Wed closed). Soluble Solids' Instagram bio lists Wednesday to Sunday 6PM to 1AM (last call midnight) - confirm before launch.
3. **Hero photography.** Currently striped CSS placeholders. Replace the four `<div class="ph">…</div>` blocks with `<img src="photos/...">` when bar shots are ready. `ds bev fotos.zip` in My Drive looks like the source.
4. **Email.** Footer uses `concierge@malaine.life` (from the StoreHub contact page). Confirm this is still the right inbox.

## Menu data

Dissolved menu is populated from `DS menu compressed.pdf` in `G:\My Drive`. Each column shows 4 drinks picked as a representative sample. To swap drinks in/out, edit the `<div class="menu-row">` entries in the `<div class="menu-grid" data-show="dissolved">` block in `index.html`.

Soluble menu is intentionally a single editorial block ("The list, in person.") instead of a list. It points readers to the Custom Drinks section below, which uses the literal customisation structure from the Dissolved menu's Customised Cocktail page: strength (Light 32 / Medium 36 / Strong 38 onwards) × base spirit × flavour profile. Edit the `<div class="custom-steps">` block to adjust.

## Design source

Built from the Option 3 prototype in the Claude Design handoff (`option-toggle.jsx`). Visual decisions (type, palette, spacing) match that prototype.
