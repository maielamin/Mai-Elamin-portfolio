import React from 'react';

const CONTACT_EMAIL = 'maielamin@hotmail.com';
const MAILTO_HREF = `mailto:${CONTACT_EMAIL}`;

const MobileDisclaimer: React.FC = () => (
  <div
    className="fixed inset-0 flex flex-col items-center justify-center text-center"
    style={{
      touchAction: 'none',
      zIndex: 99999,
      background: 'linear-gradient(180deg, rgba(15,15,15,0.55) 0%, rgba(30,30,30,0.38) 60%, rgba(0,0,0,0.62) 100%)',
      backgroundColor: 'rgba(20,20,20,0.45)',
      backdropFilter: 'blur(6px) saturate(1.2)',
      WebkitBackdropFilter: 'blur(6px) saturate(1.2)',
      minHeight: '100dvh',
      width: '100vw',
      maxWidth: '100vw',
      pointerEvents: 'none',
    }}
  >
    <div className="max-w-md" style={{ color: '#fff', padding: '0 32px', pointerEvents: 'auto' }}>
      <h1
        className="font-noto-condensed text-3xl sm:text-5xl md:text-6xl tracking-tight leading-tight select-none m-0"
        style={{ fontFamily: "'Noto Serif Display', serif", letterSpacing: '-0.05em', fontSize: 'clamp(2.2rem, 7vw, 3.5rem)', marginBottom: 0 }}
      >
        Best viewed on desktop
      </h1>
      <p
        className="text-[#9ca3af] text-base leading-loose mb-8 max-w-lg m-0"
        style={{
          fontSize: 'clamp(0.9rem, 2.3vw, 1.15rem)',
          marginTop: '0.75rem',
        }}
      >
        For the best viewing experience, explore this portfolio on a desktop or a tablet in landscape.
      </p>
    </div>
    {/* Email CTA Button */}
    <a
      href={MAILTO_HREF}
      style={{
        position: 'absolute',
        top: 'max(24px, env(safe-area-inset-top))',
        right: '24px',
        width: '48px',
        height: '48px',
        display: 'grid',
        placeItems: 'center',
        color: '#ffffff',
        transition: 'none',
        background: 'rgba(255, 255, 255, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        borderRadius: '50%',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(20px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
        cursor: 'pointer',
        outline: 'none',
        zIndex: 100000,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = '#fb923c')}
      onMouseLeave={(e) => (e.currentTarget.style.color = '#ffffff')}
      aria-label={`Contact me by email to ${CONTACT_EMAIL}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 -960 960 960"
        fill="currentColor"
        style={{ width: '24px', height: '24px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
      >
        <path d="M80-40v-80h800v80H80Zm80-120v-240q-33-54-51-114.5T91-638q0-61 15.5-120T143-874q8-21 26-33.5t40-12.5q31 0 53 21t18 50l-11 91q-6 48 8.5 91t43.5 75.5q29 32.5 70 52t89 19.5q60 0 120.5 12.5T706-472q45 23 69.5 58.5T800-326v166H160Zm80-80h480v-86q0-24-12-42.5T674-398q-41-20-95-31t-99-11q-66 0-122.5-27t-96-72.5Q222-585 202-644.5T190-768q-10 30-14.5 64t-4.5 66q0 58 20.5 111.5T240-422v182Zm127-367q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47Zm169.5-56.5Q560-687 560-720t-23.5-56.5Q513-800 480-800t-56.5 23.5Q400-753 400-720t23.5 56.5Q447-640 480-640t56.5-23.5ZM320-160v-37q0-67 46.5-115T480-360h160v80H480q-34 0-57 24.5T400-197v37h-80Zm160-80Zm0-480Z" />
      </svg>
    </a>

    {/* Only the updated disclaimer content remains above. Duplicate removed. */}
  </div>
);

export default MobileDisclaimer;
