import { defineCommand } from "../core/commands/defineCommand.js";
import { createPresenceCommandExecute } from "../features/presence/commandPanel.js";
import type { PresenceService } from "../features/presence/service.js";

export const createPresenceCommand = (presenceService: PresenceService) => defineCommand({
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
  execute: createPresenceCommandExecute(presenceService),
});
