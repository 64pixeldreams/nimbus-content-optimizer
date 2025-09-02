# Nimbus Page Optimization Technical Specification (v1, MVP)

## 0) Scope (what's allowed)

Allowed: replace text inside existing nodes (H1/H2/P/LI/BLOCKQUOTE), update anchor href/anchor, set img alt/width/height, update head tags, inject one JSON-LD block.

Not allowed: add/remove/reorder DOM blocks, change classes/JS, alter layout.

## 1) URL & internal linking policy

Canonical style: extensionless paths (no .html).

Example: /brand/rolex-watch-repair (not /brand/rolex-watch-repair.html).

Normalize all internal links to canonical style (only if target exists).

Trailing slash: no trailing slash in canonical or internal links (keep it consistent).

Money pages (from profile.money_pages) must be used verbatim.

Deep linking quota: ≥ 3 per page

One money link (/start-repair.html is okay to keep as-is if your router requires it).

One service link /watch-repairs/<service> (battery, glass, crown, bezel, vintage, movement, strap).

One context link (brand or sibling city) when relevant.

Upgrade first, inject second: prefer upgrading existing anchors; add inline links (wrapping tokens) only if allow_inline_links: true.

Trust links: if anchor text contains "Trustpilot" or "Google Places/Google", set href from profile.trust_links.

External links: keep target/rel unchanged; do not add UTM.

## 2) Head / metadata policy

Title: 50–60 chars; include primary intent + city/brand; no pipes spam.

Pattern (local): Watch Repairs in {{city}} | Free UK Postage & 12-Month Guarantee

Meta description: 140–165 chars; benefits + proof (reviews), avoid clickbait.

Canonical: absolute URL, extensionless, matches page route.

Open Graph / Twitter: set og:image and twitter:image to profile.default_share_image (or page hero if reliable).

Keywords: ignore; do not add.

No-index: never add/remove.

## 3) Headings & copy rules

H1: exactly one, meaningful (45–65 chars), includes city/brand; Title-Case OK, avoid SHOUTING.

H2: first H2 is a benefit statement; subsequent H2s group sections (Services, FAQs, Reviews).

Typos & clarity: fix spelling/grammar (e.g., bracelet, accredited), prefer UK spelling.

Tone: "local, expert, reassuring" (from directive).

No false claims: only use counts (e.g., "1.5K+ reviews") if present in profile or page text.

## 4) CTAs (copy & placement)

Primary CTA anchor text must be one of:

"Get your free estimate (2 mins)"

"Start your repair"

"Request a free quote"

"Learn how it works" (secondary)

Primary CTA href → a money page (/start-repair.html or configured alternative).

Keep existing button classes; change text only.

## 5) Images & media (ImageKit + CLS hygiene)

Alt text: every content image in <main> must have descriptive alt (brand/city when relevant).

Width/height:

If width/height attrs are missing and ImageKit URL has tr:w-*,h-*, set attributes from URL.

Else do not guess; log a warning.

Loading/decoding:

Non-hero content images: ensure loading="lazy" and decoding="async".

Keep hero images as they are (don't force lazy).

ImageKit transformation policy (when you update src or can append tr= safely):

Append/ensure: tr:w-{displayWidth},h-{displayHeight},q-75,f-auto

If high-DPI context known, allow dpr-2 (don't add blindly).

Never change class names, inline styles, or the lazy-loader setup already present.

## 6) Schema / JSON-LD (injection)

Inject exactly one JSON-LD <script type="application/ld+json" id="nimbus-schema"> in <head> (or in the designated SEO slot if you have one).

Graph contents (as applicable by page type):

LocalBusiness

name (profile.name),

url = canonical,

telephone if present,

address with addressLocality/addressRegion/addressCountry when page is local (derive from page text/route tokens),

areaServed (city for local pages),

sameAs = Trust links if present.

BreadcrumbList

Home → Watch repairs near me (or section) → {{city}} OR {{brand}}.

FAQPage

Only if real Q&A links/sections exist; otherwise omit.

Do not add Product/Offer with prices unless you have explicit data.

## 7) Accessibility & semantics

No empty anchors; descriptive anchor text ("Battery replacement pricing" > "click here").

Keep headings in order (H1→H2→H3).

Ensure every CTA has discernible text (not only an icon).

Provide meaningful aria-label only if already present; do not add ARIA blindly.

## 8) Performance hygiene

Ensure canonical and OG/Twitter tags exist (one each).

Avoid duplicate titles/descriptions across pages (runner will flag).

No inline base64 >10KB (flag only).

Don't modify JS/CSS includes.

## 9) Deep-linking details (what to link to)

Services (examples):

Battery → /watch-repairs/watch-battery-replacement

Glass → /watch-repairs/watch-glass-replacement

Crown → /watch-repairs/watch-crown-replacement

Bezel → /watch-repairs/watch-bezel-replacement

Vintage → /vintage-watch-repairs

Brands: /brand/<brand>-watch-repair when the brand is mentioned.

Sibling cities: /branches/<city-slug> when on local pages and a sibling list exists (don't invent).

## 10) Acceptance checks (per page)

A page passes when all are true:

Title/description meet length and include the correct entity (city/brand).

Canonical present, absolute, extensionless, equals route.

OG/Twitter images set (non-empty).

H1 unique and intent-clear; first H2 is a benefit statement.

CTA present, approved text, links to a money page.

Deep links ≥3 (money + service + context).

Images: all main-content images have alt; CLS guard applied (attrs set or flagged).

Trust links filled correctly.

JSON-LD present, valid, includes LocalBusiness + BreadcrumbList (and FAQPage only if real).

No .html in internal links (unless the target is a money page you've whitelisted to keep .html).

## 11) "Where to put it" notes for Cursor

JSON-LD: <head> before closing </head>, id=nimbus-schema (replace if exists).

Head tags: update or create <title>, <meta name="description">, <link rel="canonical">, <meta property="og:image">, <meta name="twitter:image">.

Body changes: only inside <main> (or detected main container), by selector from the content map.

## 12) Examples (apply to your Abbots Langley page)

Title: Watch Repairs in Abbots Langley | Free UK Postage & 12-Month Guarantee

Description: Local, insured postal watch repairs in Abbots Langley. Battery replacement, glass and movement servicing. Free tracked shipping both ways. 1.5K+ verified reviews.

Primary CTA text: Get your free estimate (2 mins) → /start-repair.html

Service deep link: wrap "Battery replacement" → /watch-repairs/watch-battery-replacement

Brand deep link: wrap "Rolex" → /brand/rolex-watch-repair

Trust links: fill href with your Trustpilot/Google links from profile.trust_links.

Hero/Content image: add alt="Watch repair service in Abbots Langley – Repairs by Post"; set decoding="async" on non-hero; ensure ImageKit tr:w-*,h-* plus f-auto,q-75.
