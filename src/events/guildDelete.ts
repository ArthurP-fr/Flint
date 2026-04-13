import { Events, type Client } from "discord.js";

import type { MemberMessageService } from "../features/memberMessages/service.js";

export const registerGuildDelete = (client: Client, memberMessageService: MemberMessageService): void => {
  client.on(Events.GuildDelete, (guild) => {
    console.log(`[event:guildDelete] left guild ${guild.id} (${guild.name})`);

    const botId = memberMessageService.resolveBotId(client);
    if (!botId) {
      return;
    }

    void memberMessageService.cleanupGuild(botId, guild.id).catch((error) => {
      console.error("[event:guildDelete] failed to cleanup guild config", error);
    });
  });
};
