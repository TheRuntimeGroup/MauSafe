import { cn } from "@/lib/utils";

export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label="A journey check-in card with a protective shield, a map pin and a 999 emergency button"
    >
      {/* backdrop */}
      <rect x="16" y="16" width="488" height="368" rx="34" fill="#F6F1FF" />
      <circle cx="448" cy="76" r="42" fill="#FDE68A" />
      <circle cx="448" cy="76" r="56" fill="none" stroke="#FDE68A" strokeWidth="2" opacity="0.55" />

      {/* decorative dots */}
      <circle cx="80" cy="120" r="6" fill="#C4B5FD" opacity="0.6" />
      <circle cx="402" cy="298" r="5" fill="#FBCFE8" />
      <circle cx="500" cy="216" r="6" fill="#A7F3D0" opacity="0.7" />
      <circle cx="60" cy="252" r="4" fill="#FDE68A" />

      {/* 999 emergency pill */}
      <rect x="46" y="150" width="80" height="36" rx="18" fill="#EF4444" />
      <text
        x="86"
        y="174"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="17"
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
      >
        999
      </text>

      {/* map pin + route */}
      <path
        d="M96 316 c-14 0 -24 9 -24 20 c0 15 24 32 24 32 s24 -17 24 -32 c0 -11 -10 -20 -24 -20Z"
        fill="#7C3AED"
      />
      <circle cx="96" cy="336" r="8" fill="#FFFFFF" />
      <path
        d="M118 318 C 150 300, 148 268, 168 252"
        stroke="#C4B5FD"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="0.5 14"
      />

      {/* card shadow + card */}
      <rect x="140" y="104" width="256" height="180" rx="24" fill="#EDE7FE" opacity="0.55" />
      <rect x="134" y="98" width="256" height="180" rx="24" fill="#FFFFFF" stroke="#E9E2FB" strokeWidth="1.5" />

      {/* card header */}
      <rect x="154" y="120" width="36" height="36" rx="12" fill="#EDE9FE" />
      <path
        d="M164 138 l6 6 12 -12"
        stroke="#7C3AED"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="204" y="126" width="110" height="10" rx="5" fill="#E5E7EB" />
      <rect x="204" y="144" width="76" height="10" rx="5" fill="#EFEFF4" />

      {/* status pill */}
      <rect x="318" y="118" width="58" height="24" rx="12" fill="#D1FAE5" />
      <path d="M329 131 l5 5 9 -10" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* progress route */}
      <path d="M158 182 L356 182" stroke="#C4B5FD" strokeWidth="5" strokeLinecap="round" strokeDasharray="0.5 14" />
      <circle cx="158" cy="182" r="7" fill="#7C3AED" />
      <circle cx="158" cy="182" r="2.5" fill="#FFFFFF" />
      <circle cx="356" cy="182" r="7" fill="#10B981" />
      <path d="M352.5 182 l2.5 2.5 4.5 -5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* ETA row */}
      <circle cx="176" cy="226" r="14" fill="#EDE9FE" />
      <path
        d="M176 219 v7 l5 3"
        stroke="#7C3AED"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="204" y="218" width="58" height="8" rx="4" fill="#E5E7EB" />
      <rect x="204" y="232" width="36" height="8" rx="4" fill="#EFEFF4" />

      {/* shield badge */}
      <path
        d="M338 216 l12 5.5 v9 c0 7 -5.5 12 -12 14.5 c-6.5 -2.5 -12 -7.5 -12 -14.5 v-9 l12 -5.5Z"
        fill="#6D28D9"
      />
      <path d="M333 229 l4 4 7.5 -7.5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
