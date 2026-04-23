import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const BOT_DIR = path.resolve(SCRIPT_DIR, "..");
const SOURCE_DIR = path.join(BOT_DIR, "locales");
const TARGET_DIRECTORIES = [
  path.join(BOT_DIR, "dist", "locales"),
  path.join(BOT_DIR, "dist", "legacy", "i18n"),
];

if (!existsSync(SOURCE_DIR)) {
  throw new Error(`[i18n] source locale directory not found: ${SOURCE_DIR}`);
}

for (const targetDirectory of TARGET_DIRECTORIES) {
  mkdirSync(targetDirectory, { recursive: true });
}

for (const fileName of readdirSync(SOURCE_DIR)) {
  if (!fileName.endsWith(".json")) {
    continue;
  }

  for (const targetDirectory of TARGET_DIRECTORIES) {
    copyFileSync(
      path.join(SOURCE_DIR, fileName),
      path.join(targetDirectory, fileName),
    );
  }
}
