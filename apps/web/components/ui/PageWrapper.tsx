import type { ReactNode } from "react";

import { cn } from "./cn";
import { Container } from "./Container";
import Navbar from "./Navbar";

type PagePath = "home" | "login" | "dashboard";

type PageWrapperProps = {
  children: ReactNode;
  currentPath?: PagePath;
  className?: string;
  contentClassName?: string;
  footer?: ReactNode;
};

export default async function PageWrapper({
  children,
  currentPath,
  className,
  contentClassName,
  footer,
}: PageWrapperProps) {
  return (
    <div className="relative min-h-screen overflow-x-clip text-[var(--foreground)]">
      <div aria-hidden className="ui-background" />
      <Navbar currentPath={currentPath} />

      <main className={cn("relative py-10 md:py-14", className)}>
        <Container className={cn("space-y-12", contentClassName)}>
          {children}
        </Container>
      </main>

      {footer ? (
        <div className="relative border-t border-[var(--border-subtle)]/80 bg-[var(--surface-overlay)]/35">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
