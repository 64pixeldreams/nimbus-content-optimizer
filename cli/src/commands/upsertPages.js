import fs from "node:fs";
import path from "node:path";
import pLimit from "p-limit";
import {
  getPaths,
  ensureNimbusDir,
  readProject,
  readPages,
  writePages,
  appendFailure,
} from "../core/config.js";
import { cfCall } from "../core/cfCall.js";

function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".json"))
    .map((e) => path.join(dir, e.name));
}

export async function upsertPagesCommand({ dir, concurrency = 5, apiUrl }) {
  const paths = getPaths();
  ensureNimbusDir(paths);

  const project = readProject(paths);
  if (!project?.project_id) {
    throw new Error("Missing .nimbus/project.json. Run: nimbus sync-project --name <name> --domain <domain>");
  }

  const files = listJsonFiles(dir);
  if (files.length === 0) {
    console.log("No JSON files found in:", dir);
    return;
  }

  const state = readPages(paths);
  if (!state.project_id) state.project_id = project.project_id;
  if (!Array.isArray(state.pages)) state.pages = [];

  const byUrl = new Map(state.pages.map((p) => [p.url, p]));
  const limit = pLimit(concurrency);
  let ok = 0, fail = 0;

  async function withRetry(fn, { retries = 4, baseMs = 500 } = {}) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        const msg = String(err?.message || err);
        const transient = /Too Many Requests|ECONNRESET|ETIMEDOUT|5\d\d|fetch failed|network/i.test(msg);
        if (i === retries - 1 || !transient) throw err;
        const delay = baseMs * Math.pow(2, i);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  await Promise.all(
    files.map((file) =>
      limit(async () => {
        try {
          const raw = JSON.parse(fs.readFileSync(file, "utf8"));
          let derivedUrl = raw.url || raw.route || raw.path || null;
          if (!derivedUrl && raw.head?.canonical) {
            try {
              const u = new URL(raw.head.canonical);
              if (u && u.pathname) derivedUrl = u.pathname;
            } catch {}
          }
          if (!derivedUrl) {
            const base = path.basename(file).toLowerCase();
            if (base === "index.json") {
              derivedUrl = "/";
            }
          }
          if (!derivedUrl) throw new Error("Missing url/route in map file");
          const title = raw.title || raw.head?.title || null;
          const extractedData = {
            head: raw.head || null,
            engine: raw.engine || null,
            main_selector: raw.main_selector || null,
            route: raw.route || derivedUrl,
            blocks: raw.blocks || [],
            above_fold: raw.above_fold_blocks || [],
            rest_of_page: raw.rest_of_page_blocks || [],
            selector_map: raw.selector_map || {},
            dimensions: raw.dimensions || null,
            // Mirror keys expected by UI
            above_fold_blocks: (raw.above_fold_blocks || []),
            content_dimensions: (raw.dimensions || {}),
            extraction_config: raw.extraction_config || null,
          };
          const payload = {
            project_id: project.project_id,
            url: derivedUrl,
            title,
            content: raw.content,
            extracted_data: extractedData, // Always use our properly constructed extractedData
            metadata: { ...raw.metadata, source: raw.metadata?.source || "gulp_map", map_path: file },
          };
          
          // Debug: Check if above_fold_blocks are in the payload
          if (extractedData.above_fold_blocks && extractedData.above_fold_blocks.length > 0) {
            console.log(`[DEBUG] ${derivedUrl}: Sending ${extractedData.above_fold_blocks.length} above_fold_blocks`);
          } else {
            console.log(`[DEBUG] ${derivedUrl}: NO above_fold_blocks found!`);
          }
          const res = await withRetry(() => cfCall(paths, "page.upsert", payload, { apiUrl }));
          const page = res.data?.page;
          if (page?.page_id) {
            const entry = {
              url: page.url || derivedUrl,
              page_id: page.page_id,
              status: page.status,
              updated_at: page.updated_at,
              last_synced_at: new Date().toISOString(),
            };
            byUrl.set(entry.url, entry);
            ok++;
            console.log(`[OK] ${entry.url} -> ${entry.page_id} (${res.data?.operation || ""})`);
          } else {
            throw new Error("Missing page in response");
          }
        } catch (err) {
          fail++;
          appendFailure(paths, { file, error: err.message });
          console.log(`[FAIL] ${file}: ${err.message}`);
        }
      })
    )
  );

  state.pages = Array.from(byUrl.values());
  writePages(paths, state);
  console.log(`Done. ok=${ok} fail=${fail}`);
}

