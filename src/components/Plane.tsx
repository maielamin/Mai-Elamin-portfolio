// Plane: simple scroll-driven overlay — CSS transition for smooth scale, no flash
import React, { useMemo, useState, useEffect, useRef, useLayoutEffect } from 'react';

/** Extract a prominent (average) color from an image via canvas. Returns rgb(r,g,b) or fallback. */
function getDominantColor(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('rgba(128,128,128,0.4)');
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let r = 0,
          g = 0,
          b = 0,
          count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        resolve(`rgb(${r},${g},${b})`);
      } catch {
        resolve('rgba(128,128,128,0.4)');
      }
    };
    img.onerror = () => resolve('rgba(128,128,128,0.4)');
    img.src = src.startsWith('/') ? `${window.location.origin}${src}` : src;
  });
}

const CLOUD_START = 0;
const CLOUD_FULL = 1;
const ZOOM_IN_SCALE = 16;
/** Exit zoom-in: zoom into centre window until it fills the screen (scale 1 → this), then plane fades to reveal environment */
const EXIT_ZOOM_SCALE = 14;
/** Dimmed window overlay only shows when scroll is at end and user hovers; hidden when scrolling up */
const SCROLL_END_THRESHOLD = 0.98;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// Motion-design easing: smooth curves so exit feels natural, not linear
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeInOutCubic = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

// Each window is a different project (frosted glass; first line "View [company] — product name", second line description). Last = talks & workshops.
const PROJECTS: { company: string; productName: string; description: string }[] = [
  { company: 'Deliveroo', productName: 'Bulk management', description: 'Manage multiple items and categories all at once.' },
  { company: 'Twitter', productName: 'Quick Promote', description: 'A feature for professional accounts to turn Tweets into an Ad.' },
  { company: 'Talks & Workshops', productName: '', description: '' },
  { company: 'Coming Soon', productName: '', description: 'More projects on the way.' },
  { company: 'Coming Soon', productName: '', description: 'More projects on the way.' },
];
const WINDOW_LABELS = PROJECTS.map((p) => [p.company, p.productName, p.description].filter(Boolean).join(' — '));
/** Window indices that open the case study (mask → full white page). Window 2 (index 2) opens LinkedIn. */
const CASE_STUDY_WINDOW_INDICES = [0, 1];

// Image paths for overlay multi-image animation. Add your images, e.g. ['/slide1.jpg', '/slide2.jpg'].
const OVERLAY_IMAGES: string[] = [];
// Multi-image animation: cycles through images with a crossfade (for first window overlay).
const MultiImageAnimation: React.FC<{
  images: string[];
  className?: string;
  style?: React.CSSProperties;
  /** When true, fill the whole window (100% size, object-cover). When false, max 60% with object-contain. */
  fillWindow?: boolean;
  /** When true, show a number (1, 2, 3, …) on each image so you can identify which file to edit. */
  showNumbers?: boolean;
  /** Optional object-position per image (e.g. ['center', 'center', 'center', '75% 50%'] to shift 4th right). */
  imagePositions?: string[];
  /** Optional callback when the visible image index changes. */
  onIndexChange?: (index: number) => void;
  /** When true, use controlled index from parent (no internal interval). */
  controlledIndex?: number;
  /** When true, animation runs (interval or controlled updates). When false, no cycling. */
  active?: boolean;
}> = ({ images, className, style, fillWindow = false, showNumbers = false, imagePositions, onIndexChange, controlledIndex, active = true }) => {
  const [internalIndex, setInternalIndex] = useState(0);
  const index = controlledIndex !== undefined ? controlledIndex : internalIndex;
  useEffect(() => {
    onIndexChange?.(index);
  }, [index, onIndexChange]);
  useEffect(() => {
    if (controlledIndex !== undefined || images.length <= 1 || !active) return;
    const id = setInterval(() => {
      setInternalIndex((i) => (i + 1) % images.length);
    }, 3000);
    return () => clearInterval(id);
  }, [images.length, controlledIndex, active]);
  if (images.length === 0) {
    return (
      <div
        className={className}
        style={{
          width: '100%',
          height: '100%',
          maxWidth: fillWindow ? '100%' : '60%',
          maxHeight: fillWindow ? '100%' : '60%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 'clamp(0.5rem, 1.5vmin, 0.75rem)',
          textAlign: 'center',
          ...style,
        }}
      >
        Add paths in OVERLAY_IMAGES (Plane.tsx)
      </div>
    );
  }
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        maxWidth: fillWindow ? '100%' : '60%',
        maxHeight: fillWindow ? '100%' : '60%',
        ...style,
      }}
    >
      {images.map((src, i) => (
        <div key={src + i} className="absolute inset-0" style={{ opacity: i === index ? 1 : 0, transition: 'opacity 0.85s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <img
            src={src}
            alt=""
            className={`absolute inset-0 w-full h-full pointer-events-none ${fillWindow ? 'object-cover' : 'object-contain'}`}
            style={imagePositions?.[i] != null ? { objectPosition: imagePositions[i] } : undefined}
          />
          {showNumbers && (
            <span
              className="absolute font-sans font-bold pointer-events-none select-none"
              style={{
                top: '8%',
                left: '8%',
                fontSize: 'clamp(1.25rem, 6vmin, 2.5rem)',
                lineHeight: 1,
                color: '#fff',
                background: '#000',
                minWidth: '1.6em',
                height: '1.6em',
                padding: '0 0.35em',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                zIndex: 1,
              }}
              aria-hidden
            >
              {i + 1}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

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

// Old Twitter bird logo (pre-X) as inline SVG — used for project window 1 (Quick Promote). Exported for CaseStudyTransition.
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

// School icon from Google Material Design Icons — used for project window 2 (Talks & Workshops). Exported for CaseStudyTransition.
export const SchoolIconSvg: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24px"
    viewBox="0 -960 960 960"
    width="24px"
    fill="currentColor"
    className={className}
    style={{ width: '100%', height: '100%', ...style }}
    aria-hidden
  >
    <path d="M480-120 200-272v-240L40-600l440-240 440 240v320h-80v-276l-80 44v240L480-120Zm0-332 274-148-274-148-274 148 274 148Zm0 241 200-108v-151L480-360 280-470v151l200 108Zm0-241Zm0 90Zm0 0Z" />
  </svg>
);

// Arm rest control icons
// ——— Desktop: original horizontal layout (3 windows side by side) ———
// ——— Desktop: 5 windows layout (Width 12%, Gap 4%) ———
const DESKTOP_WINDOW_WIDTH_PCT = 12;
const DESKTOP_WINDOW_HEIGHT_PCT = 38;
const DESKTOP_WINDOW_TOP_PCT = 38;
const DESKTOP_WINDOW_GAP_PCT = 4;
const DESKTOP_START_PCT = 12;

const DESKTOP_WINDOW_FRAMES: Array<[number, number, number, number]> = [
  [DESKTOP_START_PCT, DESKTOP_WINDOW_TOP_PCT, DESKTOP_WINDOW_WIDTH_PCT, DESKTOP_WINDOW_HEIGHT_PCT],
  [DESKTOP_START_PCT + (DESKTOP_WINDOW_WIDTH_PCT + DESKTOP_WINDOW_GAP_PCT) * 1, DESKTOP_WINDOW_TOP_PCT, DESKTOP_WINDOW_WIDTH_PCT, DESKTOP_WINDOW_HEIGHT_PCT],
  [DESKTOP_START_PCT + (DESKTOP_WINDOW_WIDTH_PCT + DESKTOP_WINDOW_GAP_PCT) * 2, DESKTOP_WINDOW_TOP_PCT, DESKTOP_WINDOW_WIDTH_PCT, DESKTOP_WINDOW_HEIGHT_PCT],
  [DESKTOP_START_PCT + (DESKTOP_WINDOW_WIDTH_PCT + DESKTOP_WINDOW_GAP_PCT) * 3, DESKTOP_WINDOW_TOP_PCT, DESKTOP_WINDOW_WIDTH_PCT, DESKTOP_WINDOW_HEIGHT_PCT],
  [DESKTOP_START_PCT + (DESKTOP_WINDOW_WIDTH_PCT + DESKTOP_WINDOW_GAP_PCT) * 4, DESKTOP_WINDOW_TOP_PCT, DESKTOP_WINDOW_WIDTH_PCT, DESKTOP_WINDOW_HEIGHT_PCT],
];

// ——— Mobile/small: vertical list layout ———
const MOBILE_WINDOW_ASPECT = 23 / 48;
const MOBILE_WINDOW_HEIGHT_PCT = 30;
const MOBILE_WINDOW_WIDTH_PCT = MOBILE_WINDOW_HEIGHT_PCT * MOBILE_WINDOW_ASPECT;
const MOBILE_WINDOW_GAP_PCT = 5;
const MOBILE_TOP_MARGIN_PCT = 10;
const MOBILE_WINDOW_LEFT_PCT = (100 - MOBILE_WINDOW_WIDTH_PCT) / 2;

const MOBILE_WINDOW_TOP = (i: number) =>
  MOBILE_TOP_MARGIN_PCT + i * (MOBILE_WINDOW_HEIGHT_PCT + MOBILE_WINDOW_GAP_PCT);

const MOBILE_WINDOW_FRAMES: Array<[number, number, number, number]> = [
  [MOBILE_WINDOW_LEFT_PCT, MOBILE_WINDOW_TOP(0), MOBILE_WINDOW_WIDTH_PCT, MOBILE_WINDOW_HEIGHT_PCT],
  [MOBILE_WINDOW_LEFT_PCT, MOBILE_WINDOW_TOP(1), MOBILE_WINDOW_WIDTH_PCT, MOBILE_WINDOW_HEIGHT_PCT],
  [MOBILE_WINDOW_LEFT_PCT, MOBILE_WINDOW_TOP(2), MOBILE_WINDOW_WIDTH_PCT, MOBILE_WINDOW_HEIGHT_PCT],
  [MOBILE_WINDOW_LEFT_PCT, MOBILE_WINDOW_TOP(3), MOBILE_WINDOW_WIDTH_PCT, MOBILE_WINDOW_HEIGHT_PCT],
  [MOBILE_WINDOW_LEFT_PCT, MOBILE_WINDOW_TOP(4), MOBILE_WINDOW_WIDTH_PCT, MOBILE_WINDOW_HEIGHT_PCT],
];

const PLANE_FADE_IN_END = 0.04;
const DESKTOP_MEDIA = '(min-width: 481px) and (min-height: 600px)';

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
  /** Sky atmosphere color (hex) so title/description match the background; from Environment */
  skyColor?: string;
}> = ({ scrollProgress, exitProgress = 0, onWindowSelect, onTurbulenceChange, skyColor = '#2563eb' }) => {
  const isDesktop = useIsDesktop();
  const [hoveredWindow, setHoveredWindow] = useState<number | null>(null);

  const handleWindowClick = (i: number) => (e: React.MouseEvent) => {
    if (!CASE_STUDY_WINDOW_INDICES.includes(i) || !onWindowSelect) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    onWindowSelect(i, rect);
  };

  const opensCaseStudy = (i: number) => CASE_STUDY_WINDOW_INDICES.includes(i);

  const prevScrollRef = useRef(scrollProgress);

  /* 
     SYNC FIX & ASPECT RATIO ENFORCEMENT:
     We use a ResizeObserver on the container to get exact pixel dimensions.
     Then we compute a single source of truth (`computedFrames`) for both 
     CSS layout (divs) and SVG Masking. 
     Crucially, we clamp the width to ensure it is ALWAYS less than the height,
     forcing a vertical pill shape and preventing circular/wide windows.
  */

  const containerRef = useRef<HTMLDivElement>(null);
  // Initialize with window dimensions so plane layer renders correctly on first paint
  // (ResizeObserver callback is async; avoid empty computedFrames / broken mask)
  const [containerSize, setContainerSize] = useState(() =>
    typeof window !== 'undefined'
      ? { width: window.innerWidth, height: window.innerHeight }
      : { width: 0, height: 0 }
  );

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    // Set initial size immediately from element (catches layout before observer fires)
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setContainerSize({ width: rect.width, height: rect.height });
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Compute layout once for both Mask and Divs
  // This ensures perfect sync and identical clamping
  const computedFrames = useMemo(() => {
    // Fallback to window dimensions if containerSize is 0 (initial render or observer delay)
    // ensuring windows are computed and mask is valid immediately.
    const cWidth = containerSize.width || (typeof window !== 'undefined' ? window.innerWidth : 0);
    const cHeight = containerSize.height || (typeof window !== 'undefined' ? window.innerHeight : 0);

    if (cWidth === 0 || cHeight === 0) return [];

    // Simplified to 100% of viewport to ensure perfect alignment and no clipping
    const effectiveW = cWidth;
    const effectiveH = cHeight;

    const sourceFrames = isDesktop ? DESKTOP_WINDOW_FRAMES : MOBILE_WINDOW_FRAMES;

    return sourceFrames.map(([leftPct, topPct, wPct, hPct]) => {
      let wPx = (wPct / 100) * effectiveW;
      let hPx = (hPct / 100) * effectiveH;

      // enforce height > width (pill shape)
      // Strict pill: width max 70% of height.
      if (wPx > hPx * 0.7) {
        const newWidth = hPx * 0.7;
        // adjusting width means we might need to re-center?
        // Current logic: layout uses leftPct as starting point?
        // Original: left is percentage. 
        // If we shrink width, we should probably keep it centered relative to its original slot?
        // The original percentages included spacing. 
        // Let's just shrink width (center alignment is handled by flex/centering in UI or assume left is fine)
        // Actually, 'left' in the array is the left edge. Shrinking width shifts the right edge left.
        // To keep it centered in its "column", we should adjust left.
        // CenterX = Left + Width/2.
        // NewLeft = CenterX - NewWidth/2.
        const centerX = (leftPct / 100) * effectiveW + wPx / 2;
        wPx = newWidth;
        const newLeftPx = centerX - wPx / 2;

        // Perfect pill shape (stadium)
        const radiusPx = wPx / 2;

        return {
          left: newLeftPx,
          top: (topPct / 100) * effectiveH,
          width: wPx,
          height: hPx,
          maskRx: radiusPx,
          maskRy: radiusPx,
          borderRadius: radiusPx,
        };
      }

      const radiusPx = wPx / 2;
      return {
        left: (leftPct / 100) * effectiveW,
        top: (topPct / 100) * effectiveH,
        width: wPx,
        height: hPx,
        maskRx: radiusPx,
        maskRy: radiusPx,
        borderRadius: radiusPx,
      };
    });
  }, [containerSize, isDesktop]);

  const isAtEndOfScroll = scrollProgress >= SCROLL_END_THRESHOLD;
  const isScrollingUp = scrollProgress < prevScrollRef.current;
  useEffect(() => {
    prevScrollRef.current = scrollProgress;
  }, [scrollProgress]);
  // Only show dimmed overlay at end of scroll when hovering that window; ignore hover when scrolling up
  const dimmedWindow = isAtEndOfScroll && !isScrollingUp ? hoveredWindow : null;

  const cloudT = useMemo(
    () => clamp01((scrollProgress - CLOUD_START) / (CLOUD_FULL - CLOUD_START)),
    [scrollProgress]
  );
  // Entrance: zoom out (scale 16 → 1). Exit: zoom in (scale 1 → EXIT_ZOOM_SCALE) focused on centre, eased for smooth motion
  const isExiting = exitProgress > 0;
  const exitZoomT = easeOutCubic(exitProgress);
  const exitFadeT = easeInOutCubic(exitProgress);
  const scale = isExiting
    ? lerp(1, EXIT_ZOOM_SCALE, exitZoomT)
    : lerp(ZOOM_IN_SCALE, 1, cloudT);
  const glassAlpha = useMemo(
    () => (isExiting ? 1 : lerp(0.95, 1, cloudT)),
    [cloudT, isExiting]
  );
  // During exit: zoom eases out (decelerates at end); fade eases in-out (smooth start and end)
  // Hide plane from start through halfway into onboarding (visibility toggle)
  const BIO_HIDE_START = 0;
  const BIO_HIDE_END = 0.80;
  const bioHidden = !isExiting && cloudT > BIO_HIDE_START && cloudT < BIO_HIDE_END;
  const planeOpacity = useMemo(
    () =>
      isExiting
        ? Math.max(0, 1 - exitFadeT)
        : cloudT <= 0
          ? 0
          : cloudT < PLANE_FADE_IN_END
            ? cloudT / PLANE_FADE_IN_END
            : 1,
    [cloudT, isExiting, exitFadeT]
  );

  if (cloudT <= 0 && !isExiting) return null;

  const frames = isDesktop ? DESKTOP_WINDOW_FRAMES : MOBILE_WINDOW_FRAMES;
  const maskId = isDesktop ? 'stadium-cutout-mask-desktop' : 'stadium-cutout-mask-mobile';

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
      <svg width={0} height={0} aria-hidden="true">
        <defs>
          <mask id="stadium-cutout-mask-desktop" maskUnits="userSpaceOnUse">
            <rect x={0} y={0} width="100%" height="100%" fill="white" />
            {(isDesktop ? computedFrames : []).map((frame, i) => (
              <rect
                key={i}
                x={frame.left}
                y={frame.top}
                width={frame.width}
                height={frame.height}
                rx={frame.borderRadius}
                ry={frame.borderRadius}
                fill="black"
              />
            ))}
          </mask>
          <mask id="stadium-cutout-mask-mobile" maskUnits="userSpaceOnUse">
            <rect x={0} y={0} width="100%" height="100%" fill="white" />
            {(!isDesktop ? computedFrames : []).map((frame, i) => (
              <rect
                key={i}
                x={frame.left}
                y={frame.top}
                width={frame.width}
                height={frame.height}
                rx={frame.borderRadius}
                ry={frame.borderRadius}
                fill="black"
              />
            ))}
          </mask>
        </defs>
      </svg>
      <div
        className={isDesktop ? undefined : 'plane-viewport'}
        ref={containerRef}
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
          perspective: '1400px',
          transformOrigin: '50% 50%',
          transform: `scale(${scale})`,
          opacity: planeOpacity,
          visibility: bioHidden ? 'hidden' : 'visible',
          transition: 'visibility 0.3s',
          willChange: 'transform, opacity',
        }}
      >
        <header
          className="absolute left-0 right-0 text-center select-none"
          style={{ top: isDesktop ? '15%' : 'clamp(1rem, 8vh, 2.5rem)', zIndex: 11 }}
        >
          <h2
            className="font-noto-condensed tracking-[-0.05em] select-none"
            style={{
              margin: 0,
              color: '#ffffff',
              fontSize: isDesktop ? 'clamp(2.5rem, 6vw, 4rem)' : 'clamp(1.8rem, 8vw, 2.5rem)',
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
            className="font-sans font-normal select-none"
            style={{
              margin: 0,
              marginTop: '0.85rem',
              color: '#ffffff',
              opacity: 0.9,
              fontSize: isDesktop ? 'clamp(0.85rem, 2vw, 1.1rem)' : 'clamp(0.75rem, 3vmin, 1rem)',
              lineHeight: 1.4,
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
            {/* Frosted glass + light grey */}
            <div
              className="absolute"
              style={{
                zIndex: 1,
                pointerEvents: 'none',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                maskImage: `url(#${maskId})`,
                WebkitMaskImage: `url(#${maskId})`,
                transform: 'translateZ(0)',
                border: `1px solid rgba(255, 255, 255, ${0.4 + glassAlpha * 0.2})`,
                boxShadow: `
                  inset 0 1px 0 0 rgba(255, 255, 255, 0.6),
                  inset 0 -1px 0 0 rgba(0, 0, 0, 0.05)
                `,
                backdropFilter: cloudT > 0.45 ? 'blur(12px)' : 'none',
                WebkitBackdropFilter: cloudT > 0.45 ? 'blur(12px)' : 'none',
                willChange: 'opacity',
                background: `
                  linear-gradient(165deg,
                    rgba(242, 244, 252, ${glassAlpha}) 0%,
                    rgba(235, 238, 248, ${glassAlpha}) 30%,
                    rgba(230, 233, 243, ${glassAlpha}) 60%,
                    rgba(232, 235, 245, ${glassAlpha}) 100%)
                `,
              }}
            />

            {/* Icons layer */}
            <div
              className="absolute"
              style={{ left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2, transform: 'translateZ(0)' }}
            >
              {computedFrames.map((frame, i) => (
                <div
                  key={i}
                  className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
                  style={{
                    left: frame.left,
                    top: frame.top,
                    width: frame.width,
                    height: frame.height,
                    borderRadius: frame.borderRadius,
                    opacity: isExiting ? 0 : (dimmedWindow === i ? 1 : 0.6),
                    background: 'transparent',
                    transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span
                      className="inline-block text-white"
                      style={{
                        width: '35%',
                        height: '35%',
                        maxWidth: '35%',
                        maxHeight: '35%',
                        filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                        transform: dimmedWindow === i ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {i === 0 ? <DeliverooLogoSvg style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : i === 1 ? <OldTwitterLogoSvg style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <SchoolIconSvg style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            {/* Project name below hovered window */}
            <div
              className="absolute"
              style={{ left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3, transform: 'translateZ(0)' }}
            >
              {computedFrames.map((frame, i) => {
                const effectiveH = containerSize.height || (typeof window !== 'undefined' ? window.innerHeight : 1);
                const isActive = hoveredWindow === i && isAtEndOfScroll && !isScrollingUp;
                return (
                  <div
                    key={i}
                    className="absolute flex flex-col items-center justify-center text-center"
                    style={{
                      left: frame.left,
                      top: frame.top + frame.height + (effectiveH * 0.05),
                      width: frame.width,
                      opacity: isActive ? 1 : 0,
                      transform: `translateY(${isActive ? 0 : 20}px)`,
                      transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <span className="font-sans text-white font-medium text-[11px] sm:text-[13px] tracking-wide uppercase select-none [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
                      {WINDOW_LABELS[i]}
                    </span>
                    {PROJECTS[i].description && (
                      <div className="mt-1">
                        {i === 2 ? (
                          <a
                            href="https://www.linkedin.com/in/maielamin"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-sans text-white font-light no-underline [text-shadow:0_1px_2px_rgba(0,0,0,0.15)] hover:text-white/90 pointer-events-auto text-[10px] sm:text-[12px]"
                          >
                            {PROJECTS[i].description}
                          </a>
                        ) : (
                          <span className="font-sans text-white font-light select-none [text-shadow:0_1px_2px_rgba(0,0,0,0.15)] text-[10px] sm:text-[12px]">
                            {PROJECTS[i].description}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bezels */}
            <div
              className="absolute"
              style={{ left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 4, transform: 'translateZ(0)' }}
            >
              {computedFrames.map((frame, i) => (
                <div
                  key={i}
                  className="absolute pointer-events-none"
                  style={{
                    left: frame.left,
                    top: frame.top,
                    width: frame.width,
                    height: frame.height,
                    borderRadius: frame.borderRadius,
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
              ))}
            </div>

            <div
              className="absolute"
              style={{ left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5, transform: 'translateZ(0)' }}
            >
              {computedFrames.map((frame, i) => {
                const commonProps = {
                  role: 'img' as const,
                  'aria-label': `${WINDOW_LABELS[i]} window`,
                  className: 'absolute cursor-pointer',
                  style: {
                    left: frame.left,
                    top: frame.top,
                    width: frame.width,
                    height: frame.height,
                    borderRadius: frame.borderRadius,
                    pointerEvents: 'auto' as const,
                  },
                  onMouseEnter: () => setHoveredWindow(i),
                  onMouseLeave: () => setHoveredWindow(null),
                };
                return CASE_STUDY_WINDOW_INDICES.includes(i) ? (
                  <div key={i} {...commonProps} onClick={handleWindowClick(i)} />
                ) : i === 2 ? (
                  <a
                    key={i}
                    {...commonProps}
                    href="https://www.linkedin.com/in/maielamin"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ) : (
                  <div key={i} {...commonProps} />
                );
              })}
            </div>

            <footer
              className="absolute left-0 right-0 text-center select-none"
              style={{ bottom: isDesktop ? '3%' : '5%', zIndex: 11, pointerEvents: 'auto' }}
              onMouseEnter={() => onTurbulenceChange?.(true)}
              onMouseLeave={() => onTurbulenceChange?.(false)}
            >
              <span
                className="font-sans text-white/70 font-normal cursor-pointer transition-opacity hover:text-white/90"
                style={{
                  fontSize: 'clamp(0.5rem, 1.1vw, 0.7rem)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                }}
              >
                10,000 ft above ground. Hover here to trigger turbulence.
              </span>
            </footer>
          </>
        ) : null}
      </div>
    </>
  );
};

export const PlaneMemo = React.memo(Plane);
export default Plane;
