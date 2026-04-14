import { Events, type Client } from "discord.js";

import { createScopedLogger } from "../core/logging/logger.js";
import type { MemberMessageService } from "../modules/memberMessages/index.js";

const log = createScopedLogger("event:guildDelete");

export const registerGuildDelete = (client: Client, memberMessageService: MemberMessageService): void => {
  client.on(Events.GuildDelete, (guild) => {
    log.info({ guildId: guild.id, guildName: guild.name }, "left guild");

    const botId = memberMessageService.resolveBotId(client);
    if (!botId) {
      return;
    }

    void memberMessageService.cleanupGuild(botId, guild.id).catch((error) => {
      log.error({ guildId: guild.id, botId, err: error }, "failed to cleanup guild config");
    });
  });
};
