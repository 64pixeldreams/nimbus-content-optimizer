import {
  getPaths,
  ensureNimbusDir,
  getApiKey,
  readProject,
  writeProject,
} from "../core/config.js";
import { cfCall } from "../core/cfCall.js";
import { runCommand } from "../core/shell.js";
import path from "node:path";

export async function syncProjectCommand({ name, domain, link, apiUrl, extract = false, folder, mapsDir = "gulp/.nimbus/maps", concurrency = 5 }) {
  const paths = getPaths();
  ensureNimbusDir(paths);

  const apiKey = getApiKey(paths);
  if (!apiKey) {
    throw new Error("Missing API key. Run: nimbus set-api-key <KEY>");
  }

  const existing = readProject(paths);
  if (existing?.project_id) {
    try {
      const got = await cfCall(paths, "project.get", { project_id: existing.project_id }, { apiUrl });
      const proj = got.data?.project || {};
      console.log("Project already linked:", existing.project_id, proj.name ? `(${proj.name})` : "");
    } catch {
      console.log("Existing project.json invalid; attempting to re-link/create...");
      if (link) {
        const got = await cfCall(paths, "project.get", { project_id: link }, { apiUrl });
        const proj = got.data?.project || {};
        writeProject(paths, {
          project_id: link,
          name: proj.name,
          domain: proj.domain,
          linked_at: new Date().toISOString(),
        });
        console.log("Linked to existing project:", link, proj.name ? `(${proj.name} - ${proj.domain || ""})` : "");
      } else if (name && domain) {
        const result = await cfCall(paths, "project.create", { name, domain }, { apiUrl });
        const project = result.data?.project;
        writeProject(paths, {
          project_id: project.project_id,
          name: project.name,
          domain: project.domain,
          linked_at: new Date().toISOString(),
        });
        console.log("Created and linked project:", project.project_id, `(${project.name} - ${project.domain})`);
      }
    }
  } else {
    if (link) {
      const got = await cfCall(paths, "project.get", { project_id: link }, { apiUrl });
      const proj = got.data?.project || {};
      writeProject(paths, {
        project_id: link,
        name: proj.name,
        domain: proj.domain,
        linked_at: new Date().toISOString(),
      });
      console.log("Linked to existing project:", link, proj.name ? `(${proj.name} - ${proj.domain || ""})` : "");
    } else if (name && domain) {
      const result = await cfCall(paths, "project.create", { name, domain }, { apiUrl });
      const project = result.data?.project;
      if (!project?.project_id) throw new Error("Failed to create project: missing project_id");
      writeProject(paths, {
        project_id: project.project_id,
        name: project.name,
        domain: project.domain,
        linked_at: new Date().toISOString(),
      });
      console.log("Created and linked project:", project.project_id, `(${project.name} - ${project.domain})`);
    } else {
      throw new Error("Provide --link <project_id> or --name and --domain");
    }
  }

  // Optional: run Gulp extraction before upload
  if (extract) {
    if (!folder) throw new Error("--folder is required when using --extract");
    const gulpDir = path.resolve(process.cwd(), "gulp");
    const absFolder = path.isAbsolute(folder) ? folder : path.resolve(process.cwd(), folder);
    console.log(`Running Gulp extraction in ${gulpDir} for folder: ${absFolder}`);
    // gulp nimbus:scan:map --folder <absFolder>
    await runCommand("powershell", ["-Command", `"cd '${gulpDir}'; npx gulp nimbus:scan:map --folder '${absFolder}'"`], {});
  }

  // Upload maps
  const { upsertPagesCommand } = await import("./upsertPages.js");
  await upsertPagesCommand({ dir: mapsDir, concurrency, apiUrl });
}

