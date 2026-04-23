"use client";

import type { ButtonHTMLAttributes, MouseEvent } from "react";

import { cn } from "./cn";

type SwitchSize = "sm" | "md";

type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  checked: boolean;
  onCheckedChange?: (nextChecked: boolean) => void;
  size?: SwitchSize;
};

const switchSizeStyles: Record<SwitchSize, string> = {
  sm: "h-5 w-9",
  md: "h-6 w-11",
};

const thumbSizeStyles: Record<SwitchSize, string> = {
  sm: "size-4",
  md: "size-5",
};

export function Switch({
  checked,
  onCheckedChange,
  className,
  disabled,
  onClick,
  size = "md",
  ...props
}: SwitchProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);

    if (event.defaultPrevented || disabled) {
      return;
    }

    onCheckedChange?.(!checked);
  };

  return (
    <button
      aria-checked={checked}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-50",
        switchSizeStyles[size],
        checked ? "bg-[var(--primary)]" : "bg-[var(--surface-strong)]",
        className,
      )}
      disabled={disabled}
      onClick={handleClick}
      role="switch"
      type="button"
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none inline-block rounded-full bg-white shadow-sm transition-transform",
          thumbSizeStyles[size],
          checked
            ? size === "sm"
              ? "translate-x-4"
              : "translate-x-5"
            : "translate-x-0.5",
        )}
      />
    </button>
  );
}
