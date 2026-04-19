import { ReactNode } from "react";

export default function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="p-6 bg-gray-900/40 rounded-xl border border-white/6 hover:shadow-lg transition">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-white/5 rounded-md text-white flex items-center justify-center">
          {icon}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm text-gray-300">{description}</p>
        </div>
      </div>
    </div>
  );
}
