import { Client, GatewayIntentBits } from "discord.js";
import { Pool } from "pg";

import type { AppFeatureServices } from "./container.js";
import { createCommandList } from "../commands/index.js";
import { env } from "../config/env.js";
import { CommandRegistry } from "../core/commands/registry.js";
import { CommandExecutor } from "../core/execution/CommandExecutor.js";
import { PostgresMemberMessageStore } from "../database/stores/memberMessageStore.js";
import { PostgresPresenceStore } from "../database/stores/presenceStore.js";
import { DatabaseLifecycle } from "../database/dbLifecycle.js";
import { registerEvents } from "../events/index.js";
import { createPrefixHandler } from "../handlers/prefixHandler.js";
import { createSlashHandler } from "../handlers/slashHandler.js";
import { I18nService } from "../i18n/index.js";
import { MemberMessageService } from "../features/memberMessages/service.js";
import { PresenceService } from "../features/presence/service.js";

const bindGracefulShutdown = (shutdown: (signal: string) => Promise<void>): void => {
  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
};

export const bootstrap = async (): Promise<void> => {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
  });

  const presenceStore = new PostgresPresenceStore(pool);
  const memberMessageStore = new PostgresMemberMessageStore(pool);

  const dbLifecycle = new DatabaseLifecycle(
    [
      { name: "presenceStore", init: () => presenceStore.init() },
      { name: "memberMessageStore", init: () => memberMessageStore.init() },
    ],
    async () => {
      await pool.end();
    },
  );

  const services: AppFeatureServices = {
    presenceService: new PresenceService(presenceStore, env.PRESENCE_STREAM_URL),
    memberMessageService: new MemberMessageService(memberMessageStore),
  };

  let shuttingDown = false;
  let client: Client | null = null;

  const shutdown = async (signal: string, exitCode = 0): Promise<void> => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log(`[shutdown] ${signal}`);

    if (client) {
      client.destroy();
    }

    await services.presenceService.shutdown().catch((error) => {
      console.error("[shutdown] presence service close failed", error);
    });

    await dbLifecycle.shutdown().catch((error) => {
      console.error("[shutdown] database shutdown failed", error);
    });

    process.exit(exitCode);
  };

  try {
    await dbLifecycle.init();
    bindGracefulShutdown((signal) => shutdown(signal));

    process.on("unhandledRejection", (reason) => {
      console.error("[process] unhandled rejection", reason);
    });

    process.on("uncaughtException", (error) => {
      console.error("[process] uncaught exception", error);
    });

    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    const i18n = new I18nService(env.DEFAULT_LANG);
    const registry = new CommandRegistry(createCommandList(services, i18n), i18n);
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

    registerEvents(client, i18n, { onPrefixMessage, onSlashInteraction }, registry, services);

    await client.login(env.DISCORD_TOKEN);
  } catch (error) {
    await services.presenceService.shutdown().catch((closeError) => {
      console.error("[boot] failed to close presence service", closeError);
    });

    await dbLifecycle.shutdown().catch((closeError) => {
      console.error("[boot] failed to shutdown database", closeError);
    });

    throw error;
  }
};
