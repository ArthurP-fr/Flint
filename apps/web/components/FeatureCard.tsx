import { ReactNode } from "react";

import { Card, CardContent } from "./ui/Card";

export default function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Card className="h-full border-[var(--border-muted)] bg-[var(--surface)]">
      <CardContent className="flex h-full items-start gap-4">
        <div className="flex size-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[var(--foreground)]">
          {icon}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            {title}
          </h3>
          <p className="text-sm text-[var(--foreground-muted)]">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
