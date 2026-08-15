export default function ApertureSpinner({ className = "" }) {
  const bladeCount = 10;
  const blades = Array.from({ length: bladeCount }, (_, i) => {
    const angle = (i / bladeCount) * 360;
    return (
      <g key={i} style={{ transform: `rotate(${angle}deg)`, transformOrigin: "210px 210px" }}>
        <path
          d="M210 210 L210 54 Q210 40 224 44 L268 58 Q280 62 274 74 Z"
          fill={i % 2 === 0 ? "var(--gold)" : "var(--gold-bright)"}
          opacity="0.92"
        />
      </g>
    );
  });

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 420 420" className="w-full h-full aperture-spin" style={{ maxWidth: 380 }}>
        <defs>
          <radialGradient id="lensGlow" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="var(--gold-bright)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--gold-bright)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="210" cy="210" r="204" fill="url(#lensGlow)" />
        <circle cx="210" cy="210" r="190" fill="none" stroke="var(--line)" strokeWidth="1" />
        <circle cx="210" cy="210" r="150" fill="none" stroke="var(--line)" strokeWidth="1" />

        {/* outer barrel ring, ticks like a real lens */}
        <g opacity="0.55">
          {Array.from({ length: 36 }, (_, i) => {
            const a = (i / 36) * 2 * Math.PI;
            const r1 = 190,
              r2 = i % 3 === 0 ? 178 : 184;
            return (
              <line
                key={i}
                x1={210 + r1 * Math.cos(a)}
                y1={210 + r1 * Math.sin(a)}
                x2={210 + r2 * Math.cos(a)}
                y2={210 + r2 * Math.sin(a)}
                stroke="var(--stone-dim)"
                strokeWidth="1"
              />
            );
          })}
        </g>

        {/* spinning aperture blades */}
        <g className="aperture-blades">{blades}</g>

        {/* center glass */}
        <circle cx="210" cy="210" r="58" fill="var(--bg)" stroke="var(--gold-bright)" strokeWidth="1.5" />
        <circle cx="210" cy="210" r="58" fill="none" stroke="var(--gold-bright)" strokeWidth="1.5" opacity="0.4" />
        <circle cx="195" cy="196" r="14" fill="var(--gold-bright)" opacity="0.18" />
      </svg>
    </div>
  );
}
