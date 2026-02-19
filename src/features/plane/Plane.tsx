// Plane: simple scroll-driven overlay — CSS transition for smooth scale, no flash
import React, { useMemo, useState, useEffect, useRef } from 'react';

// Clamp a number between 0 and 1
function clamp01(t: number) {
  return Math.max(0, Math.min(1, t));
}

// Animation/transition helpers and constants
const CLOUD_START = 0.08;
const CLOUD_FULL = 0.92;
const EXIT_ZOOM_SCALE = 1.18;
const ZOOM_IN_SCALE = 16;
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - clamp01(t), 4);
}
const easeInOutQuart = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
};

// Each window is a different project (frosted glass; first line "View [company] — product name", second line description). Last = talks & AI workshops.
const PROJECTS: { company: string; productName: string; description: string }[] = [
  { company: '', productName: '', description: '' },
  { company: 'Deliveroo', productName: 'Partner hub', description: 'Coming soon - Bulk management for grocery and retail partners' },
  { company: 'Google', productName: 'Play Store', description: 'Coming soon - Deep links management redesign to comply with EU laws' },
  { company: 'Twitter', productName: 'Ads', description: 'Coming soon - Quick Promote rebrand for professionals to comply with Apple IAP' },
  { company: "Mai is travelling", productName: '', description: 'Find out her latest talks & AI workshops from her recent posts' },
  { company: 'Coming Soon', productName: '', description: 'See GitHub projects' },
  { company: '', productName: '', description: '' },
];
const WINDOW_LABELS = PROJECTS.map((p) => [p.company, p.productName].filter(Boolean).join(' — '));
/** Window indices that open the case study (mask → full white page). Window 2 (index 2) opens LinkedIn. */
const CASE_STUDY_WINDOW_INDICES = [];


// Deliveroo logo (kangaroo mark, from Simple Icons) — used for project window 0 (Deliveroo / first window). Exported for CaseStudyTransition.
export const DeliverooLogoSvg: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ width: '100%', height: '100%', ...style }}
    aria-hidden
  >
    <path d="M16.861 0l-1.127 10.584L13.81 1.66 7.777 2.926l1.924 8.922-8.695 1.822 1.535 7.127L17.832 24l3.498-7.744L22.994.636 16.861 0zM11.39 13.61a.755.755 0 01.322.066c.208.093.56.29.63.592.103.434.004.799-.312 1.084v.002c-.315.284-.732.258-1.174.113-.441-.145-.637-.672-.47-1.309.124-.473.71-.544 1.004-.549zm4.142.548c.447-.012.832.186 1.05.543.217.357.107.75-.122 1.143h-.002c-.229.392-.83.445-1.422.16-.399-.193-.397-.684-.353-.983a.922.922 0 01.193-.447c.142-.177.381-.408.656-.416Z" />
  </svg>
);

// Old Twitter bird logo (pre-X) as inline SVG — used for project window 1 (Ads). Exported for CaseStudyTransition.
export const OldTwitterLogoSvg: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ width: '100%', height: '100%', ...style }}
    aria-hidden
  >
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
  </svg>
);

// School icon from Google Material Design Icons — used for project window 2 (Talks & AI Workshops). Exported for CaseStudyTransition.
export const SchoolIconSvg: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ width: '100%', height: '100%', ...style }}
    aria-hidden
  >
    <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
  </svg>
);

// Google logo (G mark) — used for Google Play Store project window. Exported for CaseStudyTransition.
export const GoogleLogoSvg: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ width: '100%', height: '100%', ...style }}
    aria-hidden
  >
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// Arm rest control icons
// ——— Desktop: original horizontal layout (3 windows side by side) ———
// ——— Desktop: 5 windows layout (Width 12%, Height 36% = taller windows) ———
const DESKTOP_WINDOW_WIDTH_PCT = 12;
const DESKTOP_WINDOW_HEIGHT_PCT = 36;
const DESKTOP_WINDOW_TOP_PCT = 33;
const DESKTOP_WINDOW_GAP_PCT = 4;
const DESKTOP_START_PCT = 12;

const DESKTOP_WINDOW_FRAMES: Array<[number, number, number, number]> = [
  [DESKTOP_START_PCT - (DESKTOP_WINDOW_WIDTH_PCT + DESKTOP_WINDOW_GAP_PCT), DESKTOP_WINDOW_TOP_PCT, DESKTOP_WINDOW_WIDTH_PCT, DESKTOP_WINDOW_HEIGHT_PCT],
  [DESKTOP_START_PCT, DESKTOP_WINDOW_TOP_PCT, DESKTOP_WINDOW_WIDTH_PCT, DESKTOP_WINDOW_HEIGHT_PCT],
  [DESKTOP_START_PCT + (DESKTOP_WINDOW_WIDTH_PCT + DESKTOP_WINDOW_GAP_PCT) * 1, DESKTOP_WINDOW_TOP_PCT, DESKTOP_WINDOW_WIDTH_PCT, DESKTOP_WINDOW_HEIGHT_PCT],
  [DESKTOP_START_PCT + (DESKTOP_WINDOW_WIDTH_PCT + DESKTOP_WINDOW_GAP_PCT) * 2, DESKTOP_WINDOW_TOP_PCT, DESKTOP_WINDOW_WIDTH_PCT, DESKTOP_WINDOW_HEIGHT_PCT],
  [DESKTOP_START_PCT + (DESKTOP_WINDOW_WIDTH_PCT + DESKTOP_WINDOW_GAP_PCT) * 3, DESKTOP_WINDOW_TOP_PCT, DESKTOP_WINDOW_WIDTH_PCT, DESKTOP_WINDOW_HEIGHT_PCT],
  [DESKTOP_START_PCT + (DESKTOP_WINDOW_WIDTH_PCT + DESKTOP_WINDOW_GAP_PCT) * 4, DESKTOP_WINDOW_TOP_PCT, DESKTOP_WINDOW_WIDTH_PCT, DESKTOP_WINDOW_HEIGHT_PCT],
  [DESKTOP_START_PCT + (DESKTOP_WINDOW_WIDTH_PCT + DESKTOP_WINDOW_GAP_PCT) * 5, DESKTOP_WINDOW_TOP_PCT, DESKTOP_WINDOW_WIDTH_PCT, DESKTOP_WINDOW_HEIGHT_PCT],
];

// ——— Mobile/small: vertical list layout (taller) ———
const MOBILE_WINDOW_ASPECT = 3 / 4;
const MOBILE_WINDOW_HEIGHT_PCT = 44;
const MOBILE_WINDOW_WIDTH_PCT = MOBILE_WINDOW_HEIGHT_PCT * MOBILE_WINDOW_ASPECT;
const MOBILE_WINDOW_GAP_PCT = 5;
const MOBILE_TOP_MARGIN_PCT = 19;
const MOBILE_WINDOW_LEFT_PCT = (100 - MOBILE_WINDOW_WIDTH_PCT) / 2;

const MOBILE_WINDOW_TOP = (i: number) =>
  MOBILE_TOP_MARGIN_PCT + i * (MOBILE_WINDOW_HEIGHT_PCT + MOBILE_WINDOW_GAP_PCT);

const MOBILE_WINDOW_FRAMES: Array<[number, number, number, number]> = [
  [MOBILE_WINDOW_LEFT_PCT, MOBILE_WINDOW_TOP(-1), MOBILE_WINDOW_WIDTH_PCT, MOBILE_WINDOW_HEIGHT_PCT],
  [MOBILE_WINDOW_LEFT_PCT, MOBILE_WINDOW_TOP(0), MOBILE_WINDOW_WIDTH_PCT, MOBILE_WINDOW_HEIGHT_PCT],
  [MOBILE_WINDOW_LEFT_PCT, MOBILE_WINDOW_TOP(1), MOBILE_WINDOW_WIDTH_PCT, MOBILE_WINDOW_HEIGHT_PCT],
  [MOBILE_WINDOW_LEFT_PCT, MOBILE_WINDOW_TOP(2), MOBILE_WINDOW_WIDTH_PCT, MOBILE_WINDOW_HEIGHT_PCT],
  [MOBILE_WINDOW_LEFT_PCT, MOBILE_WINDOW_TOP(3), MOBILE_WINDOW_WIDTH_PCT, MOBILE_WINDOW_HEIGHT_PCT],
  [MOBILE_WINDOW_LEFT_PCT, MOBILE_WINDOW_TOP(4), MOBILE_WINDOW_WIDTH_PCT, MOBILE_WINDOW_HEIGHT_PCT],
  [MOBILE_WINDOW_LEFT_PCT, MOBILE_WINDOW_TOP(5), MOBILE_WINDOW_WIDTH_PCT, MOBILE_WINDOW_HEIGHT_PCT],
];

const PLANE_FADE_IN_END = 0.01;
const DESKTOP_MEDIA = '(min-width: 481px)';

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(DESKTOP_MEDIA).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_MEDIA);
    const handler = () => setIsDesktop(mql.matches);
    // Ensure state matches current media query immediately on mount
    setIsDesktop(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

const Plane: React.FC<{
  scrollProgress: number;
  /** When > 0, we're in exit: zoom in (scale 1 → ZOOM_IN_SCALE) instead of reversing entrance */
  exitProgress?: number;
  onWindowSelect?: (index: number, rect: DOMRect) => void;
  onTurbulenceChange?: (on: boolean) => void;
}> = ({ scrollProgress, exitProgress = 0, onWindowSelect, onTurbulenceChange }) => {
  const isDesktop = useIsDesktop();
  const [hoveredWindow, setHoveredWindow] = useState<number | null>(null);
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));

  useEffect(() => {
    const handleResize = () => setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const windowMaxHeight = '320px';
  const windowYOffsetPct = useMemo(() => {
    if (viewportSize.width <= 0) return 0;
    const t = clamp01((900 - viewportSize.width) / 420);
    // Increase multiplier for more offset in tablet view
    const responsiveOffset = t * 18;
    return responsiveOffset + (isDesktop ? 0.5 : 0);
  }, [viewportSize.width, isDesktop]);

  const windowMinHeight = useMemo(() => {
    if (viewportSize.width > 1103) return '35vh'; // desktop default
    if (viewportSize.width <= 0) return '22vh'; // fallback
    // Easing from 35vh at 1103px down to 22vh at 703px, then 22vh to 10vh at 480px
    const maxWidth = 1103;
    const midWidth = 703;
    const minWidth = 480;
    if (viewportSize.width > midWidth) {
      // Ease from 35vh to 22vh
      const t = clamp01((maxWidth - viewportSize.width) / (maxWidth - midWidth));
      const easeInQuad = t * t;
      const value = 35 - (35 - 22) * easeInQuad;
      return `${value.toFixed(1)}vh`;
    } else {
      // Ease from 22vh to 10vh
      const t = clamp01((midWidth - viewportSize.width) / (midWidth - minWidth));
      const easeInQuad = t * t;
      const value = 22 - (22 - 10) * easeInQuad;
      return `${value.toFixed(1)}vh`;
    }
  }, [viewportSize.width]);

  const handleWindowClick = (i: number) => (e: React.MouseEvent) => {
    if (!CASE_STUDY_WINDOW_INDICES.includes(i) || !onWindowSelect) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    onWindowSelect(i, rect);
  };

  const prevScrollRef = useRef(scrollProgress);

  const baseFrames = isDesktop ? DESKTOP_WINDOW_FRAMES : MOBILE_WINDOW_FRAMES;
  const frames = useMemo(
    () => baseFrames.map(([leftPct, topPct, wPct, hPct]) => [leftPct, topPct + windowYOffsetPct, wPct, hPct] as [number, number, number, number]),
    [baseFrames, windowYOffsetPct]
  );

  const isScrollingUp = scrollProgress < prevScrollRef.current;
  useEffect(() => {
    prevScrollRef.current = scrollProgress;
  }, [scrollProgress]);
  // Show hover states whenever hovering a window; ignore hover when scrolling up
  const dimmedWindow = !isScrollingUp ? hoveredWindow : null;

  const cloudT = useMemo(
    () => clamp01((scrollProgress - CLOUD_START) / (CLOUD_FULL - CLOUD_START)),
    [scrollProgress]
  );
  // Entrance: zoom out (scale 16 → 1). Exit: zoom in (scale 1 → EXIT_ZOOM_SCALE) focused on centre, eased for smooth motion
  const isExiting = exitProgress > 0;
  const exitZoomT = easeOutQuart(exitProgress);
  const exitFadeT = easeInOutQuart(exitProgress);
  const scale = isExiting
    ? lerp(1, EXIT_ZOOM_SCALE, exitZoomT)
    : lerp(ZOOM_IN_SCALE, 1, cloudT);
  // During exit: zoom eases out (decelerates at end); fade eases in-out (smooth start and end)
  // Hide plane from start through halfway into onboarding (visibility toggle)
  const BIO_HIDE_START = 0;
  const BIO_HIDE_END = 0.80;
  const bioHidden = !isExiting && cloudT > BIO_HIDE_START && cloudT < BIO_HIDE_END;
  const planeOpacity = useMemo(
    () => {
      if (bioHidden) return 0;
      return isExiting
        ? Math.max(0, 1 - exitFadeT)
        : cloudT <= 0
          ? 0
          : cloudT < PLANE_FADE_IN_END
            ? cloudT / PLANE_FADE_IN_END
            : 1;
    },
    [bioHidden, cloudT, isExiting, exitFadeT]
  );
  if (cloudT <= 0 && !isExiting) return null;

  return (
    <>
      <style>{`
        @media (max-height: 700px), (max-width: 480px) {
          .plane-viewport {
            height: 100dvh !important;
            min-height: 100dvh !important;
            max-height: none !important;
            overflow: hidden !important;
            pointer-events: auto;
          }
        }
      `}</style>
      <div
        className={isDesktop ? undefined : 'plane-viewport'}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 20,
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: isDesktop ? undefined : '100vw',
          height: isDesktop ? undefined : '100dvh',
          minHeight: isDesktop ? undefined : '100dvh',
          maxWidth: isDesktop ? undefined : '100%',
          maxHeight: isDesktop ? undefined : '100%',
          overflow: isDesktop ? 'visible' : 'hidden',
          transformOrigin: '50% 50%',
          transform: `scale(${scale}) translate3d(0,0,0)`,
          opacity: planeOpacity,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            zIndex: 0,
            pointerEvents: 'none',
            background: 'rgba(255,255,255,0.4)',
            backdropFilter: 'blur(18px) saturate(1.1)',
            WebkitBackdropFilter: 'blur(18px) saturate(1.1)',
            transform: 'translateZ(0)',
            maskImage: [
              'linear-gradient(#000 0 0)',
              ...frames.map(() => 'radial-gradient(closest-side, #000 98%, transparent 100%)'),
              ...frames.map(() => 'radial-gradient(closest-side, #000 98%, transparent 100%)'),
              ...frames.map(() => 'linear-gradient(#000 0 0)'),
            ].join(', '),
            WebkitMaskImage: [
              'linear-gradient(#000 0 0)',
              ...frames.map(() => 'radial-gradient(closest-side, #000 98%, transparent 100%)'),
              ...frames.map(() => 'radial-gradient(closest-side, #000 98%, transparent 100%)'),
              ...frames.map(() => 'linear-gradient(#000 0 0)'),
            ].join(', '),
            maskRepeat: [
              'no-repeat',
              ...frames.map(() => 'no-repeat'),
              ...frames.map(() => 'no-repeat'),
              ...frames.map(() => 'no-repeat'),
            ].join(', '),
            WebkitMaskRepeat: [
              'no-repeat',
              ...frames.map(() => 'no-repeat'),
              ...frames.map(() => 'no-repeat'),
              ...frames.map(() => 'no-repeat'),
            ].join(', '),
            maskSize: [
              '100% 100%',
              ...frames.map(([_, __, wPct, hPct]) => `${wPct}% ${hPct}%`),
              ...frames.map(([_, __, wPct, hPct]) => `${wPct}% ${hPct}%`),
              ...frames.map(([_, __, wPct, hPct]) => `${wPct}% ${hPct}%`),
            ].join(', '),
            WebkitMaskSize: [
              '100% 100%',
              ...frames.map(([_, __, wPct, hPct]) => `${wPct}% ${hPct}%`),
              ...frames.map(([_, __, wPct, hPct]) => `${wPct}% ${hPct}%`),
              ...frames.map(([_, __, wPct, hPct]) => `${wPct}% ${hPct}%`),
            ].join(', '),
            maskPosition: [
              '0 0',
              ...frames.map(([leftPct, topPct, wPct, hPct]) => `${leftPct + wPct / 2}% ${topPct}%`),
              ...frames.map(([leftPct, topPct, wPct, hPct]) => `${leftPct + wPct / 2}% ${topPct + hPct}%`),
              ...frames.map(([leftPct, topPct, wPct, hPct]) => `${leftPct}% ${topPct + hPct / 2}%`),
            ].join(', '),
            WebkitMaskPosition: [
              '0 0',
              ...frames.map(([leftPct, topPct, wPct, hPct]) => `${leftPct + wPct / 2}% ${topPct}%`),
              ...frames.map(([leftPct, topPct, wPct, hPct]) => `${leftPct + wPct / 2}% ${topPct + hPct}%`),
              ...frames.map(([leftPct, topPct, wPct, hPct]) => `${leftPct}% ${topPct + hPct / 2}%`),
            ].join(', '),
            maskComposite: ['exclude', ...frames.map(() => 'exclude'), ...frames.map(() => 'exclude')].join(', '),
            WebkitMaskComposite: ['xor', ...frames.map(() => 'xor'), ...frames.map(() => 'xor')].join(', '),
          }}
        >
        </div>
        <div
          className="absolute inset-0"
          style={{
            zIndex: 0,
            pointerEvents: 'none',
            background: 'transparent',
          }}
        />
        <header
          className="absolute left-0 right-0 text-center select-none"
          style={{ top: isDesktop ? '12%' : 'clamp(2.5rem, 12vh, 4.5rem)', zIndex: 11, transform: 'translate3d(0,0,0)' }}
        >
          <h2
            className="font-noto-condensed tracking-[-0.05em] select-none"
            style={{
              margin: 0,
              color: '#ffffff',
              fontSize: isDesktop ? 'clamp(2.8rem, 6.6vw, 3.9rem)' : 'clamp(1.8rem, 7.2vw, 2.5rem)',
              lineHeight: 1.1,
              WebkitFontSmoothing: 'subpixel-antialiased',
              MozOsxFontSmoothing: 'auto',
              textRendering: 'geometricPrecision',
              textShadow: '0 2px 10px rgba(0,0,0,0.4), 0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            Projects on board
          </h2>
          <p
            className="font-sans font-light select-none"
            style={{
              margin: 0,
              marginTop: '0.85rem',
              color: 'rgba(255, 255, 255, 1)',
              fontSize: isDesktop
                ? 'clamp(0.9rem, 1.9vw, 1.1rem)'
                : 'clamp(0.5rem, 1vw, 0.7rem)', // minimum for tablet/mobile
              lineHeight: 1.8,
              WebkitFontSmoothing: 'subpixel-antialiased',
              MozOsxFontSmoothing: 'auto',
              textRendering: 'geometricPrecision',
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            Take a look outside and you will see more than clouds
          </p>
        </header>
        {isDesktop ? (
          <>
            {/* Icons layer */}
            <div
              className="absolute"
              style={{ left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1, transform: 'translate3d(0,0,0)' }}
            >
              {frames.map(([leftPct, topPct, wPct, hPct], i) => (
                <div
                  key={i}
                  className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${wPct}%`,
                    height: `${hPct}%`,
                    minHeight: windowMinHeight,
                    maxHeight: windowMaxHeight,
                    borderRadius: '9999px',
                    opacity: isExiting ? 0 : (cloudT > 0.9 ? (dimmedWindow === i ? 1 : 0.85) : 0),
                    background: 'transparent',
                    transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span
                      className="inline-block text-white"
                      style={{
                        width: i === 4 || i === 0 ? '100%' : '35%',
                        height: i === 4 || i === 0 ? '100%' : '35%',
                        maxWidth: i === 4 || i === 0 ? '100%' : '35%',
                        maxHeight: i === 4 || i === 0 ? '100%' : '35%',
                        filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                        transform: (i === 4 || i === 0) ? 'scale(1)' : (dimmedWindow === i ? 'scale(1.15)' : 'scale(1)'),
                        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {i === 0 ? null : i === 1 ? <DeliverooLogoSvg style={{ width: '100%', height: '100%', objectFit: 'contain', color: '#ffffff' }} /> : i === 2 ? <GoogleLogoSvg style={{ width: '100%', height: '100%', objectFit: 'contain', color: '#ffffff' }} /> : i === 3 ? <OldTwitterLogoSvg style={{ width: '100%', height: '100%', objectFit: 'contain', color: '#ffffff' }} /> : i === 4 ? (
                        <img 
                          src="/mai-profile.png" 
                          alt="Mai" 
                          style={{ 
                            width: '123%', 
                            height: '123%', 
                            objectFit: 'cover',
                            objectPosition: 'center 30%',
                            opacity: 0.6,
                            borderRadius: '9999px',
                            transform: 'scale(1.23)'
                          }} 
                        />
                      ) : null}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            {/* Project name below hovered window */}
            <div
              className="absolute"
              style={{ left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2, transform: 'translate3d(0,0,0)' }}
            >
              {frames.map(([leftPct, topPct, wPct, hPct], i) => {
                const isActive = hoveredWindow === i && !isScrollingUp;
                return (
                  <div
                    key={i}
                    className="absolute flex flex-col items-center justify-center text-center"
                    style={{
                      left: `calc(${leftPct}% + ${wPct / 2}%)`,
                      top: `calc(${topPct}% + ${hPct}% + 6vh)`,
                      width: 'clamp(180px, 18vw, 260px)',
                      opacity: isActive ? 1 : 0,
                      transform: `translate(-50%, ${isActive ? 0 : 20}px)`,
                      transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <span className="font-sans text-white font-medium text-[16px] xl:text-[17px] md:max-lg:text-[10px] tracking-wide select-none [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]" style={{ color: '#ffffff' }}>
                      {WINDOW_LABELS[i]}
                    </span>
                    {PROJECTS[i].description && (
                      <div className="mt-1">
                        {(() => {
                          const commonClass = "font-sans text-white font-light select-none [text-shadow:0_1px_3px_rgba(0,0,0,0.5)] text-[14px] xl:text-[15px] md:max-lg:text-[7px] mt-1 block";
                          const commonStyle = { color: '#ffffff', lineHeight: 1.45, maxHeight: '4.35em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any, marginTop: '0.35em' };
                          if (i === 4) {
                            return (
                              <a
                                href="https://www.linkedin.com/in/maielamin"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={commonClass + ' no-underline'}
                                style={commonStyle}
                              >
                                {PROJECTS[i].description}
                              </a>
                            );
                          } else if (i === 5) {
                            return (
                              <a
                                href="https://github.com/maielamin"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={commonClass}
                                style={commonStyle}
                              >
                                {PROJECTS[i].description}
                              </a>
                            );
                          } else {
                            return (
                              <span className={commonClass} style={commonStyle}>
                                {PROJECTS[i].description}
                              </span>
                            );
                          }
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bezels */}
            <div
              className="absolute"
              style={{ left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3, transform: 'translate3d(0,0,0)' }}
            >
              {frames.map(([leftPct, topPct, wPct, hPct], i) => {
                const isBlank = !PROJECTS[i]?.company && !PROJECTS[i]?.productName && !PROJECTS[i]?.description;
                return (
                  <div
                    key={i}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      width: `${wPct}%`,
                      height: `${hPct}%`,
                      minHeight: windowMinHeight,
                      maxHeight: windowMaxHeight,
                      borderRadius: '9999px',
                      transform: 'translate3d(0,0,0)',
                      opacity: isBlank ? 0.35 : 1,
                      boxShadow: `
                        inset 0 1px 0 0 rgba(255,255,255,0.6),
                        inset 0 -1px 0 0 rgba(0,0,0,0.05),
                        inset 0 0 0 1px rgba(255,255,255,0.2),
                        0 0 0 1.5vmin rgba(230,232,240,1),
                        0 0 0 calc(1.5vmin + 1px) rgba(0,0,0,0.08),
                        inset 2px 2px 12px rgba(0,0,0,0.12),
                        inset 0 0 32px rgba(255,255,255,0.4)
                      `,
                    }}
                  />
                );
              })}
            </div>

            <div
              className="absolute"
              style={{ left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'auto', zIndex: 4, transform: 'translate3d(0,0,0)' }}
            >
              {frames.map(([leftPct, topPct, wPct, hPct], i) => {
                const commonProps = {
                  role: 'img' as const,
                  'aria-label': `${WINDOW_LABELS[i]} window`,
                  className: 'absolute cursor-pointer',
                  style: {
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${wPct}%`,
                    height: `${hPct}%`,
                    minHeight: windowMinHeight,
                    maxHeight: windowMaxHeight,
                    borderRadius: '9999px',
                    pointerEvents: 'auto' as const,
                  },
                  onMouseEnter: () => setHoveredWindow(i),
                  onMouseLeave: () => setHoveredWindow(null),
                };
                return CASE_STUDY_WINDOW_INDICES.includes(i) ? (
                  <div key={i} {...commonProps} onClick={handleWindowClick(i)} />
                ) : i === 4 ? (
                  <a
                    key={i}
                    {...commonProps}
                    href="https://www.linkedin.com/in/maielamin"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ) : i === 5 ? (
                  <a
                    key={i}
                    {...commonProps}
                    href="https://github.com/maielamin"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ) : (
                  <div key={i} {...commonProps} />
                );
              })}
            </div>

            {/* Footer only visible and interactive when plane is visible (not bioHidden, not faded out) */}
            {scrollProgress >= 0.98 && (
              <footer
                className="w-full text-center select-none"
                style={{
                  pointerEvents: 'auto',
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: '2%',
                  zIndex: 99,
                  opacity: planeOpacity,
                  background: 'transparent',
                  padding: '12px 0',
                  transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={() => {
                  console.log('Turbulence ON (footer hover)');
                  onTurbulenceChange?.(true);
                }}
                onMouseLeave={() => {
                  console.log('Turbulence OFF (footer unhover)');
                  onTurbulenceChange?.(false);
                }}
              >
                <span
                  className="font-sans text-white font-normal cursor-pointer transition-opacity hover:text-white/90"
                  style={{
                    color: '#ffffff',
                    fontSize: 'clamp(0.65rem, 1.2vw, 0.85rem)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  10,000 ft above ground. Hover here to trigger turbulence.
                </span>
              </footer>
            )}
          </>
        ) : null}
      </div>
    </>
  );
};

export const PlaneMemo = React.memo(Plane);
export default Plane;
