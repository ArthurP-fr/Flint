/**
 * Commande `goodbye` (utility)
 *
 * Wrapper léger qui utilise la factory `createMemberMessageExecute` pour
 * afficher un panneau de configuration des messages d'au revoir.
 */
import { PermissionFlagsBits } from "discord.js";

import { defineCommand } from "../core/commands/defineCommand.js";
import { createMemberMessagePanelExecute } from "../features/memberMessages/commandPanel.js";
import type { MemberMessageService } from "../features/memberMessages/service.js";
import type { I18nService } from "../i18n/index.js";

/** Commande `goodbye` — ouvre le panneau de configuration des messages 'goodbye'. */
export const createGoodbyeCommand = (memberMessageService: MemberMessageService, i18n: I18nService) => defineCommand({
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
  execute: createMemberMessagePanelExecute("goodbye", memberMessageService, i18n),
});
