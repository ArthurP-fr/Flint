import { Events, type Client, type ChatInputCommandInteraction } from "discord.js";

/**
 * Enregistre le listener `interactionCreate` pour les commandes slash (chat input).
 *
 * @param client - instance du Client Discord
 * @param onSlashInteraction - fonction à appeler pour traiter les interactions slash
 */
export const registerInteractionCreate = (
  client: Client,
  onSlashInteraction: (interaction: ChatInputCommandInteraction) => Promise<void>,
): void => {
  client.on(Events.InteractionCreate, (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    void onSlashInteraction(interaction).catch((error) => {
      console.error("[event:interactionCreate] handler failed", error);
    });
  });
};
