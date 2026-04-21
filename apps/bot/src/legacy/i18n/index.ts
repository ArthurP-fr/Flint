import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SUPPORTED_LANGS, type SupportedLang, type TranslationVars } from "../types/command.js";
import type { JsonObject } from "../types/i18n.js";

const DISCORD_LOCALE_MAP: Record<string, SupportedLang> = {
	en: "en",
	"en-us": "en",
	"en-gb": "en",
	es: "es",
	"es-es": "es",
	"es-419": "es",
	de: "de",
	"de-de": "de",
	ja: "ja",
	"ja-jp": "ja",
	fr: "fr",
	"fr-fr": "fr",
	pt: "pt",
	"pt-br": "pt",
	"pt-pt": "pt",
	ru: "ru",
	"ru-ru": "ru",
	it: "it",
	"it-it": "it",
	nl: "nl",
	"nl-nl": "nl",
	pl: "pl",
	"pl-pl": "pl",
	zh: "zh",
	"zh-cn": "zh",
	"zh-hans": "zh",
	"zh-tw": "zh",
	"zh-hant": "zh",
	hi: "hi",
	"hi-in": "hi",
	ar: "ar",
	"ar-sa": "ar",
	bn: "bn",
	"bn-bd": "bn",
	"bn-in": "bn",
	id: "id",
	"id-id": "id",
	tr: "tr",
	"tr-tr": "tr",
};

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const LOCALE_DIR_CANDIDATES = [
	path.resolve(CURRENT_DIR, "..", "..", "..", "locales"),
	path.resolve(process.cwd(), "apps", "bot", "locales"),
	path.resolve(process.cwd(), "locales"),
	CURRENT_DIR,
	path.resolve(process.cwd(), "src", "legacy", "i18n"),
	path.resolve(process.cwd(), "dist", "legacy", "i18n"),
];

const resolveLocaleFilePath = (lang: SupportedLang): string => {
	for (const directory of LOCALE_DIR_CANDIDATES) {
		const filePath = path.join(directory, `${lang}.json`);
		if (existsSync(filePath)) {
			return filePath;
		}
	}

	throw new Error(`[i18n] missing locale file for "${lang}"`);
};

export class I18nService {
	private readonly dictionaries: Record<SupportedLang, JsonObject>;
	private readonly fallbackLang: SupportedLang = "en";

	public constructor(private readonly defaultLang: SupportedLang) {
		this.dictionaries = this.loadDictionaries();
	}

	public resolveLang(input?: string | null): SupportedLang {
		if (!input) {
			return this.fallbackLang;
		}

		const normalized = input.toLowerCase();

		const direct = DISCORD_LOCALE_MAP[normalized];
		if (direct) {
			return direct;
		}

		const short = normalized.split("-")[0];
		const fromShort = short ? DISCORD_LOCALE_MAP[short] : undefined;
		if (fromShort) {
			return fromShort;
		}

		return this.fallbackLang;
	}

	public t(lang: SupportedLang, key: string, vars: TranslationVars = {}): string {
		const fromLang = this.lookup(this.dictionaries[lang], key);
		const fromFallback = this.lookup(this.dictionaries[this.fallbackLang], key);
		const fromDefault = this.lookup(this.dictionaries[this.defaultLang], key);

		const template =
			typeof fromLang === "string"
				? fromLang
				: typeof fromFallback === "string"
					? fromFallback
					: typeof fromDefault === "string"
						? fromDefault
						: key;

		return this.format(template, vars);
	}

	public commandT(lang: SupportedLang, commandName: string, relativeKey: string, vars: TranslationVars = {}): string {
		return this.t(lang, `${this.commandBaseKey(commandName)}.${relativeKey}`, vars);
	}

	public commandName(lang: SupportedLang, commandName: string): string {
		const key = `${this.commandBaseKey(commandName)}.name`;
		const fromLang = this.lookup(this.dictionaries[lang], key);
		if (typeof fromLang === "string" && fromLang.length > 0) {
			return fromLang;
		}

		const fromFallback = this.lookup(this.dictionaries[this.fallbackLang], key);
		if (typeof fromFallback === "string" && fromFallback.length > 0) {
			return fromFallback;
		}

		const fromDefault = this.lookup(this.dictionaries[this.defaultLang], key);
		if (typeof fromDefault === "string" && fromDefault.length > 0) {
			return fromDefault;
		}

		return commandName;
	}

	public commandTrigger(lang: SupportedLang, commandName: string): string {
		return this.commandName(lang, commandName).trim().toLowerCase();
	}

	public commandObject(lang: SupportedLang, commandName: string): Record<string, unknown> {
		const key = this.commandBaseKey(commandName);
		const fromLang = this.lookup(this.dictionaries[lang], key);
		if (this.isObject(fromLang)) {
			return fromLang;
		}

		const fromFallback = this.lookup(this.dictionaries[this.fallbackLang], key);
		if (this.isObject(fromFallback)) {
			return fromFallback;
		}

		const fromDefault = this.lookup(this.dictionaries[this.defaultLang], key);
		if (this.isObject(fromDefault)) {
			return fromDefault;
		}

		return {};
	}

	public format(template: string, vars: TranslationVars = {}): string {
		return this.interpolate(template, vars);
	}

	private loadDictionaries(): Record<SupportedLang, JsonObject> {
		return SUPPORTED_LANGS.reduce<Record<SupportedLang, JsonObject>>((acc, lang) => {
			const filePath = resolveLocaleFilePath(lang);
			const raw = readFileSync(filePath, "utf-8");
			acc[lang] = JSON.parse(raw) as JsonObject;
			return acc;
		}, {} as Record<SupportedLang, JsonObject>);
	}

	private lookup(source: JsonObject, key: string): unknown {
		const parts = key.split(".");
		let current: unknown = source;

		for (const part of parts) {
			if (!current || typeof current !== "object" || Array.isArray(current)) {
				return undefined;
			}

			current = (current as JsonObject)[part];
		}

		return current;
	}

	private commandBaseKey(commandName: string): string {
		return `commands.${commandName}`;
	}

	private isObject(value: unknown): value is Record<string, unknown> {
		return Boolean(value) && typeof value === "object" && !Array.isArray(value);
	}

	private interpolate(template: string, vars: TranslationVars): string {
		return template.replace(/\{\{(\w+)\}\}/g, (_, variable: string) => {
			const value = vars[variable];
			return value === undefined || value === null ? "" : String(value);
		});
	}
}
