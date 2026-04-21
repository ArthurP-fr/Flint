import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SUPPORTED_LOCALES = [
  "en",
  "es",
  "de",
  "ja",
  "fr",
  "pt",
  "ru",
  "it",
  "nl",
  "pl",
  "zh",
  "hi",
  "ar",
  "bn",
  "id",
  "tr",
];

const TARGETS = [
  {
    name: "bot",
    directory: "apps/bot/locales",
  },
  {
    name: "web",
    directory: "apps/web/locales",
  },
];

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const CHECK_ONLY = process.argv.includes("--check");

const isObject = (value) => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const readJsonFile = (filePath) => {
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
};

const writeJsonFile = (filePath, content) => {
  writeFileSync(filePath, `${JSON.stringify(content, null, 2)}\n`, "utf-8");
};

const shapeFromBase = (base, override) => {
  if (Array.isArray(base)) {
    return Array.isArray(override) ? override : base;
  }

  if (isObject(base)) {
    const result = {};
    const overrideObject = isObject(override) ? override : {};

    for (const [key, value] of Object.entries(base)) {
      result[key] = shapeFromBase(value, overrideObject[key]);
    }

    return result;
  }

  return typeof override === typeof base ? override : base;
};

const collectLeafPaths = (input, prefix = "", output = []) => {
  if (isObject(input)) {
    for (const [key, value] of Object.entries(input)) {
      const nextPrefix = prefix.length > 0 ? `${prefix}.${key}` : key;
      collectLeafPaths(value, nextPrefix, output);
    }
    return output;
  }

  output.push(prefix);
  return output;
};

let hasError = false;

for (const target of TARGETS) {
  const targetDirectory = path.resolve(REPO_ROOT, target.directory);
  const defaultLocalePath = path.join(targetDirectory, "en.json");

  if (!existsSync(defaultLocalePath)) {
    console.error(`[i18n:${target.name}] missing default locale file: ${defaultLocalePath}`);
    hasError = true;
    continue;
  }

  mkdirSync(targetDirectory, { recursive: true });

  const baseDictionary = readJsonFile(defaultLocalePath);
  const baseLeafPaths = new Set(collectLeafPaths(baseDictionary));

  for (const locale of SUPPORTED_LOCALES) {
    const localePath = path.join(targetDirectory, `${locale}.json`);
    const localeExists = existsSync(localePath);
    const currentDictionary = localeExists ? readJsonFile(localePath) : {};
    const normalizedDictionary = shapeFromBase(baseDictionary, currentDictionary);

    const normalizedText = JSON.stringify(normalizedDictionary, null, 2);
    const currentText = JSON.stringify(currentDictionary, null, 2);

    if (!CHECK_ONLY && (!localeExists || normalizedText !== currentText)) {
      writeJsonFile(localePath, normalizedDictionary);
      console.log(`[i18n:${target.name}] synced ${locale}.json`);
    }

    if (CHECK_ONLY) {
      const localeLeafPaths = new Set(collectLeafPaths(currentDictionary));

      const missingPaths = [...baseLeafPaths].filter((key) => !localeLeafPaths.has(key));
      const extraPaths = [...localeLeafPaths].filter((key) => !baseLeafPaths.has(key));

      if (missingPaths.length > 0 || extraPaths.length > 0) {
        hasError = true;
        console.error(`[i18n:${target.name}] ${locale}.json is out of sync`);

        if (missingPaths.length > 0) {
          console.error(`  missing keys: ${missingPaths.join(", ")}`);
        }

        if (extraPaths.length > 0) {
          console.error(`  extra keys: ${extraPaths.join(", ")}`);
        }
      }
    }
  }
}

if (CHECK_ONLY && hasError) {
  process.exitCode = 1;
}
