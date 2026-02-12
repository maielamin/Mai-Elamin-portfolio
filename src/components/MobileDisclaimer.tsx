import React from 'react';

/**
 * Full-screen overlay on mobile: asks user to view on desktop for best experience.
 * Uses same typefaces as main UI (Noto Serif Display for heading, Inter/sans for description).
 * Critical styles inlined so the message is never blank even if Tailwind or fonts fail.
 */
const MobileDisclaimer: React.FC = () => (
  <div
    className="fixed inset-0 flex flex-col items-center justify-center px-6 text-center font-noto-condensed"
    style={{
      touchAction: 'none',
      zIndex: 99999,
      background: 'rgba(0,0,0,0.85)',
      minHeight: '100dvh',
    }}
  >
    <div className="max-w-md space-y-5" style={{ color: '#fff' }}>
      <h1
        className="font-noto-condensed text-2xl sm:text-4xl md:text-5xl tracking-tight leading-tight select-none"
        style={{ fontFamily: "'Noto Serif Display', serif", letterSpacing: '-0.05em' }}
      >
        Best viewed on desktop
      </h1>
      <p
        className="text-sm sm:text-base font-light leading-relaxed select-none"
        style={{
          fontFamily: "'Inter', sans-serif",
          color: 'rgba(255,255,255,0.9)',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        }}
      >
        This portfolio is designed for a desktop experience. Please open it on a computer or tablet in landscape for the full experience.
      </p>
    </div>
  </div>
);

export default MobileDisclaimer;
