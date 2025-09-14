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

  try {
    // Lightweight authed call: project.list (exists per Worker registry)
    const resp = await cfCall(paths, "project.list", {}, { apiUrl });
    if (resp.success) {
      console.log("API key validated. Projects:", (resp.data?.projects?.length ?? 0));
    } else {
      console.log("API key saved, but validation response was not successful.");
    }
  } catch (err) {
    console.log("API key saved, but validation failed:", err.message);
  }
}

