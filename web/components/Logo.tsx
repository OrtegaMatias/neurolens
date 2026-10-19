// Logo propio: un cerebro estilizado dentro de un lente, con una línea de escaneo.
export function Logo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Logo de NeuroLens" fill="none">
      <defs>
        <linearGradient id="nl-anillo" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67e8f9" />
          <stop offset="1" stopColor="#2dd4bf" />
        </linearGradient>
        <radialGradient id="nl-fondo" cx="0" cy="0" r="1" gradientTransform="translate(21 20) rotate(90) scale(18)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" stopOpacity="0.28" />
          <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
        <clipPath id="nl-lente">
          <circle cx="21" cy="21" r="14" />
        </clipPath>
      </defs>

      {/* Lente */}
      <circle cx="21" cy="21" r="16" fill="url(#nl-fondo)" />
      <circle cx="21" cy="21" r="16" stroke="url(#nl-anillo)" strokeWidth="2.5" />
      {/* Mango del lente */}
      <path d="M33 33l9 9" stroke="url(#nl-anillo)" strokeWidth="4" strokeLinecap="round" />

      {/* Cerebro: dos hemisferios con circunvoluciones */}
      <g stroke="#e0f2fe" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" clipPath="url(#nl-lente)">
        <path d="M20 11.5c-1.9-1.6-5.2-.7-5.7 1.7-2.2.2-3.5 2.6-2.4 4.5-1.6 1.2-1.6 3.7 0 4.9-.9 2 .6 4.3 2.8 4.3.6 2 3.1 2.8 4.8 1.5.2 0 .5-.3.5-.6V11.5z" />
        <path d="M22 11.5c1.9-1.6 5.2-.7 5.7 1.7 2.2.2 3.5 2.6 2.4 4.5 1.6 1.2 1.6 3.7 0 4.9.9 2-.6 4.3-2.8 4.3-.6 2-3.1 2.8-4.8 1.5-.2 0-.5-.3-.5-.6V11.5z" />
        <path d="M15.6 17.4c1.3-.2 2.4.4 2.9 1.4M15 22.6c1.3.4 2.6 0 3.3-1M27 17.4c-1.3-.2-2.4.4-2.9 1.4M27.4 22.6c-1.3.4-2.6 0-3.3-1" opacity="0.8" />
      </g>

      {/* Línea de escaneo */}
      <path d="M8.5 24.5h25" stroke="#22d3ee" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
      <circle cx="33.5" cy="24.5" r="1.4" fill="#a5f3fc" />
    </svg>
  );
}
