import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import Experience from './features/experience/Experience';
import UIOverlay, { MailCta } from './features/overlay/UIOverlay';
import Plane from './features/plane/Plane';
import MobileDisclaimer from './features/disclaimer/MobileDisclaimer';
import CaseStudyTransition from './features/case-study/CaseStudyTransition';

const UIOverlayMemo = memo(UIOverlay);
const PlaneMemo = memo(Plane);

const PARALLAX_SCROLL_HEIGHT_VH = 700;
const PARALLAX_DWELL_VH = 220;
const PARALLAX_EXIT_VH = 120;
const EXIT_PROGRESS_THRESHOLD = 0.06;

const easeOutQuart = (t: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 4);
const easeInOutQuart = (t: number) => {
  const x = Math.max(0, Math.min(1, t));
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
};

const MOBILE_BREAKPOINT_PX = 768;
const MOBILE_HEIGHT_PX = 700;
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX}px), (max-height: ${MOBILE_HEIGHT_PX}px)`;

// Define the main App component using React's Functional Component type
const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_MEDIA_QUERY).matches
  );
  const [scrollProgress, setScrollProgress] = useState(0);
  const [openCaseStudy, setOpenCaseStudy] = useState<number | null>(null);
  const [expandRect, setExpandRect] = useState<DOMRect | null>(null);
  const [turbulenceOn, setTurbulenceOn] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [exitArmed, setExitArmed] = useState(false);
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));
  
  const turbulenceRef = useRef(false);
  const prevScrollYRef = useRef(0);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const [portalMounted, setPortalMounted] = useState(false);

  const handleWindowSelect = (index: number, rect: DOMRect) => {
    setExpandRect(rect);
    setOpenCaseStudy(index);
  };

  const handleCloseCaseStudy = () => {
    setOpenCaseStudy(null);
    setExpandRect(null);
  };

  const setTurbulence = useCallback((on: boolean) => setTurbulenceOn(on), []);

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
  }, []);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_MEDIA_QUERY);
    const update = () => setIsMobile(mql.matches);
    const handleResize = () => {
      update();
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    update();
    mql.addEventListener('change', update);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      mql.removeEventListener('change', update);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  useEffect(() => {
    if (openCaseStudy !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [openCaseStudy]);

  useEffect(() => {
    const updateProgress = () => {
      const y = window.scrollY;
      const maxScroll = (PARALLAX_SCROLL_HEIGHT_VH / 100) * window.innerHeight - window.innerHeight;
      const progress = maxScroll <= 0 ? 0 : Math.min(1, Math.max(0, y / maxScroll));
      setScrollProgress(progress);
      setScrollY(y);
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  useEffect(() => {
    turbulenceRef.current = turbulenceOn;
  }, [turbulenceOn]);

  // Single eased progress for "parallax into plane" so UI and plane layer stay in perfect sync
  const parallaxProgress = easeOutQuart(scrollProgress);

  // Parallax ends at maxScrollPx; then dwell (plane in view); exit starts when we reach the content block (end of tall div)
  const innerHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
  const maxScrollPx =
    typeof window !== 'undefined'
      ? (PARALLAX_SCROLL_HEIGHT_VH / 100) * window.innerHeight - window.innerHeight
      : 0;
  const tallDivHeightPx = (PARALLAX_SCROLL_HEIGHT_VH - 100 + PARALLAX_DWELL_VH + PARALLAX_EXIT_VH) / 100 * innerHeight;
  const exitRangePx = (PARALLAX_EXIT_VH / 100) * innerHeight;
  const scrollStartTranslatePx = tallDivHeightPx - innerHeight - exitRangePx;
  const layerTranslateY =
    scrollStartTranslatePx > 0 && exitArmed && scrollY > scrollStartTranslatePx
      ? scrollY - scrollStartTranslatePx
      : 0;
  const isScrollingUp = scrollY < prevScrollYRef.current;
  const isPastPlane = scrollY >= scrollStartTranslatePx;
  // Exit phase: keep layer at "end" state (progress 1); only Plane uses exitProgress for zoom-in, no reverse of enter
  const exitProgressRaw = scrollY > scrollStartTranslatePx
    ? Math.min(1, Math.max(0, (scrollY - scrollStartTranslatePx) / Math.max(1, exitRangePx)))
    : 0;
  const exitProgress = exitProgressRaw < EXIT_PROGRESS_THRESHOLD ? 0 : exitProgressRaw;
  const planeExitProgress = isScrollingUp ? 0 : exitProgress;
  const exitFade = exitProgress > 0 ? easeInOutQuart(exitProgress) : 0;
  const exitHidden = exitProgress >= 0.999;
  const effectiveParallaxProgress = isScrollingUp
    ? parallaxProgress
    : layerTranslateY > 0
      ? 1
      : parallaxProgress;
  const easedLayerTranslateY = exitProgress > 0 ? easeInOutQuart(exitProgress) * innerHeight : 0;

  // Create portal for fixed layers (desktop only)
  useEffect(() => {
    if (isMobile) return;
    
    const el = document.createElement('div');
    el.id = 'parallax-portal';
    el.style.cssText = 'position:fixed;inset:0;pointer-events:auto;z-index:200;';
    document.body.appendChild(el);
    portalRef.current = el;
    setPortalMounted(true);
    
    return () => {
      el.remove();
      portalRef.current = null;
      setPortalMounted(false);
    };
  }, [isMobile]);

  // Simplified exit arming: arm when scrolling into exit zone with buffer
  useEffect(() => {
    if (isMobile) return;
    const enterBufferPx = innerHeight * 0.2;
    const exitTriggerPx = scrollStartTranslatePx + enterBufferPx;
    const isScrollingDown = scrollY >= prevScrollYRef.current;

    if (isScrollingDown && scrollY >= exitTriggerPx) {
      setExitArmed(true);
    } else if (!isScrollingDown && exitProgressRaw <= EXIT_PROGRESS_THRESHOLD) {
      setExitArmed(false);
    }

    prevScrollYRef.current = scrollY;
  }, [isMobile, scrollY, scrollStartTranslatePx, innerHeight, exitProgressRaw]);
  const exitComplete = scrollY >= scrollStartTranslatePx + exitRangePx;
  const showPlaneLayer = !exitComplete;

  return (
    <>
      {!isMobile && (
        <div className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 999 }} aria-hidden>
          <MailCta />
        </div>
      )}
      
      {!isMobile && portalMounted && portalRef.current && createPortal(
        <>
          {/* Environment */}
          <div className="fixed inset-0 w-full h-full overflow-hidden" style={{ zIndex: 1, pointerEvents: 'none' }} aria-hidden>
            <div className="absolute inset-0 w-full h-full">
              <Experience scrollProgress={scrollProgress} turbulenceRef={turbulenceRef} />
            </div>
          </div>

          {/* Plane + UI Overlay */}
          {showPlaneLayer && (
            <div
              className="fixed inset-0 w-full h-full overflow-visible"
              style={{
                zIndex: 50,
                willChange: 'transform',
                transform: easedLayerTranslateY > 0 ? `translate3d(0, -${easedLayerTranslateY}px, 0)` : 'translate3d(0, 0, 0)',
                opacity: exitHidden ? 0 : 1 - exitFade,
                visibility: exitHidden ? 'hidden' : 'visible',
                pointerEvents: exitComplete ? 'none' : 'auto',
              }}
              aria-hidden
            >
              <UIOverlayMemo scrollProgress={effectiveParallaxProgress} showHeader={false} viewportSize={viewportSize} />
              <PlaneMemo
                scrollProgress={effectiveParallaxProgress}
                exitProgress={planeExitProgress}
                onWindowSelect={handleWindowSelect}
                onTurbulenceChange={setTurbulence}
              />
            </div>
          )}

          {/* Exit message */}
          {exitProgress > 0 && (
            <div
              className="fixed pointer-events-none"
              style={{
                zIndex: 75,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                textAlign: 'center',
                opacity: Math.min(1, exitProgress * 6),
                padding: '0 24px',
              }}
            >
              <p className="font-sans text-white font-light" style={{
                color: '#ffffff',
                maxWidth: '620px',
                lineHeight: 1.8,
                fontSize: 'clamp(0.9rem, 1.9vw, 1.1rem)',
                margin: '0 auto',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}>
                Thank you for flying with Mai today
              </p>
            </div>
          )}

          {/* Case study */}
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

      {isMobile ? (
        <>
          <div className="fixed inset-0">
            <Experience scrollProgress={0} />
          </div>
          <MobileDisclaimer />
        </>
      ) : (
        <div className="relative" style={{ zIndex: 300, pointerEvents: 'none' }}>
          <div
            className="w-full bg-black"
            style={{
              minHeight: `${PARALLAX_SCROLL_HEIGHT_VH - 100 + PARALLAX_DWELL_VH + PARALLAX_EXIT_VH}vh`,
            }}
          />
        </div>
      )}
    </>
  );
};

export default App;