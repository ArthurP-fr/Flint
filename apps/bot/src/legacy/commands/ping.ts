/**
 * Commande `ping` (utility)
 *
 * Répond avec un message court contenant la latence websocket du bot.
 */
import { MessageFlags } from "discord.js";
import { defineCommand } from "../core/commands/defineCommand.js";

/** Commande `ping` — affiche la latence du bot. */
export const pingCommand = defineCommand({
  meta: {
    name: "ping",
    category: "utility",
  },
  cooldown: 5,
  examples: [
    {
      descriptionKey: "examples.basic",
    },
  ],
  execute: async (ctx) => {
    await ctx.reply({
      content: ctx.ct("responses.pong", {
        latency: ctx.client.ws.ping,
      }),
      flags: [MessageFlags.Ephemeral],
    });
  },
});
