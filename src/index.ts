import { Client, Events, GatewayIntentBits } from "discord.js";

import { commandList } from "./commands/index.js";
import { restorePresenceFromStorage, shutdownPresenceRuntime } from "./commands/utility/presence.js";
import { registerMemberMessageEvents } from "./events/memberMessageEvents.js";
import { deployApplicationCommands } from "./framework/commands/deploy.js";
import { CommandRegistry } from "./framework/commands/registry.js";
import { env } from "./framework/config/env.js";
import { CommandExecutor } from "./framework/execution/CommandExecutor.js";
import { createPrefixHandler } from "./framework/handlers/prefixHandler.js";
import { createSlashHandler } from "./framework/handlers/slashHandler.js";
import { I18nService } from "./framework/i18n/I18nService.js";
import {
  initMemberMessageStore,
  shutdownMemberMessageStore,
} from "./framework/memberMessages/memberMessageStore.js";
import { initPresenceStore, shutdownPresenceStore } from "./framework/presence/presenceStore.js";

const bindGracefulShutdown = (): void => {
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[shutdown] ${signal}`);
    shutdownPresenceRuntime();
    await shutdownMemberMessageStore().catch((error) => {
      console.error("[shutdown] member message store close failed", error);
    });
    await shutdownPresenceStore().catch((error) => {
      console.error("[shutdown] presence store close failed", error);
    });
    process.exit(0);
  };

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
};

const bootstrap = async (): Promise<void> => {
  await initPresenceStore();
  await initMemberMessageStore();
  bindGracefulShutdown();

  process.on("unhandledRejection", (reason) => {
    console.error("[process] unhandled rejection", reason);
  });

  process.on("uncaughtException", (error) => {
    console.error("[process] uncaught exception", error);
  });

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  const i18n = new I18nService(env.DEFAULT_LANG);
  const registry = new CommandRegistry(commandList, i18n);
  const executor = new CommandExecutor();

  const onPrefixMessage = createPrefixHandler({
    registry,
    i18n,
    executor,
    prefix: env.PREFIX,
    defaultLang: env.DEFAULT_LANG,
  });

  const onSlashInteraction = createSlashHandler({
    registry,
    i18n,
    executor,
    prefix: env.PREFIX,
    defaultLang: env.DEFAULT_LANG,
  });

  client.on(Events.MessageCreate, (message) => {
    void onPrefixMessage(message).catch((error) => {
      console.error("[event:messageCreate] handler failed", error);
    });
  });

  client.on(Events.InteractionCreate, (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    void onSlashInteraction(interaction).catch((error) => {
      console.error("[event:interactionCreate] handler failed", error);
    });
  });

  registerMemberMessageEvents(client, i18n);

  client.once(Events.ClientReady, async () => {
    console.log(`[ready] logged as ${client.user?.tag ?? "unknown"}`);
    try {
      await restorePresenceFromStorage(client);
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

  await client.login(env.DISCORD_TOKEN);
};

bootstrap().catch(async (error) => {
  console.error("[boot] fatal error", error);
  shutdownPresenceRuntime();
  await shutdownMemberMessageStore().catch((closeError) => {
    console.error("[boot] failed to close member message store", closeError);
  });
  await shutdownPresenceStore().catch((closeError) => {
    console.error("[boot] failed to close presence store", closeError);
  });
  process.exit(1);
});
