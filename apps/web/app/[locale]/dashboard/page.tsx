import { DashboardClient } from "../../../components/dashboard-client";
import PageWrapper from "../../../components/ui/PageWrapper";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <PageWrapper contentClassName="space-y-8" currentPath="dashboard">
      <section className="reveal-up">
        <DashboardClient apiBaseUrl={apiBaseUrl} />
      </section>
    </PageWrapper>
  );
}
