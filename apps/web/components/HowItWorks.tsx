export default function HowItWorks() {
  const steps = [
    {
      title: "Ajouter un bot",
      desc: "Connectez votre application Discord via OAuth et enregistrez-la dans Shadow.",
    },
    {
      title: "Gérer depuis le dashboard",
      desc: "Accédez aux commandes, aux logs et aux paramètres depuis une interface centralisée.",
    },
    {
      title: "Contrôler en temps réel",
      desc: "Démarrez, arrêtez et scalez vos bots instantanément selon la demande.",
    },
  ];

  return (
    <section>
      <h2 className="text-2xl font-bold text-white">Comment ça marche</h2>
      <p className="mt-2 text-gray-400 max-w-2xl">Trois étapes simples pour prendre le contrôle de vos bots.</p>

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
