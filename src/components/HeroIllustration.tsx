import { cn } from "@/lib/utils";

export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label="A dotted journey path from a pin to a protective shield"
    >
      <rect x="16" y="16" width="448" height="288" rx="28" fill="#F5F3FF" />
      <circle cx="392" cy="92" r="46" fill="#FDE68A" opacity="0.35" />
      <circle cx="392" cy="92" r="30" fill="#FDE68A" />

      <path
        d="M132 226 C 210 214, 250 156, 322 124"
        stroke="#C4B5FD"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="0.5 18"
      />

      {/* start pin */}
      <path
        d="M132 212 c-12 0 -21 8 -21 18 c0 13 21 28 21 28 s21 -15 21 -28 c0 -10 -9 -18 -21 -18Z"
        fill="#7C3AED"
      />
      <circle cx="132" cy="230" r="7" fill="white" />

      {/* protective shield with check */}
      <path
        d="M322 102 l20 9 v16 c0 12 -9 20 -20 25 c-11 -5 -20 -13 -20 -25 v-16 l20 -9Z"
        fill="#6D28D9"
      />
      <path
        d="M314 127 l6 6 11 -11"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* soft decorative dots */}
      <circle cx="80" cy="108" r="5" fill="#C4B5FD" />
      <circle cx="356" cy="206" r="6" fill="#A7F3D0" />
      <circle cx="230" cy="80" r="4" fill="#FBCFE8" />
      <circle cx="416" cy="250" r="5" fill="#C4B5FD" />
    </svg>
  );
}
