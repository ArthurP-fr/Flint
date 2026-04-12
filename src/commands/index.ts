import { helpCommand } from "./core/help.js";
import { kissCommand } from "./fun/kiss.js";
import { advancedCommand } from "./utility/advanced.js";
import { goodbyeCommand } from "./utility/goodbye.js";
import { presenceCommand } from "./utility/presence.js";
import { pingCommand } from "./utility/ping.js";
import { welcomeCommand } from "./utility/welcome.js";

import type { BotCommand } from "../framework/types/command.js";

export const commandList: BotCommand[] = [
  kissCommand,
  pingCommand,
  advancedCommand,
  welcomeCommand,
  goodbyeCommand,
  presenceCommand,
  helpCommand,
];
