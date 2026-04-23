import {
  ApplicationCommandOptionType,
  SlashCommandBuilder,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";

import {
  SUPPORTED_LANGS,
  type BotCommand,
  type CommandArgument,
  type SupportedLang,
} from "../../types/command.js";
import type { I18nService } from "../../i18n/index.js";

const LANG_TO_DISCORD_LOCALE: Partial<Record<SupportedLang, string>> = {
  en: "en-US",
  es: "es-ES",
  de: "de",
  ja: "ja",
  fr: "fr",
  pt: "pt-BR",
  ru: "ru",
  it: "it",
  nl: "nl",
  pl: "pl",
  zh: "zh-CN",
  hi: "hi",
  id: "id",
  tr: "tr",
};

const toLocalizationMap = (
  source: Partial<Record<SupportedLang, string>>,
): Record<string, string> => {
  const entries = Object.entries(source)
    .map(([lang, value]) => {
      const discordLocale = LANG_TO_DISCORD_LOCALE[lang as SupportedLang];
      if (!discordLocale || !value) {
        return null;
      }

      return [discordLocale, value] as const;
    })
    .filter((entry): entry is readonly [string, string] => entry !== null);

  return Object.fromEntries(entries);
};

const buildCommandNameLocalizationSource = (
  command: BotCommand,
  i18n: I18nService,
): Partial<Record<SupportedLang, string>> => {
  const localizations: Partial<Record<SupportedLang, string>> = {};

  for (const lang of SUPPORTED_LANGS) {
    if (!LANG_TO_DISCORD_LOCALE[lang]) {
      continue;
    }

    localizations[lang] = i18n.commandName(lang, command.meta.name);
  }

  return localizations;
};

const buildDescriptionLocalizationSource = (
  descriptionKey: string,
  i18n: I18nService,
): Partial<Record<SupportedLang, string>> => {
  const localizations: Partial<Record<SupportedLang, string>> = {};

  for (const lang of SUPPORTED_LANGS) {
    if (!LANG_TO_DISCORD_LOCALE[lang]) {
      continue;
    }

    localizations[lang] = i18n.t(lang, descriptionKey);
  }

  return localizations;
};

const argDescriptionKey = (
  command: BotCommand,
  arg: CommandArgument,
): string => {
  return `commands.${command.meta.name}.${arg.descriptionKey}`;
};

const commandDescriptionKey = (command: BotCommand): string => {
  return `commands.${command.meta.name}.description`;
};

const buildHelpCommandChoices = (
  commands: readonly BotCommand[],
  i18n: I18nService,
): Array<{ name: string; value: string }> => {
  return commands
    .slice()
    .sort((a, b) => a.meta.name.localeCompare(b.meta.name))
    .slice(0, 25)
    .map((cmd) => ({
      name: i18n.commandName("en", cmd.meta.name),
      value: cmd.meta.name,
    }));
};

const applyOption = (
  builder: SlashCommandBuilder,
  command: BotCommand,
  arg: CommandArgument,
  i18n: I18nService,
  allCommands: readonly BotCommand[],
): void => {
  const descriptionKey = argDescriptionKey(command, arg);
  const descriptionEn = i18n.t("en", descriptionKey);
  const descriptionLocalizations = toLocalizationMap(
    buildDescriptionLocalizationSource(descriptionKey, i18n),
  );

  if (arg.type === "user") {
    builder.addUserOption((opt) =>
      opt
        .setName(arg.name)
        .setDescription(descriptionEn)
        .setDescriptionLocalizations(descriptionLocalizations)
        .setRequired(arg.required),
    );
    return;
  }

  if (arg.type === "int") {
    builder.addIntegerOption((opt) =>
      opt
        .setName(arg.name)
        .setDescription(descriptionEn)
        .setDescriptionLocalizations(descriptionLocalizations)
        .setRequired(arg.required),
    );
    return;
  }

  if (arg.type === "number") {
    builder.addNumberOption((opt) =>
      opt
        .setName(arg.name)
        .setDescription(descriptionEn)
        .setDescriptionLocalizations(descriptionLocalizations)
        .setRequired(arg.required),
    );
    return;
  }

  if (arg.type === "boolean") {
    builder.addBooleanOption((opt) =>
      opt
        .setName(arg.name)
        .setDescription(descriptionEn)
        .setDescriptionLocalizations(descriptionLocalizations)
        .setRequired(arg.required),
    );
    return;
  }

  if (arg.type === "channel") {
    builder.addChannelOption((opt) =>
      opt
        .setName(arg.name)
        .setDescription(descriptionEn)
        .setDescriptionLocalizations(descriptionLocalizations)
        .setRequired(arg.required),
    );
    return;
  }

  if (arg.type === "role") {
    builder.addRoleOption((opt) =>
      opt
        .setName(arg.name)
        .setDescription(descriptionEn)
        .setDescriptionLocalizations(descriptionLocalizations)
        .setRequired(arg.required),
    );
    return;
  }

  builder.addStringOption((opt) => {
    const configured = opt
      .setName(arg.name)
      .setDescription(descriptionEn)
      .setDescriptionLocalizations(descriptionLocalizations)
      .setRequired(arg.required);

    if (command.meta.name === "help" && arg.name === "command") {
      const choices = buildHelpCommandChoices(allCommands, i18n);
      if (choices.length > 0) {
        configured.addChoices(...choices);
      }
    }

    return configured;
  });
};

export const buildSlashPayload = (
  commands: readonly BotCommand[],
  i18n: I18nService,
): RESTPostAPIChatInputApplicationCommandsJSONBody[] => {
  return commands.map((command) => {
    const descriptionKey = commandDescriptionKey(command);

    const slashLocalizations = toLocalizationMap(
      buildCommandNameLocalizationSource(command, i18n),
    );
    const descriptionLocalizations = toLocalizationMap(
      buildDescriptionLocalizationSource(descriptionKey, i18n),
    );

    const slashBuilder = new SlashCommandBuilder()
      .setName(command.meta.name)
      .setDescription(i18n.t("en", descriptionKey))
      .setDescriptionLocalizations(descriptionLocalizations)
      .setNameLocalizations(slashLocalizations);

    for (const arg of command.args) {
      applyOption(slashBuilder, command, arg, i18n, commands);
    }

    return slashBuilder.toJSON() as RESTPostAPIChatInputApplicationCommandsJSONBody;
  });
};

export const commandOptionType = (
  type: CommandArgument["type"],
): ApplicationCommandOptionType => {
  switch (type) {
    case "user":
      return ApplicationCommandOptionType.User;
    case "int":
      return ApplicationCommandOptionType.Integer;
    case "number":
      return ApplicationCommandOptionType.Number;
    case "boolean":
      return ApplicationCommandOptionType.Boolean;
    case "channel":
      return ApplicationCommandOptionType.Channel;
    case "role":
      return ApplicationCommandOptionType.Role;
    default:
      return ApplicationCommandOptionType.String;
  }
};
