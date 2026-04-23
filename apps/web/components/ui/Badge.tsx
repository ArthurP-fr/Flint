import type { HTMLAttributes } from "react";

import { cn } from "./cn";

type BadgeVariant = "neutral" | "accent" | "success" | "warning" | "danger";

const variantStyles: Record<BadgeVariant, string> = {
  neutral:
    "border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[var(--foreground-muted)]",
  accent:
    "border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]",
  success:
    "border-[color:color-mix(in_srgb,#34d399_45%,transparent)] bg-[color:color-mix(in_srgb,#34d399_16%,transparent)] text-[#34d399]",
  warning:
    "border-[color:color-mix(in_srgb,#fbbf24_45%,transparent)] bg-[color:color-mix(in_srgb,#fbbf24_16%,transparent)] text-[#fbbf24]",
  danger:
    "border-[color:color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--danger)_16%,transparent)] text-[var(--danger)]",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({
  className,
  variant = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
