import { PermissionFlagsBits } from "discord.js";

import { defineCommand } from "../../framework/commands/defineCommand.js";
import { createMemberMessageExecute } from "./memberMessagePanel.js";

export const welcomeCommand = defineCommand({
  meta: {
    name: "welcome",
    category: "utility",
  },
  permissions: [PermissionFlagsBits.ManageGuild],
  examples: [
    {
      source: "slash",
      descriptionKey: "examples.slash",
    },
  ],
  execute: createMemberMessageExecute("welcome"),
});
