import { Events, type Client } from "discord.js";

import type { I18nService } from "../framework/i18n/I18nService.js";
import { dispatchMemberMessage } from "../framework/memberMessages/memberMessageSender.js";

export const registerMemberMessageEvents = (client: Client, i18n: I18nService): void => {
  client.on(Events.GuildMemberAdd, (member) => {
    void dispatchMemberMessage({
      client,
      i18n,
      guild: member.guild,
      user: member.user,
      kind: "welcome",
    }).catch((error) => {
      console.error("[event:guildMemberAdd] failed to send welcome message", error);
    });
  });

  client.on(Events.GuildMemberRemove, (member) => {
    void dispatchMemberMessage({
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
