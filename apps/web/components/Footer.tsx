import { getT } from "../i18n/server";

export default async function Footer() {
  const t = await getT();

  return (
    <footer className="mt-20 border-t border-white/6 bg-gradient-to-t from-black/0 to-black/30">
      <div className="container mx-auto px-6 py-8 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Copyright {new Date().getFullYear()} Shadow - {t("footer.tagline")}
        </div>
        <div className="text-sm text-gray-400">
          <a href="https://github.com/" target="_blank" rel="noreferrer" className="hover:text-white transition">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
