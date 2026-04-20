import { getT } from "../i18n/server";

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
    <section>
      <h2 className="text-2xl font-bold text-white">{t("howItWorks.title")}</h2>
      <p className="mt-2 text-gray-400 max-w-2xl">{t("howItWorks.subtitle")}</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((s, i) => (
          <div key={i} className="p-6 bg-gray-900/30 rounded-xl border border-white/6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 text-white font-semibold">{i + 1}</div>
              <div>
                <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-300">{s.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
