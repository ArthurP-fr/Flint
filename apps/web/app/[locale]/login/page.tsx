import { getT } from "../../../i18n/server";
import { Badge } from "../../../components/ui/Badge";
import { buttonClassName } from "../../../components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/Card";
import PageWrapper from "../../../components/ui/PageWrapper";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default async function LoginPage() {
  const t = await getT();

  return (
    <PageWrapper contentClassName="space-y-8" currentPath="login">
      <section className="mx-auto w-full max-w-xl reveal-up">
        <Card>
          <CardHeader className="space-y-3">
            <Badge className="w-fit" variant="accent">
              {t("login.eyebrow")}
            </Badge>
            <CardTitle>{t("login.title")}</CardTitle>
            <CardDescription>{t("login.description")}</CardDescription>
          </CardHeader>

          <CardContent>
            <a
              className={buttonClassName({
                fullWidth: true,
                size: "lg",
                variant: "primary",
              })}
              href={`${apiBaseUrl}/auth/discord/login`}
            >
              {t("login.cta")}
            </a>
          </CardContent>
        </Card>
      </section>
    </PageWrapper>
  );
}
