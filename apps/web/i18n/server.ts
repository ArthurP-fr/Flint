import { getTranslations } from "next-intl/server";

export async function getT() {
  return getTranslations();
}