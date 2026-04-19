import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-3 ${className}`}>
      <svg viewBox="0 0 48 48" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <linearGradient id="shadow-gradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="10" fill="url(#shadow-gradient)" />
        <path d="M14 32c6-6 10-10 20-12" stroke="rgba(255,255,255,0.95)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <span className="text-white font-semibold tracking-tight text-lg">Shadow</span>
    </Link>
  );
}
