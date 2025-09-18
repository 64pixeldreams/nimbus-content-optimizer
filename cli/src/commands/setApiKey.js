import { getPaths, ensureNimbusDir, setApiKey as persistKey } from "../core/config.js";
import { cfCall } from "../core/cfCall.js";

export async function setApiKeyCommand({ apiKey, apiUrl, validate = true }) {
  const paths = getPaths();
  ensureNimbusDir(paths);
  persistKey(paths, apiKey, apiUrl);

  if (!validate) {
    console.log("API key saved.");
    return;
  }

  async function withRetry(fn, { retries = 3, baseMs = 400 } = {}) {
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

  try {
    const resp = await withRetry(() => cfCall(paths, "project.list", {}, { apiUrl }));
    if (resp.success) {
      console.log("API key validated. Projects:", (resp.data?.projects?.length ?? 0));
    } else {
      console.log("API key saved, but validation response was not successful.");
    }
  } catch (err) {
    console.log("API key saved, but validation failed:", err.message);
  }
}

