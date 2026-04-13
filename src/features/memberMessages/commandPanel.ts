import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  ContainerBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
} from "discord.js";

import { ComponentSessionRegistry } from "../../core/discord/componentSessionRegistry.js";
import { resolveReplyMessage } from "../../core/discord/replyMessageResolver.js";
import type { I18nService } from "../../i18n/index.js";
import type { CommandExecutionContext } from "../../types/command.js";
import type {
  MemberMessageConfig,
  MemberMessageCustomIds,
  MemberMessageKind,
  MemberMessagePanelSession,
  MemberMessagePanelUiState,
  MemberMessageRenderType,
} from "../../types/memberMessages.js";
import {
  MEMBER_MESSAGE_RENDER_TYPES,
  isMemberMessageRenderTypeValue,
} from "../../validators/memberMessages.js";
import type { MemberMessageService } from "./service.js";

const panelSessions = new ComponentSessionRegistry<MemberMessagePanelSession>();

const panelSessionKey = (kind: MemberMessageKind, botId: string, guildId: string, userId: string): string => {
  return `${kind}:${botId}:${guildId}:${userId}`;
};

const createCustomIds = (kind: MemberMessageKind): MemberMessageCustomIds => {
  const nonce = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

  return {
    toggleButton: `${kind}:toggle:${nonce}`,
    channelButton: `${kind}:channel:${nonce}`,
    channelCancelButton: `${kind}:channel-cancel:${nonce}`,
    typeSelect: `${kind}:type:${nonce}`,
    channelSelect: `${kind}:channel-select:${nonce}`,
    testButton: `${kind}:test:${nonce}`,
  };
};

const statusLabel = (ctx: CommandExecutionContext, enabled: boolean): string => {
  return enabled ? ctx.ct("ui.status.enabled") : ctx.ct("ui.status.disabled");
};

const messageTypeLabel = (ctx: CommandExecutionContext, messageType: MemberMessageRenderType): string => {
  return ctx.ct(`ui.type.options.${messageType}.label`);
};

const panelContent = (
  ctx: CommandExecutionContext,
  config: MemberMessageConfig,
  uiState: MemberMessagePanelUiState,
): string => {
  const channelDisplay = config.channelId ? `<#${config.channelId}>` : ctx.ct("ui.channelNotConfigured");
  const lines = [
    `## ${ctx.ct("ui.embed.title")}`,
    ctx.ct("ui.embed.description"),
    "",
    `${ctx.ct("ui.embed.fields.status")}: ${statusLabel(ctx, config.enabled)}`,
    `${ctx.ct("ui.embed.fields.channel")}: ${channelDisplay}`,
    `${ctx.ct("ui.embed.fields.type")}: ${messageTypeLabel(ctx, config.messageType)}`,
  ];

  if (uiState.channelPickerOpen) {
    lines.push("", `${ctx.ct("ui.embed.fields.channelPicker")}: ${ctx.ct("ui.channelPickerHint")}`);
  }

  return lines.join("\n");
};

const buildContainer = (
  ctx: CommandExecutionContext,
  customIds: MemberMessageCustomIds,
  config: MemberMessageConfig,
  uiState: MemberMessagePanelUiState,
  disabled = false,
): ContainerBuilder => {
  const toggleButton = new ButtonBuilder()
    .setCustomId(customIds.toggleButton)
    .setLabel(ctx.ct("ui.buttons.toggle"))
    .setStyle(config.enabled ? ButtonStyle.Success : ButtonStyle.Secondary)
    .setDisabled(disabled);

  const channelButton = new ButtonBuilder()
    .setCustomId(uiState.channelPickerOpen ? customIds.channelCancelButton : customIds.channelButton)
    .setLabel(uiState.channelPickerOpen ? ctx.ct("ui.buttons.channelCancel") : ctx.ct("ui.buttons.channel"))
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled);

  const testButton = new ButtonBuilder()
    .setCustomId(customIds.testButton)
    .setLabel(ctx.ct("ui.buttons.test"))
    .setStyle(ButtonStyle.Primary)
    .setDisabled(disabled);

  const typeSelect = new StringSelectMenuBuilder()
    .setCustomId(customIds.typeSelect)
    .setPlaceholder(ctx.ct("ui.type.placeholder"))
    .setMinValues(1)
    .setMaxValues(1)
    .setDisabled(disabled)
    .setOptions(
      MEMBER_MESSAGE_RENDER_TYPES.map((renderType) => ({
        label: ctx.ct(`ui.type.options.${renderType}.label`),
        description: ctx.ct(`ui.type.options.${renderType}.description`),
        value: renderType,
        default: renderType === config.messageType,
      })),
    );

  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(panelContent(ctx, config, uiState)),
  );
  container.addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(toggleButton, channelButton, testButton),
  );
  container.addActionRowComponents(
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(typeSelect),
  );

  if (uiState.channelPickerOpen) {
    const channelSelect = new ChannelSelectMenuBuilder()
      .setCustomId(customIds.channelSelect)
      .setPlaceholder(ctx.ct("ui.channelPickerPlaceholder"))
      .setMinValues(1)
      .setMaxValues(1)
      .setDisabled(disabled)
      .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

    container.addActionRowComponents(
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelect),
    );
  }

  return container;
};

const testFeedbackKey = (reason: string): string => {
  switch (reason) {
    case "disabled":
      return "responses.testDisabled";
    case "missing_channel":
      return "responses.testMissingChannel";
    case "channel_not_found":
    case "channel_not_sendable":
      return "responses.testChannelUnavailable";
    case "missing_permissions":
      return "responses.testMissingPermissions";
    default:
      return "responses.testFailed";
  }
};

export const createMemberMessagePanelExecute = (
  kind: MemberMessageKind,
  memberMessageService: MemberMessageService,
  panelI18n: I18nService,
) => {
  return async (ctx: CommandExecutionContext): Promise<void> => {
    if (!ctx.guild) {
      await ctx.reply(ctx.ct("responses.guildOnly"));
      return;
    }

    const guild = ctx.guild;
    const botId = memberMessageService.resolveBotId(ctx.client);
    if (!botId) {
      await ctx.reply(ctx.t("errors.execution"));
      return;
    }

    const config = await memberMessageService.getConfig(botId, guild.id, kind);
    const customIds = createCustomIds(kind);
    const uiState: MemberMessagePanelUiState = {
      channelPickerOpen: false,
    };

    const replyResult = await ctx.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [buildContainer(ctx, customIds, config, uiState)],
      withResponse: true,
    });

    const replyMessage = resolveReplyMessage(replyResult);
    if (!replyMessage) {
      return;
    }

    const ownerId = ctx.user.id;
    const sessionKey = panelSessionKey(kind, botId, guild.id, ownerId);

    const saveConfig = async (): Promise<void> => {
      await memberMessageService.saveConfig(botId, guild.id, kind, config);
    };

    const disablePanel = async (): Promise<void> => {
      await replyMessage
        .edit({
          flags: MessageFlags.IsComponentsV2,
          components: [buildContainer(ctx, customIds, config, uiState, true)],
        })
        .catch(() => undefined);
    };

    const collector = replyMessage.createMessageComponentCollector({ time: 15 * 60_000 });
    await panelSessions.replace(sessionKey, {
      collector,
      disable: disablePanel,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== ownerId) {
        await interaction.reply({
          content: ctx.ct("responses.notOwner"),
          flags: [MessageFlags.Ephemeral],
        });
        return;
      }

      try {
        if (interaction.isButton()) {
          if (interaction.customId === customIds.toggleButton) {
            config.enabled = !config.enabled;
            await saveConfig();
            await interaction.update({
              flags: MessageFlags.IsComponentsV2,
              components: [buildContainer(ctx, customIds, config, uiState)],
            });
            return;
          }

          if (interaction.customId === customIds.channelButton) {
            uiState.channelPickerOpen = true;
            await interaction.update({
              flags: MessageFlags.IsComponentsV2,
              components: [buildContainer(ctx, customIds, config, uiState)],
            });
            return;
          }

          if (interaction.customId === customIds.channelCancelButton) {
            uiState.channelPickerOpen = false;
            await interaction.update({
              flags: MessageFlags.IsComponentsV2,
              components: [buildContainer(ctx, customIds, config, uiState)],
            });
            return;
          }

          if (interaction.customId === customIds.testButton) {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            const testResult = await memberMessageService.dispatch({
              client: ctx.client,
              i18n: panelI18n,
              guild,
              user: ctx.user,
              kind,
              ignoreEnabled: true,
            });

            if (testResult.sent) {
              await interaction.editReply({
                content: ctx.ct("responses.testSuccess", {
                  channel: testResult.channelId ? `<#${testResult.channelId}>` : ctx.ct("ui.channelNotConfigured"),
                }),
              });
              return;
            }

            await interaction.editReply({
              content: ctx.ct(testFeedbackKey(testResult.reason)),
            });
            return;
          }

          await interaction.reply({
            content: ctx.ct("responses.invalidSelection"),
            flags: [MessageFlags.Ephemeral],
          });
          return;
        }

        if (interaction.isStringSelectMenu() && interaction.customId === customIds.typeSelect) {
          const nextType = interaction.values[0];
          if (!nextType || !isMemberMessageRenderTypeValue(nextType)) {
            await interaction.reply({
              content: ctx.ct("responses.invalidSelection"),
              flags: [MessageFlags.Ephemeral],
            });
            return;
          }

          config.messageType = nextType;
          await saveConfig();
          await interaction.update({
            flags: MessageFlags.IsComponentsV2,
            components: [buildContainer(ctx, customIds, config, uiState)],
          });
          return;
        }

        if (interaction.isChannelSelectMenu() && interaction.customId === customIds.channelSelect) {
          const channelId = interaction.values[0];
          if (!channelId) {
            await interaction.reply({
              content: ctx.ct("responses.invalidSelection"),
              flags: [MessageFlags.Ephemeral],
            });
            return;
          }

          config.channelId = channelId;
          uiState.channelPickerOpen = false;
          await saveConfig();
          await interaction.update({
            flags: MessageFlags.IsComponentsV2,
            components: [buildContainer(ctx, customIds, config, uiState)],
          });
          return;
        }

        await interaction.reply({
          content: ctx.ct("responses.invalidSelection"),
          flags: [MessageFlags.Ephemeral],
        });
      } catch (error) {
        console.error(`[command:${kind}] interaction failed`, error);

        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: ctx.t("errors.execution"),
            flags: [MessageFlags.Ephemeral],
          }).catch(() => undefined);
          return;
        }

        await interaction.followUp({
          content: ctx.t("errors.execution"),
          flags: [MessageFlags.Ephemeral],
        }).catch(() => undefined);
      }
    });

    collector.on("end", async () => {
      panelSessions.deleteIfCollectorMatch(sessionKey, collector);
      await disablePanel();
    });
  };
};
