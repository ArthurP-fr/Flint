import { getT } from "../i18n/server";

import { Badge } from "./ui/Badge";
import { Card, CardContent } from "./ui/Card";

export default async function HowItWorks() {
  const t = await getT();

  const steps = [
    {
      title: t("howItWorks.steps.addBot.title"),
      desc: t("howItWorks.steps.addBot.description"),
    },
    {
      title: t("howItWorks.steps.dashboard.title"),
      desc: t("howItWorks.steps.dashboard.description"),
    },
    {
      title: t("howItWorks.steps.realtime.title"),
      desc: t("howItWorks.steps.realtime.description"),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <h2>{t("howItWorks.title")}</h2>
        <p className="section-description">{t("howItWorks.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <Card className="h-full border-[var(--border-muted)]" key={i}>
            <CardContent className="space-y-3">
              <Badge className="w-fit" variant="accent">
                {`${i + 1}`}
              </Badge>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  {s.title}
                </h3>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {s.desc}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
