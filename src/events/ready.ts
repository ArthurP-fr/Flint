import { Events, type Client } from "discord.js";

import { env } from "../config/env.js";
import { deployApplicationCommands } from "../core/commands/deploy.js";
import type { CommandRegistry } from "../core/commands/registry.js";
import type { PresenceService } from "../features/presence/service.js";
import type { I18nService } from "../i18n/index.js";

export const registerClientReady = (
  client: Client,
  registry: CommandRegistry,
  i18n: I18nService,
  presenceService: PresenceService,
): void => {
  client.once(Events.ClientReady, async () => {
    console.log(`[ready] logged as ${client.user?.tag ?? "unknown"}`);
    try {
      await presenceService.restoreFromStorage(client);
    } catch (error) {
      console.error("[ready] failed to restore bot presence", error);
    }

    if (env.AUTO_DEPLOY_SLASH) {
      try {
        const result = await deployApplicationCommands({
          token: env.DISCORD_TOKEN,
          clientId: env.DISCORD_CLIENT_ID,
          registry,
          i18n,
          ...(env.DEV_GUILD_ID ? { guildId: env.DEV_GUILD_ID } : {}),
        });
        console.log(`[ready] slash sync done (${result.scope}, ${result.count} commands)`);
      } catch (error) {
        console.error("[ready] slash sync failed", error);
      }
    }
  });
};
