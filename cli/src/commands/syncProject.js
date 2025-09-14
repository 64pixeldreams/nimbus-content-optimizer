import {
  getPaths,
  ensureNimbusDir,
  getApiKey,
  readProject,
  writeProject,
} from "../core/config.js";
import { cfCall } from "../core/cfCall.js";

export async function syncProjectCommand({ name, domain, link, apiUrl }) {
  const paths = getPaths();
  ensureNimbusDir(paths);

  const apiKey = getApiKey(paths);
  if (!apiKey) {
    throw new Error("Missing API key. Run: nimbus set-api-key <KEY>");
  }

  const existing = readProject(paths);
  if (existing?.project_id) {
    // Validate project exists
    try {
      await cfCall(paths, "project.get", { project_id: existing.project_id }, { apiUrl });
      console.log("Project already linked:", existing.project_id);
      return;
    } catch {
      console.log("Existing project.json invalid; attempting to re-link/create...");
    }
  }

  if (link) {
    // Verify link target
    await cfCall(paths, "project.get", { project_id: link }, { apiUrl });
    writeProject(paths, {
      project_id: link,
      linked_at: new Date().toISOString(),
    });
    console.log("Linked to existing project:", link);
    return;
  }

  if (!name) throw new Error("--name is required when creating a project");
  if (!domain) throw new Error("--domain is required when creating a project");

  const result = await cfCall(paths, "project.create", { name, domain }, { apiUrl });
  const project = result.data?.project;
  if (!project?.project_id) {
    throw new Error("Failed to create project: missing project_id in response");
  }
  writeProject(paths, {
    project_id: project.project_id,
    name: project.name,
    domain: project.domain,
    linked_at: new Date().toISOString(),
  });
  console.log("Created and linked project:", project.project_id);
}

