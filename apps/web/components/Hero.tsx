import Link from "next/link";
import Logo from "./Logo";

export default function Hero() {
  const bots = [
    { name: "Moderation", status: "online" },
    { name: "Welcome", status: "stopped" },
    { name: "Analytics", status: "online" },
  ];

  return (
    <section className="relative z-10">
      <header className="flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">Se connecter</Link>
        </nav>
      </header>

      <div className="mt-12 lg:flex lg:items-center lg:justify-between">
        <div className="lg:w-7/12">
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight text-white">
            Shadow — Gérez vos bots Discord simplement
          </h1>

          <p className="mt-4 text-lg text-gray-300 max-w-2xl">
            Centralisez, déployez et contrôlez tous vos bots depuis un tableau de bord moderne. Démarrez,
            stoppez et scalez en temps réel, en toute simplicité.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <Link href="/dashboard" className="inline-flex items-center gap-3 px-5 py-3 bg-white text-black rounded-md shadow hover:scale-[1.02] transition transform">
              Accéder au dashboard
            </Link>

            <Link href="/login" className="inline-flex items-center gap-2 px-4 py-3 border border-gray-700 text-gray-200 rounded-md hover:bg-gray-800 transition">
              Se connecter
            </Link>
          </div>
        </div>

        <div className="mt-10 lg:mt-0 lg:w-5/12">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-xl ring-1 ring-white/5">
            <div className="space-y-4">
              {bots.map((b, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-900/40 p-3 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-white">{b.name}</div>
                    <div className="text-xs text-gray-400">Instances: 1 · CPU 35%</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${b.status === "online" ? "bg-green-500/20 text-green-300" : "bg-gray-700 text-gray-300"}`}>
                      {b.status === "online" ? "Online" : "Stopped"}
                    </span>
                    <button className="px-3 py-1 bg-white/10 text-sm rounded-md hover:bg-white/20 transition">Manage</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-xs text-gray-400">Aperçu en temps réel du statut de vos bots</div>
          </div>
        </div>
      </div>
    </section>
  );
}
