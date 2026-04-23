import { Link } from "../i18n/navigation";
import { getT } from "../i18n/server";

import { Badge } from "./ui/Badge";
import { buttonClassName } from "./ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/Card";

export default async function Hero() {
  const t = await getT();

  const bots = [
    { name: t("hero.bots.moderation"), status: "online" as const },
    { name: t("hero.bots.welcome"), status: "stopped" as const },
    { name: t("hero.bots.analytics"), status: "online" as const },
  ];

  return (
    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <div className="reveal-up space-y-6">
        <p className="section-kicker">{t("hero.kicker")}</p>
        <h1 className="section-title">{t("hero.title")}</h1>
        <p className="section-description text-base md:text-lg">
          {t("hero.description")}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            className={buttonClassName({ size: "lg", variant: "primary" })}
            href="/login"
          >
            {t("hero.ctaStart")}
          </Link>

          <Link
            className={buttonClassName({ size: "lg", variant: "secondary" })}
            href="/login"
          >
            {t("hero.ctaLogin")}
          </Link>
        </div>
      </div>

      <Card className="reveal-up lg:mt-2">
        <CardHeader className="space-y-3">
          <Badge className="w-fit" variant="accent">
            {t("hero.card.preview")}
          </Badge>
          <CardTitle className="text-lg">{t("hero.card.title")}</CardTitle>
          <CardDescription>{t("hero.card.subtitle")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {bots.map((bot) => (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-muted)] bg-[var(--surface-subtle)] p-3"
              key={bot.name}
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {bot.name}
                </p>
                <p className="text-xs text-[var(--foreground-muted)]">
                  {t("hero.card.instanceMetrics")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={bot.status === "online" ? "success" : "neutral"}
                >
                  {bot.status === "online"
                    ? t("hero.status.online")
                    : t("hero.status.stopped")}
                </Badge>
                <button
                  className={buttonClassName({ size: "sm", variant: "ghost" })}
                  type="button"
                >
                  {t("hero.card.manage")}
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
