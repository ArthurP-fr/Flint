/**
 * Commande `welcome` (utility)
 *
 * Wrapper léger qui utilise la factory `createMemberMessageExecute` pour
 * afficher un panneau de configuration des messages d'accueil.
 */
import { PermissionFlagsBits } from "discord.js";

import { defineCommand } from "../core/commands/defineCommand.js";
import { createMemberMessagePanelExecute } from "../features/memberMessages/commandPanel.js";
import type { MemberMessageService } from "../features/memberMessages/service.js";
import type { I18nService } from "../i18n/index.js";

/** Commande `welcome` — ouvre le panneau de configuration des messages 'welcome'. */
export const createWelcomeCommand = (memberMessageService: MemberMessageService, i18n: I18nService) => defineCommand({
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
  execute: createMemberMessagePanelExecute("welcome", memberMessageService, i18n),
});
