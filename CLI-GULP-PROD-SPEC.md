# Nimbus CLI/Gulp Integration (Production-Ready MVP)

This doc specifies a simple, robust integration between a local website folder (Gulp/CLI) and the Nimbus CloudFunctions Worker.

## Goals
- One-call page sync: CLI always calls a single endpoint; the Worker decides create vs update.
- Idempotent and fault-tolerant: repeatable without local existence checks.
- Minimal local state: `.nimbus/project.json` and `.nimbus/pages.json` (rebuildable at any time).
- Clean auth: API key (no browser/session).

## Worker Endpoints
- `project.create` (exists)
  - Input: `{ name, domain?, metadata? }`
  - Output: `{ success, project: { project_id, name, domain, ... } }`
- `page.upsert` (new)
  - Input: `{ project_id, url, title?, content?, extracted_data?, metadata? }`
  - Behavior:
    - Resolve page identity server‑side (deterministic `page_id` from domain+path; fallback find‑by‑URL within project).
    - If exists → update allowed fields; else → create (`status='extracted'`).
    - Write analytics (uploaded on create; updated on update).
  - Output: `{ success, operation: 'created'|'updated', page: {...}, synced_at }`
- `page.changes.since` (optional)
  - Input: `{ project_id, since: ISO|timestamp }`
  - Output: `{ success, pages: [{ page_id, url, status, updated_at, change_type }], next_since }`

## Auth Model (CLI)
- Use API key via `Authorization: Bearer <API_KEY>` on every call.
- No sessions or cookies.

## Local Files (website folder root)
- `.nimbus/project.json`
  - Written by `sync-project`: `{ project_id, name, domain, linked_at }`
- `.nimbus/pages.json`
  - Updated after each upsert: `{ project_id, pages: [{ url, page_id, status, updated_at, last_synced_at }] }`
- `.env` (optional) or system env
  - `NIMBUS_API_KEY=...` (preferred: environment variable)

## CLI Commands (MVP)
- `nimbus set-api-key <API_KEY>`
  - Persist API key (env or `.nimbus/.env`).
  - Validate by calling a lightweight authed endpoint (e.g., `project.list`).
- `nimbus sync-project [--name <name>] [--domain <domain>] [--link <project_id>]`
  - If `.nimbus/project.json` exists → validate `project_id`; keep if valid, otherwise continue below.
  - If `--link <project_id>` → verify and write `.nimbus/project.json`.
  - Else → create via `project.create` (using `--name`/`--domain`) and write `.nimbus/project.json`.
  - Prints next steps if API key missing/invalid.
- `nimbus upsert-pages [--dir <maps_dir>] [--concurrency 5] [--batch-size 50]`
  - Read `project_id` from `.nimbus/project.json` (fail-fast with guidance if missing).
  - Scan extracted JSON files (default: `gulp/.nimbus/maps/*.json`).
  - For each file → call `page.upsert` with `{ project_id, url, title?, content?, extracted_data?, metadata? }`.
  - Update `.nimbus/pages.json` on success.
  - Concurrency + exponential backoff for 429/5xx.
- `nimbus pull-changes [--since <iso|auto>]`
  - Call `page.changes.since` to fetch remote changes; update `.nimbus/pages.json`.
- `nimbus status`
  - Summarize local/remote counts, last sync time, drift indicators.

## Directory Conventions
- Website root: any folder.
- Extracted outputs (example): `gulp/.nimbus/maps/*.json`

```
{
  "url": "/brands/hublot-watch-repair",
  "title": "Hublot Watch Repairs | Repairs By Post",
  "content": "<html>...</html>",
  "extracted_data": { "above_fold": [...], "blocks": [...], "metadata": {...} },
  "metadata": { "source": "gulp_extraction", "extracted_at": "2025-09-14T10:00:00Z" }
}
```

## Behavior & Recovery Rules
- Missing API key → stop: "Set API key: nimbus set-api-key <KEY>".
- Missing `.nimbus/project.json` → stop: "Run: nimbus sync-project --name 'Site' --domain 'www.example.com'".
- Deleted `.nimbus/project.json` → re‑run `sync-project` (link or create).
- Deleted `.nimbus/pages.json` → automatically rebuilt by next `upsert-pages`.
- Idempotency: `page.upsert` guarantees re‑runs are safe.
- Scale (4k+ pages): tune `--concurrency` and `--batch-size`; backoff on 429.
- Errors:
  - 4xx → print field errors; skip file; continue.
  - 5xx/network → retry with backoff; on repeated failure, log to `.nimbus/failures.log` and continue.

## One Endpoint for Pages
- CLI never checks existence. Always call `page.upsert`; the Worker decides create vs update and writes analytics.

## Project Identification
- `sync-project` is the entry point and initializer.
- It writes `.nimbus/project.json` as the authoritative `project_id` source.
- If the remote project is later deleted, `sync-project` will prompt to relink or recreate.

## Example Flows
- First-time setup

```
nimbus set-api-key <PASTE_FROM_DASHBOARD>
nimbus sync-project --name "Watch Repair Site" --domain "www.repairsbypost.com"
nimbus upsert-pages --dir gulp/.nimbus/maps --concurrency 5 --batch-size 50
```

- Re-run after edits

```
nimbus upsert-pages
# optionally pull remote status changes
nimbus pull-changes
```

## API Contracts (detail)
- `project.create`
  - Body: `{ action: "project.create", payload: { name: string, domain?: string, metadata?: object } }`
  - Headers: `Authorization: Bearer <API_KEY>`
  - Response: `{ success: boolean, data?: { project: {...} }, error?: string }`
- `page.upsert`
  - Body: `{ action: "page.upsert", payload: { project_id: string, url: string, title?: string, content?: string, extracted_data?: object, metadata?: object } }`
  - Response: `{ success: boolean, data?: { operation: 'created'|'updated', page: {...}, synced_at: string }, error?: string }`
- `page.changes.since`
  - Body: `{ action: "page.changes.since", payload: { project_id: string, since: string } }`
  - Response: `{ success: boolean, data?: { pages: [...], next_since: string }, error?: string }`

## Security
- Use API keys; never commit them. Prefer environment variables; for dev only, `.nimbus/.env` (git‑ignored).
- Rotate/replace keys periodically.

## Open Questions (later)
- Batch upsert endpoint (`page.upsert.batch`) for throughput.
- Project discovery by domain to enable link-only sync without manual `--link`.
- Content diffing/patching to shrink payloads.

---

## Decision: `sync-project` doubles as init
- No separate `init` command. `sync-project` both creates and links an existing project (with `--link`).
