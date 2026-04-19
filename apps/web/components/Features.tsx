import FeatureCard from "./FeatureCard";

export default function Features() {
  const items = [
    {
      title: "Multi-bot",
      description:
        "Gérez plusieurs bots indépendants depuis un tableau de bord unique — configurations et logs centralisés.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
          <path d="M4 7h16v10H4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 11h0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: "Gestion simple",
      description: "Démarrez, arrêtez, et configurez en quelques clics — interface claire et rapide.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 3v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: "Scalable",
      description: "Scale automatique des instances pour absorber la charge et garder la disponibilité.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <section>
      <h2 className="text-2xl font-bold text-white">Fonctionnalités principales</h2>
      <p className="mt-2 text-gray-400 max-w-2xl">Toutes les fonctionnalités essentielles pour piloter vos bots en production.</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((it, idx) => (
          <FeatureCard key={idx} title={it.title} description={it.description} icon={it.icon} />
        ))}
      </div>
    </section>
  );
}
