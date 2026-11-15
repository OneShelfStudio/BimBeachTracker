export default function BarbadosFlag({ className = "w-3.5 h-2.5" }: { className?: string }) {
  return (
    <span
      className={`${className} rounded-xs overflow-hidden inline-flex items-center justify-center shrink-0 border border-white/20 shadow-xs`}
      aria-label="Barbados Flag"
    >
      <svg viewBox="0 0 600 400" className="w-full h-full">
        <rect width="200" height="400" fill="#00267F" />
        <rect x="200" width="200" height="400" fill="#FFC72C" />
        <rect x="400" width="200" height="400" fill="#00267F" />
        <path
          d="M300 120 v160 M265 160 c0 45 70 45 70 0 M245 160 l20 40 M355 160 l-20 40 M300 100 l-12 25 h24 z M245 145 l-10 20 h20 z M355 145 l-10 20 h20 z"
          stroke="#000"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#000"
        />
      </svg>
    </span>
  );
}
