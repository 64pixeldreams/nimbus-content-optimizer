import { Command } from "commander";
import { setApiKeyCommand } from "./commands/setApiKey.js";
import { syncProjectCommand } from "./commands/syncProject.js";
import { upsertPagesCommand } from "./commands/upsertPages.js";

export async function run() {
  const program = new Command();

  program
    .name("nimbus")
    .description("Nimbus CLI for syncing pages to the Worker")
    .version("0.1.0");

  program
    .command("set-api-key")
    .description("Save API key to .nimbus/.env and validate it")
    .argument("<apiKey>", "API key from Nimbus dashboard")
    .option("--api-url <url>", "Override API base URL (default from env or Worker dev URL)")
    .option("--no-validate", "Skip validation call")
    .action(async (apiKey, options) => {
      await setApiKeyCommand({
        apiKey,
        apiUrl: options.apiUrl,
        validate: options.validate !== false,
      });
    });

  program
    .command("sync-project")
    .description("Create/link project, optional extract with Gulp, then upload maps")
    .option("--name <name>", "Project name when creating")
    .option("--domain <domain>", "Project domain when creating")
    .option("--link <project_id>", "Link to an existing project by ID")
    .option("--extract", "Run existing Gulp extraction before upload")
    .option("--folder <path>", "Folder for Gulp extraction (e.g., dist or dist/local)")
    .option("--maps-dir <path>", "Directory with JSON maps", "gulp/.nimbus/maps")
    .option("--concurrency <n>", "Concurrent uploads", (v) => parseInt(v, 10), 5)
    .option("--api-url <url>", "Override API base URL")
    .action(async (options) => {
      await syncProjectCommand(options);
    });

  program
    .command("upsert-pages")
    .description("Scan extracted maps and upsert pages to Nimbus")
    .option("--dir <dir>", "Directory with JSON maps", "gulp/.nimbus/maps")
    .option("--concurrency <n>", "Concurrent upserts", (v) => parseInt(v, 10), 5)
    .option("--api-url <url>", "Override API base URL")
    .action(async (options) => {
      await upsertPagesCommand(options);
    });

  await program.parseAsync(process.argv);
}

