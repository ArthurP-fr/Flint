import { getT } from "../i18n/server";
import { Link } from "../i18n/navigation";
import { cn } from "./ui/cn";

export default async function Logo({ className = "" }: { className?: string }) {
  const t = await getT();

  return (
    <Link className={cn("inline-flex items-center gap-3", className)} href="/">
      <img src="/logo.svg" alt="Logo" className="h-9 w-9" />

      <span className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
        {t("common.brand")}
      </span>
    </Link>
  );
}