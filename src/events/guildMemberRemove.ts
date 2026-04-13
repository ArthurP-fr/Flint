import { Events, type Client } from "discord.js";

import type { MemberMessageService } from "../features/memberMessages/service.js";
import type { I18nService } from "../i18n/index.js";

export const registerGuildMemberRemove = (
  client: Client,
  i18n: I18nService,
  memberMessageService: MemberMessageService,
): void => {
  client.on(Events.GuildMemberRemove, (member) => {
    void memberMessageService.dispatch({
      client,
      i18n,
      guild: member.guild,
      user: member.user,
      kind: "goodbye",
    }).catch((error) => {
      console.error("[event:guildMemberRemove] failed to send goodbye message", error);
    });
  });
};
