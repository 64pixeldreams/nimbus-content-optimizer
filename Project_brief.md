# Project Brief — Nimbus v1 (MVP)

Goal: batch-optimize compiled HTML (or EJS/Nunjucks outputs) for conversion + SEO using a Gulp runner and a Cloudflare Worker.
Safety: never alter layout/JS; only replace text/links/alts and head/meta and inject one JSON-LD block.
Scale: 10 → 10,000 pages with batching, approvals, rollback.

Key quality gates:

Auto-fix: empty Trust links, typos, weak H1/H2, generic CTAs, missing alt, canonical/OG/Twitter images.

Deep links: ≥3/page (money, 1–2 services, 1 sibling city).

CLS guards: content images have width/height (derive from ImageKit URL when present), add decoding="async" (non-hero), loading="lazy" where safe.

JSON-LD validates (LocalBusiness, BreadcrumbList, optional FAQPage).

Workspace layout:

/nimbus/profile.yaml
/src/pages/**                   # (optional) templates/partials
/public/**                      # compiled HTML (or input folder)
/.nimbus/
  maps/*.json                   # content maps
  work/<batchId>/
    manifest.json
    <pageId>/
      map.json                  # source snapshot
      proposal/{head.json,blocks.json,links.json,alts.json,schema.json,report.json}
      diffs/{head.diff,body.diff}
      preview.html
      history/<timestamp>/*     # backups before apply
  logs/run-*.json


Environment & config:

NIMBUS_WORKER_URL (e.g., https://nimbus.example.workers.dev/propose)

NIMBUS_WORKER_KEY (Bearer token header Authorization: Bearer …)

profile.yaml minimal:

name: "Repairs By Post"
domain: "repairsbypost.com"
services: ["watch-repair","battery-replacement","glass-replacement"]
geo_scope: ["UK"]
goal: "Maximise quote submissions"
money_pages: ["/start-repair.html","/contact.html"]
default_share_image: "https://www.repairsbypost.com/share.jpg"
trust_links:
  trustpilot: "https://uk.trustpilot.com/review/repairsbypost.com"
  google: "https://g.page/RepairsByPost"


Optional _<folder>/_directive.yaml:

type: "local"                          # or "brand"
target: "conversion"
tone: "local, expert, reassuring"      # style
interlink: ["money:/start-repair.html","service:/watch-repairs/*","sibling:city:*"]
schema: ["LocalBusiness","BreadcrumbList","FAQPage"]
allow_inline_links: false              # true = wrap tokens inside p/li

Ticket 1 — Implement nimbus:scan:map

CLI: gulp nimbus:scan:map --folder <path> [--limit N] [--batch new|<id>] [--main "#selector"]

Behavior:

Discover files: **/*.html, plus **/*.{njk,ejs} if compiled HTML not available.

Parse HTML with jsdom/cheerio.

Main detection order: main, [role=main], article, #content, .content … else heuristic (max text-density under <body> excluding header,nav,footer,aside,script,style,link).

Build content map (ordered top→bottom) for nodes within the main root:

include h1–h3, p, li, blockquote, <a> (with anchor+href), <img> (src+alt+width+height).

capture CSS selector for each node (stable nth-of-type path).

Extract head facts (<title>, meta description, canonical, og/twitter images).

Detect "obvious issues": empty Trustpilot/Google hrefs, missing alts, missing width/height, typos (basic dictionary pass).

Write per-page /.nimbus/maps/<pageId>.json and an index.

Map schema (contract):

{
  "path": "public/branches/watch-repairs-abbots-langley.html",
  "route": "/branches/watch-repairs-abbots-langley",
  "engine": "html",
  "main_selector": "main",
  "head": {
    "title": "…",
    "metaDescription": "…",
    "canonical": "https://www.repairsbypost.com/branches/watch-repairs-abbots-langley",
    "ogImage": "",
    "twitterImage": ""
  },
  "blocks": [
    {"i":0,"type":"h1","text":"Local Watch Shop in Abbots Langley","selector":"main h1.splash-title"},
    {"i":1,"type":"h2","text":"Professional, Affordable Watch Repairs in Abbots Langley","selector":"main h2:nth-of-type(1)"},
    {"i":2,"type":"p","text":"Need watch repairs in Abbots Langley? …","selector":"main p:nth-of-type(1)"},
    {"i":3,"type":"a","anchor":"QUICK ESTIMATE (2 mins)","href":"/start-repair.html","selector":"main a.btn-success"},
    {"i":4,"type":"img","src":"…/watch_repair_near_me.png","alt":"","width":600,"height":221,"selector":"main img[width='600'][height='221']"}
  ],
  "links_present":[{"anchor":"Trustpilot","href":""},{"anchor":"Google Places","href":""}],
  "images_present":[{"src":"…png","alt":""}],
  "flags": {"usedHeuristicMain": false, "typosFound": ["braclet","acredited"]}
}


Acceptance:

Produces maps for N files without touching sources.

blocks preserves reading order and stable selectors.

flags.usedHeuristicMain set appropriately.

Ticket 2 — Implement nimbus:plan

CLI: gulp nimbus:plan --folder <path> [--batch <id>]

Behavior: merge /nimbus/profile.yaml + optional _directive.yaml (closest to folder) into directive.json.

Directive contract (to Worker):

{
  "profile": { /* profile.yaml expanded */ },
  "directive": {
    "type":"local","target":"conversion","tone":"local, expert, reassuring",
    "interlink":["money:/start-repair.html","service:/watch-repairs/*","sibling:city:*"],
    "schema":["LocalBusiness","BreadcrumbList","FAQPage"],
    "allow_inline_links": false
  }
}


Acceptance: writes /.nimbus/work/<batchId>/directive.json.

Ticket 3 — Implement nimbus:propose

CLI: gulp nimbus:propose --batch <id> [--limit N] [--concurrency 8]

Behavior:

For each map, POST {profile, directive, content_map} to NIMBUS_WORKER_URL with Authorization header.

Save Worker response under proposal/ and generate unified diffs for head/body text changes.

Update manifest with per-page status (proposed|error) and source checksum (sha256 of original file).

Worker request (example):

{
  "profile": { /* from profile.yaml */ },
  "directive": { /* from directive.json */ },
  "content_map": { /* map.json above */ }
}


Worker response (strict):

{
  "head": {
    "title": "Watch Repairs in Abbots Langley | Free UK Postage & 12-Month Guarantee",
    "metaDescription": "Local, insured postal watch repairs in Abbots Langley. Battery replacement, glass and movement service. Free UK shipping both ways. 1.5K+ reviews.",
    "canonical": "https://www.repairsbypost.com/branches/watch-repairs-abbots-langley",
    "ogImage": "https://www.repairsbypost.com/share.jpg",
    "twitterImage": "https://www.repairsbypost.com/share.jpg"
  },
  "blocks": [
    {"selector":"main h1.splash-title","text":"Watch Repairs in Abbots Langley"},
    {"selector":"main h2:nth-of-type(1)","text":"Fast, affordable repairs with free insured post"},
    {"selector":"main p:nth-of-type(1)","text":"We repair all brands — Rolex, TAG Heuer, Omega, Seiko and more. 1.5K+ verified reviews. Tracked, insured postage both ways."}
  ],
  "links": [
    {"selector":"main a.btn-success","href":"/start-repair.html","anchor":"Get your free estimate (2 mins)"},
    {"selector":"main a.text-primary:nth-of-type(1)","href":"https://uk.trustpilot.com/review/repairsbypost.com"},
    {"selector":"main a.text-primary:nth-of-type(2)","href":"https://g.page/RepairsByPost"}
  ],
  "alts": [
    {"selector":"main img[width='600'][height='221']","alt":"Watch repair service in Abbots Langley – Repairs by Post"}
  ],
  "schema": { "@context":"https://schema.org","@graph":[ /* LocalBusiness + BreadcrumbList (+ FAQPage) */ ]},
  "confidence": 0.86,
  "notes": ["Fixed typos, upgraded CTA, filled trust links, added JSON-LD."]
}


Worker prompt rules (bake into Worker):

Return replacements only for provided selectors; no new blocks; UK spelling; no fabricated prices; links[].href must match allowed patterns (money_pages, /watch-repairs/*, sibling city routes).

If Trustpilot/Google anchors present with empty href, fill from profile.

Acceptance: proposals saved; diffs generated; manifest updated.

Ticket 4 — Implement nimbus:preview

CLI: gulp nimbus:preview --batch <id>

Behavior: render a single HTML per batch showing original vs proposed for each page (highlight text diffs, list head/meta deltas, link suggestions, alts, schema snippet). Save to /.nimbus/work/<id>/preview.html.

Acceptance: preview opens locally and shows per-page changes clearly.

Ticket 5 — Implement nimbus:approve

CLI: gulp nimbus:approve --batch <id> --pages all|pageId1,pageId2

Behavior: flips approved:true for selected pages in manifest.json.

Acceptance: manifest reflects approvals; no file changes yet.

Ticket 6 — Implement nimbus:apply

CLI: gulp nimbus:apply --batch <id> --dest <folder> [--git true]

Behavior:

For each approved:true page:

Verify checksum unchanged (else mark "stale" and skip).

Backup original to history/<timestamp>/….

Patch head: <title>, <meta name="description">, <link rel="canonical">, og:image, twitter:image (create/update).

Patch body by selector: replace text for h*/p/li, update a anchor & href (policy-allowed), set img alt.

CLS: if missing width/height and ImageKit tr:w,h present → set attributes; add decoding="async" to non-hero content images; add loading="lazy" where safe.

JSON-LD: upsert exactly one <script type="application/ld+json" id="nimbus-schema"> before </head>.

Write run log; optional git commit -m "nimbus: apply <batchId> (N pages)".

Acceptance: files updated in --dest; backups exist; skipped pages listed with reason.

Ticket 7 — Implement nimbus:check

CLI: gulp nimbus:check --batch <id>

Behavior: run post-propose checks:

HTML lint (well-formed), broken internal links, duplicate titles/descriptions, JSON-LD shape (basic schema), CLS report (images missing size and no derivable tr:w/h), empty Trust links remaining, CTA presence.

Acceptance: emits /.nimbus/work/<id>/report.json + console summary with PASS/FAIL counts.

Ticket 8 — Implement nimbus:rollback

CLI: gulp nimbus:rollback --batch <id> --page <pageId> [--to <timestamp>]

Behavior: restore the backed-up version from history/.

Acceptance: file restored; manifest notes rollback.

Ticket 9 — Sample fixture & E2E run (Abbots Langley)

Deliverables:

Put your pasted HTML into /public/branches/watch-repairs-abbots-langley.html.

Run:

gulp nimbus:scan:map --folder public/branches --limit 1 --batch new
gulp nimbus:plan --folder public/branches --batch <id>
gulp nimbus:propose --batch <id> --limit 1
gulp nimbus:preview --batch <id>
gulp nimbus:approve --batch <id> --pages all
gulp nimbus:apply --batch <id> --dest public
gulp nimbus:check --batch <id>


Attach preview.html and report.json as artifacts.

Acceptance: page shows improved head/copy/links/alt/schema; report passes gates.

Notes on "money-maker" fixes mapping

Empty Trust/Google hrefs: detected at scan → Worker proposes → apply sets.

Typos: Worker rewrites text → apply replaces by selector (no structure change).

Deep links ≥3/page: Worker upgrades existing anchors; if still <3 and allow_inline_links:true, wrap tokenized terms inside p/li only.

Canonical/OG/Twitter: Worker fills; apply creates/updates tags.

CLS: set width/height from tr:w,h if present; add decoding="async"; lazy-load below-the-fold.
