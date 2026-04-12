import { PermissionFlagsBits } from "discord.js";

import { defineCommand } from "../../framework/commands/defineCommand.js";
import { createMemberMessageExecute } from "./memberMessagePanel.js";

export const goodbyeCommand = defineCommand({
  meta: {
    name: "goodbye",
    category: "utility",
  },
  permissions: [PermissionFlagsBits.ManageGuild],
  examples: [
    {
      source: "slash",
      descriptionKey: "examples.slash",
    },
  ],
  execute: createMemberMessageExecute("goodbye"),
});
