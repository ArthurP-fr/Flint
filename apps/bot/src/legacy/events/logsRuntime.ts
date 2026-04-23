import { Events, type Client, type Guild, type InviteGuild } from "discord.js";

import { createScopedLogger } from "../core/logging/logger.js";
import type { I18nService } from "../i18n/index.js";
import type { LogEventKey } from "../types/logs.js";
import type { LogEventService } from "../modules/logs/index.js";

const logger = createScopedLogger("event:logsRuntime");

const clamp = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
};

const tForGuild = (
  i18n: I18nService,
  guild: Guild | InviteGuild | null | undefined,
  key: string,
  vars: Record<string, string | number> = {},
): string => {
  const preferredLocale =
    guild && "preferredLocale" in guild
      ? (guild.preferredLocale ?? null)
      : null;
  const lang = i18n.resolveLang(preferredLocale);
  return i18n.t(lang, key, vars);
};

const detailLine = (
  i18n: I18nService,
  guild: Guild | InviteGuild | null | undefined,
  key: string,
  vars: Record<string, string | number> = {},
): string => {
  return tForGuild(i18n, guild, `logsRuntime.details.${key}`, vars);
};

const formatContent = (
  i18n: I18nService,
  guild: Guild | InviteGuild | null | undefined,
  content: string | null | undefined,
): string => {
  const noContent = tForGuild(
    i18n,
    guild,
    "logsRuntime.placeholders.noContent",
  );

  if (typeof content !== "string") {
    return noContent;
  }

  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return noContent;
  }

  return clamp(trimmed, 400);
};

interface EmitRuntimeLogInput {
  eventKey: LogEventKey;
  guild?: Guild | InviteGuild | null | undefined;
  guildId?: string | null | undefined;
  summary: string;
  details?: string[];
  color?: number;
}

const emitRuntimeLog = (
  client: Client,
  logEventService: LogEventService,
  i18n: I18nService,
  input: EmitRuntimeLogInput,
): void => {
  const guildId = input.guild?.id ?? input.guildId;
  if (!guildId) {
    return;
  }

  const title = tForGuild(i18n, input.guild, "logsRuntime.embed.title", {
    event: input.eventKey,
  });
  const detailsTitle = tForGuild(
    i18n,
    input.guild,
    "logsRuntime.embed.detailsField",
  );

  void logEventService
    .dispatchEvent(client, {
      eventKey: input.eventKey,
      guildId,
      summary: input.summary,
      ...(input.details && input.details.length > 0
        ? { details: input.details }
        : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      title,
      detailsTitle,
    })
    .catch((error) => {
      logger.error(
        { eventKey: input.eventKey, guildId, err: error },
        "failed to dispatch runtime log event",
      );
    });
};

export const registerLogRuntimeEvents = (
  client: Client,
  logEventService: LogEventService,
  i18n: I18nService,
): void => {
  client.on(Events.MessageCreate, (message) => {
    if (!message.guild || message.author.bot) {
      return;
    }

    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "messageCreate",
      guild: message.guild,
      summary: tForGuild(
        i18n,
        message.guild,
        "logsRuntime.summaries.messageCreate",
        {
          user: `<@${message.author.id}>`,
          channel: `<#${message.channelId}>`,
        },
      ),
      details: [
        detailLine(i18n, message.guild, "messageId", { value: message.id }),
        detailLine(i18n, message.guild, "author", {
          tag: message.author.tag,
          id: message.author.id,
        }),
        detailLine(i18n, message.guild, "content", {
          value: formatContent(i18n, message.guild, message.content),
        }),
      ],
      color: 0x57f287,
    });
  });

  client.on(Events.MessageDelete, (message) => {
    const guild = message.guild;
    const unknown = tForGuild(i18n, guild, "logsRuntime.placeholders.unknown");
    const authorId = message.author?.id ?? unknown;
    const authorTag = message.author?.tag ?? unknown;

    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "messageDelete",
      guild,
      guildId: guild?.id,
      summary: tForGuild(i18n, guild, "logsRuntime.summaries.messageDelete", {
        channel: `<#${message.channelId}>`,
      }),
      details: [
        detailLine(i18n, guild, "messageId", { value: message.id }),
        detailLine(i18n, guild, "author", {
          tag: authorTag,
          id: authorId,
        }),
        detailLine(i18n, guild, "content", {
          value: formatContent(i18n, guild, message.content),
        }),
      ],
      color: 0xed4245,
    });
  });

  client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
    const guild = newMessage.guild;

    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "messageUpdate",
      guild,
      guildId: guild?.id,
      summary: tForGuild(i18n, guild, "logsRuntime.summaries.messageUpdate", {
        channel: `<#${newMessage.channelId}>`,
      }),
      details: [
        detailLine(i18n, guild, "messageId", { value: newMessage.id }),
        detailLine(i18n, guild, "before", {
          value: formatContent(i18n, guild, oldMessage.content),
        }),
        detailLine(i18n, guild, "after", {
          value: formatContent(i18n, guild, newMessage.content),
        }),
      ],
      color: 0xfee75c,
    });
  });

  client.on(Events.MessageBulkDelete, (messages) => {
    const first = messages.first();
    const guild = first?.guild;
    const unknown = tForGuild(i18n, guild, "logsRuntime.placeholders.unknown");

    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "messageBulkDelete",
      guild,
      guildId: guild?.id,
      summary: tForGuild(
        i18n,
        guild,
        "logsRuntime.summaries.messageBulkDelete",
        {
          count: messages.size,
        },
      ),
      details: [
        detailLine(i18n, guild, "channelId", {
          value: first?.channelId ?? unknown,
        }),
        detailLine(i18n, guild, "count", { value: messages.size }),
      ],
      color: 0xed4245,
    });
  });

  client.on(Events.GuildMemberAdd, (member) => {
    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "guildMemberAdd",
      guild: member.guild,
      summary: tForGuild(
        i18n,
        member.guild,
        "logsRuntime.summaries.guildMemberAdd",
        {
          user: `<@${member.user.id}>`,
        },
      ),
      details: [
        detailLine(i18n, member.guild, "user", {
          tag: member.user.tag,
          id: member.user.id,
        }),
      ],
      color: 0x57f287,
    });
  });

  client.on(Events.GuildMemberRemove, (member) => {
    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "guildMemberRemove",
      guild: member.guild,
      summary: tForGuild(
        i18n,
        member.guild,
        "logsRuntime.summaries.guildMemberRemove",
        {
          user: `<@${member.user.id}>`,
        },
      ),
      details: [
        detailLine(i18n, member.guild, "user", {
          tag: member.user.tag,
          id: member.user.id,
        }),
      ],
      color: 0xed4245,
    });
  });

  client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
    const none = tForGuild(
      i18n,
      newMember.guild,
      "logsRuntime.placeholders.none",
    );

    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "guildMemberUpdate",
      guild: newMember.guild,
      summary: tForGuild(
        i18n,
        newMember.guild,
        "logsRuntime.summaries.guildMemberUpdate",
        {
          user: `<@${newMember.user.id}>`,
        },
      ),
      details: [
        detailLine(i18n, newMember.guild, "user", {
          tag: newMember.user.tag,
          id: newMember.user.id,
        }),
        detailLine(i18n, newMember.guild, "oldNick", {
          value: oldMember.nickname ?? none,
        }),
        detailLine(i18n, newMember.guild, "newNick", {
          value: newMember.nickname ?? none,
        }),
      ],
      color: 0x5865f2,
    });
  });

  client.on(Events.InteractionCreate, (interaction) => {
    if (!interaction.guildId || interaction.user.bot) {
      return;
    }

    const guild = interaction.guild;
    const unknown = tForGuild(i18n, guild, "logsRuntime.placeholders.unknown");

    let summary = tForGuild(
      i18n,
      guild,
      "logsRuntime.summaries.interactionGeneric",
      {
        user: `<@${interaction.user.id}>`,
      },
    );

    if (interaction.isChatInputCommand()) {
      summary = tForGuild(
        i18n,
        guild,
        "logsRuntime.summaries.interactionSlash",
        {
          command: interaction.commandName,
          user: `<@${interaction.user.id}>`,
        },
      );
    } else if (interaction.isButton()) {
      summary = tForGuild(
        i18n,
        guild,
        "logsRuntime.summaries.interactionButton",
        {
          user: `<@${interaction.user.id}>`,
        },
      );
    } else if (interaction.isStringSelectMenu()) {
      summary = tForGuild(
        i18n,
        guild,
        "logsRuntime.summaries.interactionSelect",
        {
          user: `<@${interaction.user.id}>`,
        },
      );
    } else if (interaction.isModalSubmit()) {
      summary = tForGuild(
        i18n,
        guild,
        "logsRuntime.summaries.interactionModal",
        {
          user: `<@${interaction.user.id}>`,
        },
      );
    }

    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "interactionCreate",
      guild,
      guildId: interaction.guildId,
      summary,
      details: [
        detailLine(i18n, guild, "interactionId", { value: interaction.id }),
        detailLine(i18n, guild, "channelId", {
          value: interaction.channelId ?? unknown,
        }),
      ],
      color: 0x5865f2,
    });
  });

  client.on(Events.ChannelCreate, (channel) => {
    if (!("guild" in channel) || !("name" in channel)) {
      return;
    }

    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "channelCreate",
      guild: channel.guild,
      summary: tForGuild(
        i18n,
        channel.guild,
        "logsRuntime.summaries.channelCreate",
        {
          channel: `#${channel.name}`,
        },
      ),
      details: [
        detailLine(i18n, channel.guild, "channelId", { value: channel.id }),
        detailLine(i18n, channel.guild, "type", { value: channel.type }),
      ],
      color: 0x57f287,
    });
  });

  client.on(Events.ChannelDelete, (channel) => {
    if (!("guild" in channel) || !("name" in channel)) {
      return;
    }

    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "channelDelete",
      guild: channel.guild,
      summary: tForGuild(
        i18n,
        channel.guild,
        "logsRuntime.summaries.channelDelete",
        {
          channel: `#${channel.name}`,
        },
      ),
      details: [
        detailLine(i18n, channel.guild, "channelId", { value: channel.id }),
        detailLine(i18n, channel.guild, "type", { value: channel.type }),
      ],
      color: 0xed4245,
    });
  });

  client.on(Events.ChannelUpdate, (oldChannel, newChannel) => {
    if (!("guild" in newChannel) || !("name" in newChannel)) {
      return;
    }

    const unknown = tForGuild(
      i18n,
      newChannel.guild,
      "logsRuntime.placeholders.unknown",
    );
    const oldName = "name" in oldChannel ? oldChannel.name : unknown;

    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "channelUpdate",
      guild: newChannel.guild,
      summary: tForGuild(
        i18n,
        newChannel.guild,
        "logsRuntime.summaries.channelUpdate",
        {
          channel: `#${newChannel.name}`,
        },
      ),
      details: [
        detailLine(i18n, newChannel.guild, "channelId", {
          value: newChannel.id,
        }),
        detailLine(i18n, newChannel.guild, "oldName", { value: oldName }),
        detailLine(i18n, newChannel.guild, "newName", {
          value: newChannel.name,
        }),
      ],
      color: 0xfee75c,
    });
  });

  client.on(Events.GuildRoleCreate, (role) => {
    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "roleCreate",
      guild: role.guild,
      summary: tForGuild(i18n, role.guild, "logsRuntime.summaries.roleCreate", {
        role: `@${role.name}`,
      }),
      details: [detailLine(i18n, role.guild, "roleId", { value: role.id })],
      color: 0x57f287,
    });
  });

  client.on(Events.GuildRoleDelete, (role) => {
    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "roleDelete",
      guild: role.guild,
      summary: tForGuild(i18n, role.guild, "logsRuntime.summaries.roleDelete", {
        role: `@${role.name}`,
      }),
      details: [detailLine(i18n, role.guild, "roleId", { value: role.id })],
      color: 0xed4245,
    });
  });

  client.on(Events.GuildRoleUpdate, (oldRole, newRole) => {
    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "roleUpdate",
      guild: newRole.guild,
      summary: tForGuild(
        i18n,
        newRole.guild,
        "logsRuntime.summaries.roleUpdate",
        {
          role: `@${newRole.name}`,
        },
      ),
      details: [
        detailLine(i18n, newRole.guild, "roleId", { value: newRole.id }),
        detailLine(i18n, newRole.guild, "oldName", { value: oldRole.name }),
        detailLine(i18n, newRole.guild, "newName", { value: newRole.name }),
      ],
      color: 0xfee75c,
    });
  });

  client.on(Events.ThreadCreate, (thread) => {
    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "threadCreate",
      guild: thread.guild ?? null,
      guildId: thread.guild?.id,
      summary: tForGuild(
        i18n,
        thread.guild ?? null,
        "logsRuntime.summaries.threadCreate",
        {
          thread: thread.name,
        },
      ),
      details: [
        detailLine(i18n, thread.guild ?? null, "threadId", {
          value: thread.id,
        }),
      ],
      color: 0x57f287,
    });
  });

  client.on(Events.ThreadDelete, (thread) => {
    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "threadDelete",
      guild: thread.guild ?? null,
      guildId: thread.guild?.id,
      summary: tForGuild(
        i18n,
        thread.guild ?? null,
        "logsRuntime.summaries.threadDelete",
        {
          thread: thread.name,
        },
      ),
      details: [
        detailLine(i18n, thread.guild ?? null, "threadId", {
          value: thread.id,
        }),
      ],
      color: 0xed4245,
    });
  });

  client.on(Events.ThreadUpdate, (oldThread, newThread) => {
    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "threadUpdate",
      guild: newThread.guild ?? null,
      guildId: newThread.guild?.id,
      summary: tForGuild(
        i18n,
        newThread.guild ?? null,
        "logsRuntime.summaries.threadUpdate",
        {
          thread: newThread.name,
        },
      ),
      details: [
        detailLine(i18n, newThread.guild ?? null, "threadId", {
          value: newThread.id,
        }),
        detailLine(i18n, newThread.guild ?? null, "oldName", {
          value: oldThread.name,
        }),
        detailLine(i18n, newThread.guild ?? null, "newName", {
          value: newThread.name,
        }),
      ],
      color: 0xfee75c,
    });
  });

  client.on(Events.GuildEmojiCreate, (emoji) => {
    const unknown = tForGuild(
      i18n,
      emoji.guild ?? null,
      "logsRuntime.placeholders.unknown",
    );

    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "emojiCreate",
      guild: emoji.guild ?? null,
      guildId: emoji.guild?.id,
      summary: tForGuild(
        i18n,
        emoji.guild ?? null,
        "logsRuntime.summaries.emojiCreate",
        {
          emoji: emoji.name ?? unknown,
        },
      ),
      details: [
        detailLine(i18n, emoji.guild ?? null, "emojiId", {
          value: emoji.id ?? unknown,
        }),
      ],
      color: 0x57f287,
    });
  });

  client.on(Events.GuildEmojiDelete, (emoji) => {
    const unknown = tForGuild(
      i18n,
      emoji.guild ?? null,
      "logsRuntime.placeholders.unknown",
    );

    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "emojiDelete",
      guild: emoji.guild ?? null,
      guildId: emoji.guild?.id,
      summary: tForGuild(
        i18n,
        emoji.guild ?? null,
        "logsRuntime.summaries.emojiDelete",
        {
          emoji: emoji.name ?? unknown,
        },
      ),
      details: [
        detailLine(i18n, emoji.guild ?? null, "emojiId", {
          value: emoji.id ?? unknown,
        }),
      ],
      color: 0xed4245,
    });
  });

  client.on(Events.GuildEmojiUpdate, (oldEmoji, newEmoji) => {
    const unknown = tForGuild(
      i18n,
      newEmoji.guild ?? null,
      "logsRuntime.placeholders.unknown",
    );

    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "emojiUpdate",
      guild: newEmoji.guild ?? null,
      guildId: newEmoji.guild?.id,
      summary: tForGuild(
        i18n,
        newEmoji.guild ?? null,
        "logsRuntime.summaries.emojiUpdate",
        {
          emoji: newEmoji.name ?? unknown,
        },
      ),
      details: [
        detailLine(i18n, newEmoji.guild ?? null, "emojiId", {
          value: newEmoji.id ?? unknown,
        }),
        detailLine(i18n, newEmoji.guild ?? null, "oldName", {
          value: oldEmoji.name ?? unknown,
        }),
        detailLine(i18n, newEmoji.guild ?? null, "newName", {
          value: newEmoji.name ?? unknown,
        }),
      ],
      color: 0xfee75c,
    });
  });

  client.on(Events.GuildUpdate, (oldGuild, newGuild) => {
    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "guildUpdate",
      guild: newGuild,
      summary: tForGuild(i18n, newGuild, "logsRuntime.summaries.guildUpdate", {
        guild: newGuild.name,
      }),
      details: [
        detailLine(i18n, newGuild, "guildId", { value: newGuild.id }),
        detailLine(i18n, newGuild, "oldName", { value: oldGuild.name }),
        detailLine(i18n, newGuild, "newName", { value: newGuild.name }),
      ],
      color: 0xfee75c,
    });
  });

  client.on(Events.GuildUnavailable, (guild) => {
    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "guildUnavailable",
      guild,
      summary: tForGuild(
        i18n,
        guild,
        "logsRuntime.summaries.guildUnavailable",
        {
          guild: guild.name,
        },
      ),
      details: [detailLine(i18n, guild, "guildId", { value: guild.id })],
      color: 0xed4245,
    });
  });

  client.on(Events.GuildBanAdd, (ban) => {
    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "guildBanAdd",
      guild: ban.guild,
      summary: tForGuild(i18n, ban.guild, "logsRuntime.summaries.guildBanAdd", {
        user: `<@${ban.user.id}>`,
      }),
      details: [
        detailLine(i18n, ban.guild, "user", {
          tag: ban.user.tag,
          id: ban.user.id,
        }),
        detailLine(i18n, ban.guild, "guildId", { value: ban.guild.id }),
      ],
      color: 0xed4245,
    });
  });

  client.on(Events.GuildBanRemove, (ban) => {
    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "guildBanRemove",
      guild: ban.guild,
      summary: tForGuild(
        i18n,
        ban.guild,
        "logsRuntime.summaries.guildBanRemove",
        {
          user: `<@${ban.user.id}>`,
        },
      ),
      details: [
        detailLine(i18n, ban.guild, "user", {
          tag: ban.user.tag,
          id: ban.user.id,
        }),
        detailLine(i18n, ban.guild, "guildId", { value: ban.guild.id }),
      ],
      color: 0x57f287,
    });
  });

  client.on(Events.InviteCreate, (invite) => {
    const guild = invite.guild ?? null;
    const unknown = tForGuild(i18n, guild, "logsRuntime.placeholders.unknown");

    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "inviteCreate",
      guild,
      guildId: guild?.id,
      summary: tForGuild(i18n, guild, "logsRuntime.summaries.inviteCreate", {
        code: invite.code,
      }),
      details: [
        detailLine(i18n, guild, "channelId", {
          value: invite.channelId ?? unknown,
        }),
        detailLine(i18n, guild, "inviter", {
          value: invite.inviter?.tag ?? unknown,
        }),
      ],
      color: 0x57f287,
    });
  });

  client.on(Events.InviteDelete, (invite) => {
    const guild = invite.guild ?? null;
    const unknown = tForGuild(i18n, guild, "logsRuntime.placeholders.unknown");

    emitRuntimeLog(client, logEventService, i18n, {
      eventKey: "inviteDelete",
      guild,
      guildId: guild?.id,
      summary: tForGuild(i18n, guild, "logsRuntime.summaries.inviteDelete", {
        code: invite.code,
      }),
      details: [
        detailLine(i18n, guild, "channelId", {
          value: invite.channelId ?? unknown,
        }),
      ],
      color: 0xed4245,
    });
  });
};
