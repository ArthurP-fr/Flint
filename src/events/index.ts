import type { ChatInputCommandInteraction, Client, Message } from "discord.js";

import type { AppFeatureServices } from "../app/container.js";
import type { CommandRegistry } from "../core/commands/registry.js";
import type { I18nService } from "../i18n/index.js";
import { registerGuildCreate } from "./guildCreate.js";
import { registerGuildDelete } from "./guildDelete.js";
import { registerGuildMemberAdd } from "./guildMemberAdd.js";
import { registerGuildMemberRemove } from "./guildMemberRemove.js";
import { registerInteractionCreate } from "./interactionCreate.js";
import { registerMessageCreate } from "./messageCreate.js";
import { registerClientReady } from "./ready.js";

export const registerEvents = (
  client: Client,
  i18n: I18nService,
  handlers: {
    onPrefixMessage: (m: Message) => Promise<void>;
    onSlashInteraction: (i: ChatInputCommandInteraction) => Promise<void>;
  },
  registry: CommandRegistry,
  services: AppFeatureServices,
): void => {
  registerMessageCreate(client, handlers.onPrefixMessage);
  registerInteractionCreate(client, handlers.onSlashInteraction);

  registerGuildMemberAdd(client, i18n, services.memberMessageService);
  registerGuildMemberRemove(client, i18n, services.memberMessageService);

  registerGuildCreate(client);
  registerGuildDelete(client, services.memberMessageService);

  registerClientReady(client, registry, i18n, services.presenceService);
};
