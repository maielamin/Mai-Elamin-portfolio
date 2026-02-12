// Mask-expand transition: logo over-expands, white rectangle grows from tapped window to full screen, then case study (frosted glass) appears
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CaseStudyView from './CaseStudyView';
import { DeliverooLogoSvg, OldTwitterLogoSvg, SchoolIconSvg } from './Plane';

const EXPAND_DURATION = 0.32; // mask opens to full white — slightly longer for a cleaner reveal
const LOGO_OVER_EXPAND_DURATION = 0.12;
const WHITE_HOLD = 0.12; // brief full-white hold before content fades in
const EASE_EXPAND = [0.22, 0.72, 0, 1] as const; // smooth decelerate into full screen
const LOGO_OVER_EXPAND_SCALE = 3.2; // logo expands so the circle becomes full white

/** Scale needed so the rect, when scaled from its center, fully covers the viewport. */
function getScaleToCover(rect: DOMRect): number {
  const w = typeof window === 'undefined' ? 1920 : window.innerWidth;
  const h = typeof window === 'undefined' ? 1080 : window.innerHeight;
  const rw = Math.max(1, rect.width);
  const rh = Math.max(1, rect.height);
  // Scaled from center: edges are at center ± (size * s) / 2. For left edge ≤ 0, right ≥ w, etc.:
  const sLeft = 1 + (2 * rect.left) / rw;
  const sRight = (2 * w - 2 * rect.left) / rw - 1;
  const sTop = 1 + (2 * rect.top) / rh;
  const sBottom = (2 * h - 2 * rect.top) / rh - 1;
  const scale = Math.max(sLeft, sRight, sTop, sBottom, 1);
  return scale * 1.12; // buffer so white fully fills the screen
}

const CaseStudyTransition: React.FC<{
  projectIndex: number;
  expandRect: DOMRect | null;
  onClose: () => void;
  onSelectProject?: (index: number) => void;
}> = ({ projectIndex, expandRect, onClose, onSelectProject }) => {
  const [phase, setPhase] = useState<'expanding' | 'white' | 'case-study'>('expanding');
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!expandRect) return;
    setRect(expandRect);
    setPhase('expanding');
  }, [expandRect]);

  useEffect(() => {
    if (phase !== 'expanding' || !rect) return;
    const t = setTimeout(() => setPhase('white'), EXPAND_DURATION * 1000);
    return () => clearTimeout(t);
  }, [phase, rect]);

  useEffect(() => {
    if (phase !== 'white') return;
    const t = setTimeout(() => setPhase('case-study'), WHITE_HOLD * 1000);
    return () => clearTimeout(t);
  }, [phase]);

  if (rect == null || expandRect == null) return null;

  const scaleToCover = getScaleToCover(rect);

  const LogoComponent =
    projectIndex === 0 ? DeliverooLogoSvg : projectIndex === 1 ? OldTwitterLogoSvg : SchoolIconSvg;

  return (
    <>
      <AnimatePresence>
        {(phase === 'expanding' || phase === 'white') && (
          <motion.div
            key="mask-expand"
            className="fixed pointer-events-none flex items-center justify-center"
            style={{
              zIndex: 40,
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              borderRadius: 9999,
              transformOrigin: '50% 50%',
              willChange: 'transform',
            }}
            initial={{ scale: 1 }}
            animate={{ scale: scaleToCover }}
            transition={{
              duration: EXPAND_DURATION,
              ease: [0.32, 0.72, 0, 1] as const,
            }}
          >
            {/* Background: starts dark so white logo is visible, then transitions to white as it fills */}
            <motion.div
              className="absolute inset-0 rounded-[9999px]"
              initial={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
              animate={{ backgroundColor: 'rgba(255, 255, 255, 1)' }}
              transition={{ duration: EXPAND_DURATION * 0.7, ease: [0.32, 0.72, 0, 1] as const }}
            />
            {/* Logo stays white (like on the plane), over-expands then fades */}
            <motion.span
              className="absolute"
              style={{
                width: '28%',
                height: '28%',
                maxWidth: '28%',
                maxHeight: '28%',
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))',
              }}
              initial={{ scale: 1, opacity: 1 }}
              animate={{
                scale: LOGO_OVER_EXPAND_SCALE,
                opacity: 0,
              }}
              transition={{
                scale: { duration: LOGO_OVER_EXPAND_DURATION, ease: [0.2, 0.8, 0, 1] as const },
                opacity: { duration: 0.12, delay: LOGO_OVER_EXPAND_DURATION * 0.5 },
              }}
            >
              <LogoComponent
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  fill: '#fff',
                  color: '#fff',
                }}
              />
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full white page: mask has "opened" to reveal the case study surface */}
      {phase === 'case-study' && (
        <div
          className="fixed inset-0 bg-white"
          style={{ zIndex: 40 }}
          aria-hidden
        />
      )}

      <AnimatePresence mode="wait">
        {phase === 'case-study' && (
          <motion.div
            key="case-study"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE_EXPAND }}
            className="fixed inset-0 overflow-y-auto overflow-x-hidden"
            style={{ zIndex: 41 }}
          >
            <CaseStudyView projectIndex={projectIndex} onClose={onClose} onSelectProject={onSelectProject} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CaseStudyTransition;
