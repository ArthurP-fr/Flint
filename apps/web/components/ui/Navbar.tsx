import { Link } from "../../i18n/navigation";
import { getT } from "../../i18n/server";
import LanguageSwitcher from "../LanguageSwitcher";
import Logo from "../Logo";

import { buttonClassName } from "./Button";
import { Container } from "./Container";

type NavbarPath = "home" | "login" | "dashboard";

type NavbarProps = {
  currentPath?: NavbarPath | undefined;
};

export default async function Navbar({ currentPath }: NavbarProps) {
  const t = await getT();

  const links: Array<{
    href: "/" | "/dashboard";
    key: NavbarPath;
    label: string;
  }> = [
    { href: "/", key: "home", label: t("nav.home") },
    { href: "/dashboard", key: "dashboard", label: t("nav.dashboard") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)]/80 bg-[var(--surface-overlay)]/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((item) => {
              const isActive = item.key === currentPath;

              return (
                <Link
                  className={buttonClassName({
                    variant: isActive ? "secondary" : "ghost",
                    size: "sm",
                  })}
                  href={item.href}
                  key={item.key}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            className={buttonClassName({
              variant: currentPath === "login" ? "secondary" : "primary",
              size: "sm",
            })}
            href="/login"
          >
            {t("nav.login")}
          </Link>

          <LanguageSwitcher />
        </div>
      </Container>
    </header>
  );
}
