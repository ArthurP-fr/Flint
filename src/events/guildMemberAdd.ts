import { Events, type Client } from "discord.js";

import type { MemberMessageService } from "../features/memberMessages/service.js";
import type { I18nService } from "../i18n/index.js";

export const registerGuildMemberAdd = (
  client: Client,
  i18n: I18nService,
  memberMessageService: MemberMessageService,
): void => {
  client.on(Events.GuildMemberAdd, (member) => {
    void memberMessageService.dispatch({
      client,
      i18n,
      guild: member.guild,
      user: member.user,
      kind: "welcome",
    }).catch((error) => {
      console.error("[event:guildMemberAdd] failed to send welcome message", error);
    });
  });
};
