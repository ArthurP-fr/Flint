import "next-intl";

import enMessages from "../messages/en.json";

import { routing } from "./routing";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof enMessages;
  }
}