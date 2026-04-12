import {
  ActivityType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  TextInputBuilder,
  TextInputStyle,
  type Client,
  type Message,
} from "discord.js";
import { defineCommand } from "../../framework/commands/defineCommand.js";
import { env } from "../../framework/config/env.js";
import { getPresenceStore } from "../../framework/presence/presenceStore.js";
import {
  PRESENCE_ACTIVITY_TYPES,
  PRESENCE_STATUSES,
  createDefaultPresenceState,
  isPresenceActivityTypeValue,
  isPresenceStatusValue,
  sanitizeActivityText,
  type PresenceActivityTypeValue,
  type PresenceState,
  type PresenceStatusValue,
} from "../../framework/presence/presenceTypes.js";
import type { CommandExecutionContext } from "../../framework/types/command.js";

interface PresenceCustomIds {
  statusSelect: string;
  activitySelect: string;
  textButton: string;
  textModal: string;
  textInput: string;
}

const DISCORD_ACTIVITY_TYPES: Record<PresenceActivityTypeValue, ActivityType> = {
  PLAYING: ActivityType.Playing,
  STREAMING: ActivityType.Streaming,
  WATCHING: ActivityType.Watching,
  LISTENING: ActivityType.Listening,
  COMPETING: ActivityType.Competing,
  CUSTOM: ActivityType.Custom,
};

type DiscordPresenceStatus = "online" | "idle" | "dnd" | "invisible";

const resolveDiscordStatus = (status: PresenceStatusValue): DiscordPresenceStatus =>
  status === "streaming" ? "online" : status;

const resolveBotId = (client: Client): string | null => client.user?.id ?? null;

const loadPresenceState = async (client: Client): Promise<PresenceState> => {
  const botId = resolveBotId(client);
  if (!botId) {
    return createDefaultPresenceState();
  }

  return getPresenceStore().getByBotId(botId);
};

const savePresenceState = async (client: Client, state: PresenceState): Promise<void> => {
  const botId = resolveBotId(client);
  if (!botId) {
    return;
  }

  await getPresenceStore().upsertByBotId(botId, state);
};

const applyPresenceState = (client: Client, state: PresenceState): void => {
  if (!client.user) {
    return;
  }

  const status = resolveDiscordStatus(state.status);
  const text = sanitizeActivityText(state.activity.text);
  if (state.status === "streaming" || state.activity.type === "STREAMING") {
    client.user.setPresence({
      status,
      activities: [
        {
          type: ActivityType.Streaming,
          name: text,
          url: env.PRESENCE_STREAM_URL,
        },
      ],
    });
    return;
  }

  if (state.activity.type === "CUSTOM") {
    client.user.setPresence({
      status,
      activities: [
        {
          type: ActivityType.Custom,
          name: "Custom Status",
          state: text,
        },
      ],
    });
    return;
  }

  client.user.setPresence({
    status,
    activities: [
      {
        type: DISCORD_ACTIVITY_TYPES[state.activity.type],
        name: text,
      },
    ],
  });
};

const createCustomIds = (): PresenceCustomIds => {
  const nonce = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    statusSelect: `presence:status:${nonce}`,
    activitySelect: `presence:activity:${nonce}`,
    textButton: `presence:text:${nonce}`,
    textModal: `presence:modal:${nonce}`,
    textInput: `presence:text-input:${nonce}`,
  };
};

const statusLabel = (ctx: CommandExecutionContext, status: PresenceStatusValue): string =>
  ctx.ct(`ui.status.options.${status}.label`);

const activityLabel = (ctx: CommandExecutionContext, activityType: PresenceActivityTypeValue): string =>
  ctx.ct(`ui.activity.options.${activityType}.label`);

const panelContent = (ctx: CommandExecutionContext, state: PresenceState): string => {
  const summary = ctx.ct("responses.panel", {
    status: statusLabel(ctx, state.status),
    activityType: activityLabel(ctx, state.activity.type),
    activityText: sanitizeActivityText(state.activity.text),
  });

  return `## ${ctx.ct("ui.embed.title")}\n${ctx.ct("ui.embed.description")}\n\n${summary}`;
};

const buildContainer = (
  ctx: CommandExecutionContext,
  state: PresenceState,
  customIds: PresenceCustomIds,
  disabled = false,
): ContainerBuilder => {
  const statusSelect = new StringSelectMenuBuilder()
    .setCustomId(customIds.statusSelect)
    .setPlaceholder(ctx.ct("ui.status.placeholder"))
    .setMinValues(1)
    .setMaxValues(1)
    .setDisabled(disabled)
    .setOptions(
      PRESENCE_STATUSES.map((status) => ({
        label: statusLabel(ctx, status),
        description: ctx.ct(`ui.status.options.${status}.description`),
        value: status,
        default: status === state.status,
      })),
    );

  const activitySelect = new StringSelectMenuBuilder()
    .setCustomId(customIds.activitySelect)
    .setPlaceholder(ctx.ct("ui.activity.placeholder"))
    .setMinValues(1)
    .setMaxValues(1)
    .setDisabled(disabled)
    .setOptions(
      PRESENCE_ACTIVITY_TYPES.map((activityType) => ({
        label: activityLabel(ctx, activityType),
        description: ctx.ct(`ui.activity.options.${activityType}.description`),
        value: activityType,
        default: activityType === state.activity.type,
      })),
    );

  const textButton = new ButtonBuilder()
    .setCustomId(customIds.textButton)
    .setLabel(ctx.ct("ui.textButton"))
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled);

  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(panelContent(ctx, state)),
  );

  container.addActionRowComponents(
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(statusSelect),
  );
  container.addActionRowComponents(
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(activitySelect),
  );
  container.addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(textButton),
  );

  return container;
};

const isMessageResult = (value: unknown): value is Message => {
  if (!value || typeof value !== "object") {
    return false;
  }

  return "createMessageComponentCollector" in value && "edit" in value;
};

const persistAndApplyPresence = async (ctx: CommandExecutionContext, state: PresenceState): Promise<void> => {
  applyPresenceState(ctx.client, state);
  await savePresenceState(ctx.client, state);
};

export const restorePresenceFromStorage = async (client: Client): Promise<void> => {
  const state = await loadPresenceState(client);
  applyPresenceState(client, state);
};

export const presenceCommand = defineCommand({
  meta: {
    name: "presence",
    category: "utility",
  },
  examples: [
    {
      source: "slash",
      descriptionKey: "examples.slash",
    },
  ],
  execute: async (ctx) => {
    const state = await loadPresenceState(ctx.client);
    applyPresenceState(ctx.client, state);

    const customIds = createCustomIds();

    const replyResult = await ctx.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [buildContainer(ctx, state, customIds)],
      fetchReply: true,
    });

    if (!isMessageResult(replyResult)) {
      return;
    }

    const ownerId = ctx.user.id;
    const collector = replyResult.createMessageComponentCollector({ time: 15 * 60_000 });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== ownerId) {
        await interaction.reply({
          content: ctx.ct("responses.notOwner"),
          ephemeral: true,
        });
        return;
      }

      try {
        if (interaction.isStringSelectMenu()) {
          if (interaction.customId === customIds.statusSelect) {
            const nextStatus = interaction.values[0];
            if (!nextStatus || !isPresenceStatusValue(nextStatus)) {
              await interaction.reply({ content: ctx.ct("responses.invalidSelection"), ephemeral: true });
              return;
            }

            state.status = nextStatus;
            await persistAndApplyPresence(ctx, state);
            await interaction.update({
              flags: MessageFlags.IsComponentsV2,
              components: [buildContainer(ctx, state, customIds)],
            });
            return;
          }

          if (interaction.customId === customIds.activitySelect) {
            const nextType = interaction.values[0];
            if (!nextType || !isPresenceActivityTypeValue(nextType)) {
              await interaction.reply({ content: ctx.ct("responses.invalidSelection"), ephemeral: true });
              return;
            }

            state.activity.type = nextType;
            await persistAndApplyPresence(ctx, state);
            await interaction.update({
              flags: MessageFlags.IsComponentsV2,
              components: [buildContainer(ctx, state, customIds)],
            });
            return;
          }

          await interaction.reply({ content: ctx.ct("responses.invalidSelection"), ephemeral: true });
          return;
        }

        if (interaction.isButton()) {
          if (interaction.customId !== customIds.textButton) {
            await interaction.reply({ content: ctx.ct("responses.invalidSelection"), ephemeral: true });
            return;
          }

          const modal = new ModalBuilder()
            .setCustomId(customIds.textModal)
            .setTitle(ctx.ct("ui.modal.title"))
            .addComponents(
              new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                  .setCustomId(customIds.textInput)
                  .setLabel(ctx.ct("ui.modal.label"))
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder(ctx.ct("ui.modal.placeholder"))
                  .setRequired(true)
                  .setMaxLength(128)
                  .setValue(sanitizeActivityText(state.activity.text)),
              ),
            );

          await interaction.showModal(modal);

          try {
            const submitted = await interaction.awaitModalSubmit({
              time: 120_000,
              filter: (modalInteraction) =>
                modalInteraction.customId === customIds.textModal
                && modalInteraction.user.id === ownerId,
            });

            const nextText = sanitizeActivityText(submitted.fields.getTextInputValue(customIds.textInput));
            state.activity.text = nextText;
            await persistAndApplyPresence(ctx, state);

            await submitted.deferUpdate();

            await replyResult.edit({
              flags: MessageFlags.IsComponentsV2,
              components: [buildContainer(ctx, state, customIds)],
            });
          } catch {
            await interaction.followUp({
              content: ctx.ct("responses.modalTimeout"),
              ephemeral: true,
            }).catch(() => undefined);
          }

          return;
        }

        await interaction.reply({ content: ctx.ct("responses.invalidSelection"), ephemeral: true });
      } catch (error) {
        console.error("[command:presence] interaction failed", error);
        const fallback = ctx.t("errors.execution");

        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: fallback, ephemeral: true }).catch(() => undefined);
          return;
        }

        await interaction.followUp({ content: fallback, ephemeral: true }).catch(() => undefined);
      }
    });

    collector.on("end", async () => {
      await replyResult
        .edit({
          flags: MessageFlags.IsComponentsV2,
          components: [buildContainer(ctx, state, customIds, true)],
        })
        .catch(() => undefined);
    });
  },
});
