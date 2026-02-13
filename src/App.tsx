import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import Experience from './components/Experience';
import UIOverlay from './components/UIOverlay';
import Plane from './components/Plane';
import MobileDisclaimer from './components/MobileDisclaimer';
import CaseStudyTransition from './components/CaseStudyTransition';


const UIOverlayMemo = memo(UIOverlay);
const PlaneMemo = memo(Plane);

// Scroll height in viewport units — user scrolls this far to reach "full" parallax
const PARALLAX_SCROLL_HEIGHT_VH = 700;
// Extra viewport heights after parallax ends where the plane stays fully in view (no translation)
const PARALLAX_DWELL_VH = 220;
// Smooth scroll via RAF — update every frame when value changes for seamless parallax
const SCROLL_SMOOTH_LERP = 1; // No smoothing for stable rendering
// Ease-out quart: smoother deceleration curve for UI parallax + plane layer
const easeOutQuart = (t: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 4);
// Ease-in-out quart: smooth start and end for exit layer translate (motion-design feel)
const easeInOutQuart = (t: number) => {
  const x = Math.max(0, Math.min(1, t));
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
};
// Small epsilon so we update every frame when scrolling (seamless feel); no time throttle
const SCROLL_UPDATE_EPSILON = 0.002;

const MOBILE_BREAKPOINT_PX = 768;
// Environment fades in first; heading/description in UIOverlay start after this duration
const ENV_FADE_DURATION = 1.2;

// Define the main App component using React's Functional Component type
const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT_PX
  );
  const [scrollProgress, setScrollProgress] = useState(0);
  const [openCaseStudy, setOpenCaseStudy] = useState<number | null>(null);
  const [expandRect, setExpandRect] = useState<DOMRect | null>(null);
  const [turbulenceOn, setTurbulenceOn] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [skyColor, setSkyColor] = useState('#2563eb');
  const turbulenceRef = useRef(false);
  const scrollTargetRef = useRef(0);
  const scrollSmoothedRef = useRef(0);
  const lastSetRef = useRef(0);

  const handleWindowSelect = (index: number, rect: DOMRect) => {
    setExpandRect(rect);
    setOpenCaseStudy(index);
  };

  const handleCloseCaseStudy = () => {
    setOpenCaseStudy(null);
    setExpandRect(null);
  };

  const setTurbulence = useCallback((on: boolean) => setTurbulenceOn(on), []);
  const handleSkyColorChange = useCallback((hex: string) => {
    setSkyColor(prev => (prev === hex ? prev : hex));
  }, []);

  // Block site on mobile: show disclaimer only
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT_PX);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const updateProgress = () => {
      const y = window.scrollY;
      const maxScroll = (PARALLAX_SCROLL_HEIGHT_VH / 100) * window.innerHeight - window.innerHeight;
      const progress = maxScroll <= 0 ? 0 : Math.min(1, Math.max(0, y / maxScroll));
      scrollTargetRef.current = progress;
      setScrollY(y);
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  useEffect(() => {
    turbulenceRef.current = turbulenceOn;
  }, [turbulenceOn]);

  // Smooth scroll via RAF — update every frame when value changes for seamless parallax
  useEffect(() => {
    let rafId: number;
    const tick = () => {
      const target = scrollTargetRef.current;
      const current = scrollSmoothedRef.current;
      scrollSmoothedRef.current = current + (target - current) * SCROLL_SMOOTH_LERP;
      const smoothed = scrollSmoothedRef.current;
      const changeOk = Math.abs(smoothed - lastSetRef.current) > SCROLL_UPDATE_EPSILON;
      if (changeOk) {
        lastSetRef.current = smoothed;
        setScrollProgress(smoothed);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Single eased progress for "parallax into plane" so UI and plane layer stay in perfect sync
  const parallaxProgress = easeOutQuart(scrollProgress);

  // Parallax ends at maxScrollPx; then dwell (plane in view); exit starts when we reach the content block (end of tall div)
  const innerHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
  const maxScrollPx =
    typeof window !== 'undefined'
      ? (PARALLAX_SCROLL_HEIGHT_VH / 100) * window.innerHeight - window.innerHeight
      : 0;
  const tallDivHeightPx = (PARALLAX_SCROLL_HEIGHT_VH - 100 + PARALLAX_DWELL_VH) / 100 * innerHeight;
  const scrollStartTranslatePx = tallDivHeightPx - innerHeight;
  const layerTranslateY =
    scrollStartTranslatePx > 0 && scrollY > scrollStartTranslatePx
      ? scrollY - scrollStartTranslatePx
      : 0;
  const isPastPlane = scrollY >= scrollStartTranslatePx;
  // Exit phase: keep layer at "end" state (progress 1); only Plane uses exitProgress for zoom-in, no reverse of enter
  const exitProgress = layerTranslateY > 0 ? Math.min(1, layerTranslateY / innerHeight) : 0;
  const effectiveParallaxProgress = layerTranslateY > 0 ? 1 : parallaxProgress;
  const easedLayerTranslateY = exitProgress > 0 ? easeInOutQuart(exitProgress) * innerHeight : 0;

  if (isMobile) {
    return (
      <>
        {/* Show 3D environment on mobile with disclaimer overlay */}
        <div className="fixed inset-0 w-full h-full overflow-hidden">
          <motion.div
            className="absolute inset-0 w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: ENV_FADE_DURATION, ease: [0.16, 1, 0.3, 1] }}
          >
            <Experience scrollProgress={0} onSkyColorChange={handleSkyColorChange} />
          </motion.div>
        </div>
        <MobileDisclaimer />
      </>
    );
  }

  // Portal target: fixed layers render into body so they're always on top of #root. Only when NOT mobile so the empty portal doesn't cover the mobile view.
  const portalRef = useRef<HTMLDivElement | null>(null);
  const [portalMounted, setPortalMounted] = useState(false);
  useEffect(() => {
    if (isMobile) {
      if (portalRef.current?.parentNode) {
        portalRef.current.parentNode.removeChild(portalRef.current);
        portalRef.current = null;
        setPortalMounted(false);
      }
      return;
    }
    const el = document.createElement('div');
    el.setAttribute('id', 'parallax-portal');
    el.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;overflow:visible;z-index:5;';
    document.body.appendChild(el);
    portalRef.current = el;
    setPortalMounted(true);
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el);
      portalRef.current = null;
      setPortalMounted(false);
    };
  }, [isMobile]);

  const fixedLayers = (
    <>
      <div className="fixed inset-0 w-full h-full overflow-hidden" style={{ zIndex: 1, pointerEvents: 'none' }} aria-hidden>
        <motion.div
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: ENV_FADE_DURATION, ease: [0.16, 1, 0.3, 1] }}
        >
          <Experience scrollProgress={scrollProgress} turbulenceRef={turbulenceRef} onSkyColorChange={handleSkyColorChange} />
        </motion.div>
      </div>
      {/* Mail CTA - Fixed position, always visible throughout scroll */}
      <div
        className="fixed inset-0 w-full h-full overflow-visible pointer-events-none"
        style={{
          zIndex: 50,
          willChange: 'transform',
          transform: easedLayerTranslateY > 0 ? `translate3d(0, -${easedLayerTranslateY}px, 0)` : 'translate3d(0, 0, 0)',
          pointerEvents: isPastPlane ? 'none' : 'auto',
        }}
        aria-hidden
      >
        <UIOverlayMemo scrollProgress={effectiveParallaxProgress} skyColor={skyColor} />
        <PlaneMemo
          scrollProgress={effectiveParallaxProgress}
          exitProgress={exitProgress}
          onWindowSelect={handleWindowSelect}
          onTurbulenceChange={setTurbulence}
          skyColor={skyColor}
        />
      </div>
    </>
  );

  return (
    <>
      {portalMounted && portalRef.current && createPortal(
        <>
          {fixedLayers}
          {openCaseStudy !== null && expandRect && (
            <CaseStudyTransition
              projectIndex={openCaseStudy}
              expandRect={expandRect}
              onClose={handleCloseCaseStudy}
              onSelectProject={setOpenCaseStudy}
            />
          )}
        </>,
        portalRef.current
      )}
      {/* #root only has scroll content — nothing can cover the portaled layers */}
      <div className="relative">
        <div
          className="relative w-full bg-black"
          style={{
            minHeight: `${PARALLAX_SCROLL_HEIGHT_VH - 100 + PARALLAX_DWELL_VH}vh`,
          }}
        />
        <motion.section
          animate={{ opacity: scrollProgress > 0.98 ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full min-h-[120vh] flex flex-col items-center justify-end px-6 pb-20 pt-32 text-center pointer-events-auto"
          style={{
            background: 'linear-gradient(to top, #000 30%, rgba(0,0,0,0.8) 70%, transparent 100%)',
          }}
          aria-label="About and links"
        >
          <div className="max-w-xl mx-auto flex flex-col items-center gap-6">
            <p className="font-sans text-white/90 text-sm sm:text-base md:text-lg font-light leading-relaxed max-w-xl text-center select-none [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
              I hope you enjoyed the flight!
            </p>
            <p className="font-sans text-white/90 text-sm sm:text-base md:text-lg font-light leading-relaxed max-w-xl text-center select-none [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
              To see more personal projects, check them out on{' '}
              <a
                href="https://github.com/maielamin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-normal hover:opacity-80 transition-opacity flex items-center gap-2 inline-flex align-middle"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="inline">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
              .
            </p>
          </div>
        </motion.section>
      </div>

    </>
  );
};

// Export the App component as the default export for the entry point (index.tsx)
export default App;