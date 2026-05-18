# SEO Action Checklist — Weekend Execution

**Goal:** rank top-3 on Google for "cocktail bar in PJ" and the related Klang Valley queries.

**Reality check:** the website-side work is done (titles, meta, schema, content, sitemap). The remaining 80% of ranking power is **off-site** — things only you can do because they require ownership verification, photos, real reviews, and human relationships. Working through this list end-to-end is a 4–6 hour Saturday. The payoff lands over 3–6 weeks as Google re-crawls, processes citations, and starts trusting the signals.

Do them in this order. Earlier items move the needle more.

---

## 1. Google Business Profile — both bars (90 min)

**This is the single most important step. If you do nothing else on this list, do this.**

1. Go to `https://business.google.com/`.
2. Sign in with the Gmail you want to own the listings (use one you'll keep forever, ideally a `dissolvedsolids@gmail.com` style account, not a personal Gmail).
3. Click **"Add business"** → **"Add single business"**.
4. Fill in for **Dissolved Solids**:
   - **Name:** Dissolved Solids
   - **Category:** Cocktail Bar (primary). Add: Bar, Wine Bar, Restaurant.
   - **Address:** 43-1 Jalan SS20/11, Damansara Kim, 47400 Petaling Jaya, Selangor
   - **Phone:** +60 11-4008 7607
   - **Website:** `https://dissolvedsolids.co/dissolvedsolids/`
   - **Hours:** Tue–Thu 15:00–00:00, Fri–Sat 14:00–01:00, Sun 14:00–00:00, Mon closed
5. Verify ownership. Google will mail a postcard with a code to the bar address. Usually 5–14 days in Malaysia. You can also try phone or video verification — try those first (faster).
6. Repeat the whole flow for **Soluble Solids**:
   - **Name:** Soluble Solids
   - **Category:** Cocktail Bar (primary). Add: Bar, Lounge.
   - **Address:** 50-1 Jalan SS2/24, 47300 Petaling Jaya, Selangor
   - **Phone:** +60 11-1682 8651
   - **Website:** `https://dissolvedsolids.co/solublesolids/`
   - **Hours:** Wed–Sun 18:00–01:00, Mon–Tue closed
7. Once verified, for each listing:
   - Upload **at least 10 photos** — exterior, interior, bar shot, signature drinks, neon sign. Use the high-res JPGs you already have in `/photos/`.
   - Write the **business description** (750 chars max). Use the meta description from the bar page as a starting point.
   - Add menu link: `https://dissolvedsolids.co/cocktails/`
   - Add reservation link: `https://wa.me/601140087607` (DS) or `https://wa.me/601116828651` (SS)
   - Add order link for DS: `https://dissolvedsolids.beepit.com/`
   - Add attributes: "Outdoor seating" if applicable, "Wheelchair accessible" if applicable, "Cocktails", "Coffee", "Wi-Fi available", etc. Be honest — Google penalises wrong attributes.

**Why this matters most:** Google Business is what powers the map pack — the three results that show above all the regular search results when someone searches "cocktail bar near me" or "cocktail bar in PJ". Without GBP, you cannot appear in the map pack at all, regardless of how good your website is.

---

## 2. Google Search Console — both domains (15 min)

1. Go to `https://search.google.com/search-console/`.
2. Sign in with the same Gmail you used for Google Business.
3. **Add property** → choose **URL prefix** (not Domain) → enter `https://dissolvedsolids.co/`.
4. Verify ownership. Easiest method: **HTML tag** — Google gives you a `<meta>` tag, you tell me, I paste it into the `<head>` of `index.html`, you click verify. (~5 min round trip; ping me on Slack/WhatsApp when you get the tag.)
5. Once verified, go to **Sitemaps** → enter `sitemap.xml` → submit. (Sitemap is already published at `https://dissolvedsolids.co/sitemap.xml`.)
6. Bookmark Search Console. Check once a week. Two things to watch:
   - **Coverage** — should show ~80 indexed pages within 2 weeks of submitting the sitemap. If a page is "Discovered, not indexed" for more than 4 weeks, it usually means the content is too thin or duplicates another page.
   - **Performance** — shows what people actually search to find you. Goldmine. Take screenshots monthly.

**Why this matters:** Search Console is where Google reports to you. Without it, you have no idea what Google sees on your site, what queries trigger your pages, what's broken, or what's not indexed.

---

## 3. Bing Webmaster Tools (5 min)

1. Go to `https://www.bing.com/webmasters/`.
2. Sign in with the same Microsoft account.
3. Import the property from Google Search Console (Bing has a one-click importer). Done.

**Why bother:** Bing has ~3% of Malaysian search market. Tiny, but free. Bing also powers DuckDuckGo and ChatGPT search results in some flows.

---

## 4. Reviews flywheel — Google Maps (ongoing)

**Target:** 30 Google reviews on each bar in the next 90 days. 50+ in 6 months.

1. After GBP is verified, Google gives you a **short review link** for each bar — something like `g.page/dissolved-solids/review`. Find it in the GBP dashboard under "Get more reviews".
2. Print 30 small cards (RM 25 at any local print shop) that say:
   > **Loved it? A short Google review helps a lot.**
   > **[QR code → review link]**
3. Have the staff hand a card with every bill (or every second bill — don't force it). Friendly ask only.
4. Reply to **every review**, good and bad, within 48 hours. Two sentences is fine. Google explicitly weights "owner responds" as a quality signal.

**Why this matters:** reviews are the highest-weight ranking factor for local pack after proximity and category. A bar with 5 reviews loses to a bar with 200, even if the website SEO is worse. Reviews compound — once you cross 50, momentum carries itself.

**What not to do:**
- Do **not** buy reviews. Google detects fake review patterns and will suspend your listing.
- Do **not** offer discounts in exchange for reviews. Against Google's TOS, can get the listing pulled.
- Do **not** review yourselves or have staff review with their personal accounts. Same problem.

---

## 5. Citations — make your name + address + phone (NAP) consistent (60 min)

Pick the **exact** business name, address, and phone format from your GBP listing. Use that exact format on every directory below. Any inconsistency (e.g. "47400 PJ" on one and "47400 Petaling Jaya" on another) weakens the signal.

For **Dissolved Solids:**
- Name: `Dissolved Solids`
- Address: `43-1 Jalan SS20/11, Damansara Kim, 47400 Petaling Jaya, Selangor`
- Phone: `+60 11-4008 7607`

For **Soluble Solids:**
- Name: `Soluble Solids`
- Address: `50-1 Jalan SS2/24, 47300 Petaling Jaya, Selangor`
- Phone: `+60 11-1682 8651`

Sites to claim/create listings on (30 min each, mostly free):

1. **Apple Maps Connect** — `https://mapsconnect.apple.com/` (powers iOS Maps + Siri + ChatGPT location queries)
2. **Foursquare for Business** — `https://business.foursquare.com/` (powers Uber, Snap, TripAdvisor location data)
3. **TripAdvisor** — `https://www.tripadvisor.com/Owners` (massive for international visitors searching from abroad)
4. **Facebook Page** — full address, hours, category set to "Cocktail Bar"
5. **Instagram bio link** — link to `dissolvedsolids.co` (not Linktree — direct link signals authority)
6. **Tatler Asia** — you already have the Top 20 placement. Email them and request your bar profile pages link back to `dissolvedsolids.co/dissolvedsolids/` and `/solublesolids/` respectively. If they currently only link to your Instagram, ask for the website link.

---

## 6. Press outreach for backlinks (90 min — slow burn over weeks)

Pitch a short story to each outlet. Two-paragraph email, no fluff. Mention: Tatler Top 20, the customised-drink model, the journal as a knowledge resource (you can offer to write one guest piece for them).

| Outlet | Email contact | Angle |
|---|---|---|
| Time Out KL | `editorial@timeout.com.my` | "Two sister bars in PJ that customise every drink to your mood + palate" |
| KLue | via contact form on klue.com.my | "PJ's quiet cocktail revolution: no menus, every drink built to taste" |
| Tatler Dining | `dining@tatlerasia.com` | Follow up on the Top 20 placement + offer journal content collab |
| FoodAdvisor.my | via contact form | New listing + photos |
| EatDrinkKL blog | `eatdrinkkl@gmail.com` | Same as Time Out angle |
| Vulcan Post | `news@vulcanpost.com` | "Tech-forward F&B: shareable drink-builder URLs and WhatsApp ordering" |
| The Star Lifestyle | via thestar.com.my contact | Local angle, founder interview |

Backlinks from any one of these moves the needle. Five within 6 months puts you ahead of every competitor on this side of KL.

**Tip:** when you email, attach 2–3 high-res JPGs. Editors are 5x more likely to publish when photos are ready to drop in.

---

## 7. Internal blog rhythm (ongoing)

The journal is now at 51 articles. Goal: publish **one new article a month** on a fresh local-or-technique topic. Each one is another page Google can rank for a different query, and they internally link back to the bar pages, which lifts the whole site.

Suggested next 6 (Claude can draft any of these in an hour):

1. *"Where to drink late in Damansara Kim: A neighbourhood guide"* — pure local SEO play
2. *"Sober cocktail bars in PJ: 2026 update"* — funnels the sober-curious crowd
3. *"How to host a cocktail party at home in KL"* — broad evergreen, brings traffic to home-bar article
4. *"The best Malaysian-local cocktails to try in 2026"* — keyword-targeted seasonal piece
5. *"PJ vs KL: where to drink in 2026"* — local comparison angle
6. *"The case for low-ABV cocktails in tropical climate"* — health-conscious, brings new audience

Just say "Claude do #2" and I'll draft it.

---

## 8. Things you should NOT do

- **Don't pay any "SEO agency" charging RM 500+/month for "guaranteed rankings".** They will spam-build links that get you penalised. The good ones cost RM 5k+/month and won't make sense at your scale yet.
- **Don't run Google Ads as a substitute for SEO.** Ads get you traffic while you're paying; SEO gets you traffic forever. Run ads if you have a specific campaign (e.g. New Year's Eve), not as a permanent crutch.
- **Don't hide content or use white-on-white keyword stuffing.** Google has been catching this for 20 years and the penalty is severe (the whole domain can be deindexed).
- **Don't change URLs without 301 redirects.** If you ever rename a journal article slug, ping me — I'll set up the redirects so existing Google rankings carry over.

---

## What you should expect over the next 6 months

| Time | What happens |
|---|---|
| Week 1 | GBP listings live (after postcard verification). Search Console showing initial crawl data. |
| Week 2–4 | First reviews land. Sitemap fully indexed. Niche queries like *"cocktail bar damansara kim"* start ranking page 1. |
| Month 2 | 20+ reviews. *"Cocktail bar in PJ"* ranking page 2 or page 3. |
| Month 3 | First inbound link from press outreach. Domain starts being seen as authoritative. |
| Month 6 | 50+ reviews. *"Cocktail bar in PJ"* top-3 if all the above is done. Brand searches ("dissolved solids cocktail") clearly top-1. |
| Month 12 | Compounding — both bars dominate local pack for PJ queries. Journal articles bring 5k+ monthly visitors. |

Compound interest is the SEO model. Six small things done every month for 12 months beats one big push.

---

## If you only do 3 things this weekend

1. **Verify both Google Business Profiles.** Even before the postcard arrives, you can fill in everything else.
2. **Submit the sitemap to Search Console.** (5 min after I help you with the verification tag.)
3. **Print review cards and brief staff.** First 10 reviews come from your existing happy customers — the next 90 days are won by getting the flywheel started.

Everything else can phase in over the next 8 weeks.

---

*Generated 2026-05-18. Update this doc when you finish a section.*
