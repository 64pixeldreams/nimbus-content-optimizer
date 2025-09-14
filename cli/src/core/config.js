import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

export function getPaths(cwd = process.cwd()) {
  const root = cwd;
  const nimbusDir = path.join(root, ".nimbus");
  return {
    root,
    nimbusDir,
    envFile: path.join(nimbusDir, ".env"),
    projectFile: path.join(nimbusDir, "project.json"),
    pagesFile: path.join(nimbusDir, "pages.json"),
    failuresLog: path.join(nimbusDir, "failures.log"),
  };
}

export function ensureNimbusDir(paths) {
  if (!fs.existsSync(paths.nimbusDir)) {
    fs.mkdirSync(paths.nimbusDir, { recursive: true });
  }
}

export function loadLocalEnv(paths) {
  if (!fs.existsSync(paths.envFile)) return {};
  const content = fs.readFileSync(paths.envFile, "utf8");
  return dotenv.parse(content);
}

export function saveLocalEnv(paths, envObj) {
  const lines = Object.entries(envObj)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${String(v)}`);
  const content = lines.join("\n") + (lines.length ? "\n" : "");
  fs.writeFileSync(paths.envFile, content, "utf8");
}

export function setApiKey(paths, apiKey, apiUrl) {
  const existing = loadLocalEnv(paths);
  const updated = { ...existing, NIMBUS_API_KEY: apiKey };
  if (apiUrl) updated.NIMBUS_API_URL = apiUrl;
  ensureNimbusDir(paths);
  saveLocalEnv(paths, updated);
}

export function getApiKey(paths) {
  return process.env.NIMBUS_API_KEY || loadLocalEnv(paths).NIMBUS_API_KEY || null;
}

export function getApiBaseUrl(paths) {
  // Default to the deployed Worker URL; can be overridden per-project.
  return (
    process.env.NIMBUS_API_URL ||
    loadLocalEnv(paths).NIMBUS_API_URL ||
    "https://nimbus-platform.martin-598.workers.dev"
  );
}

export function readJsonSafe(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export function readProject(paths) {
  return readJsonSafe(paths.projectFile);
}

export function writeProject(paths, project) {
  writeJson(paths.projectFile, project);
}

export function readPages(paths) {
  return readJsonSafe(paths.pagesFile) || { project_id: null, pages: [] };
}

export function writePages(paths, pagesState) {
  writeJson(paths.pagesFile, pagesState);
}

export function appendFailure(paths, entry) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    ...entry,
  });
  fs.appendFileSync(paths.failuresLog, line + "\n", "utf8");
}

