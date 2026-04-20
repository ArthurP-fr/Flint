import { getT } from "../../../i18n/server";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default async function LoginPage() {
  const t = await getT();

  return (
    <main className="page-shell">
      <section className="panel panel-login reveal-up">
        <p className="eyebrow">{t("login.eyebrow")}</p>
        <h1>{t("login.title")}</h1>
        <p>{t("login.description")}</p>
        <a className="button-primary" href={`${apiBaseUrl}/auth/discord/login`}>
          {t("login.cta")}
        </a>
      </section>
    </main>
  );
}
