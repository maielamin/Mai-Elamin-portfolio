// Case study: editorial single-column, hero, STAR, scroll reveal — modern / futuristic
import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const STAR = '★';

const revealVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.05 + i * 0.04,
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

const SECTION_IDS = ['situation', 'task', 'action', 'result'] as const;
const SECTION_LABELS: Record<(typeof SECTION_IDS)[number], string> = {
  situation: 'Situation',
  task: 'Task',
  action: 'Action',
  result: 'Result',
};

type CaseStudyData = {
  title: string;
  subtitle: string;
  intro: string;
  situation: string | string[];
  task: string[];
  action: string[];
  result: string[];
  heroImage?: string;
};

const CASE_STUDIES: Record<number, CaseStudyData> = {
  0: {
    title: 'Bulk management',
    subtitle: 'Product Designer for Deliveroo — merchant tools and operations.',
    intro: 'Designing tools that let restaurant partners manage menus, items, and categories at scale.',
    situation:
      'Merchants needed to update many items or categories without repeating the same steps. Existing flows were slow and error-prone at scale.',
    task: [
      'Challenges with existing merchant tools',
      'Time spent on repetitive tasks',
      'Need for confidence when making bulk changes',
    ],
    action: [
      'Bulk selection and multi-edit',
      'Clear preview and confirmation',
      'Sensible defaults and undo support',
    ],
    result: [
      'Faster bulk operations',
      'Higher merchant satisfaction',
      'Fewer support tickets',
    ],
  },
  1: {
    title: 'Quick Promote',
    subtitle: 'Product Designer for Mailchimp, Quick Promote at Squarespace and Digital Health UX.',
    intro: 'A feature for professional accounts to turn Tweets into an Ad — simplifying promotion for small businesses with limited time and budget.',
    situation:
      'Small businesses struggle to promote content effectively. Challenges include time constraints, lack of analytics understanding, and budget limitations with existing promotion platforms.',
    task: [
      'Challenges with existing promotion platforms',
      'Time constraints',
      'Lack of analytics understanding',
      'Budget limitations',
    ],
    action: [
      'Simplified campaign creation',
      'AI-powered content suggestions',
      'Intuitive performance tracking',
      'Flexible budgeting options',
      'Integration with key social media platforms',
    ],
    result: [
      'Increased campaign creation speed',
      'Improved user engagement',
      'Higher ROI for small businesses',
      'Positive user feedback and testimonials',
    ],
  },
};

const CASE_STUDY_INDICES = Object.keys(CASE_STUDIES).map(Number) as number[];
const FOOTER_LABELS: Record<number, string> = {
  0: 'Deliveroo: Bulk management',
  1: 'Twitter: Quick Promote',
};

const ACCENT = '#0c4a6e';
const ACCENT_MUTED = 'rgba(12, 74, 110, 0.5)';

const CaseStudySection: React.FC<{
  index: number;
  starTitle: string;
  id: (typeof SECTION_IDS)[number];
  children: React.ReactNode;
}> = ({ index, starTitle, id, children }) => {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px 0px -60px 0px' });

  return (
    <motion.section
      ref={ref}
      id={id}
      custom={index}
      variants={revealVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className="relative"
    >
      <div className="flex gap-6 sm:gap-8">
        <div
          className="shrink-0 w-px min-h-[1.5em] mt-1"
          style={{ background: `linear-gradient(to bottom, ${ACCENT}, ${ACCENT_MUTED})` }}
          aria-hidden
        />
        <div className="flex-1 min-w-0 pb-16 sm:pb-20">
          <p
            className="font-sans text-black/50 font-normal tracking-wide uppercase text-xs sm:text-[13px] mb-3"
            style={{ letterSpacing: '0.12em' }}
          >
            {String(index + 1).padStart(2, '0')} — {starTitle}
          </p>
          <div
            className="font-sans font-light leading-[1.7] text-black/85"
            style={{ fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)' }}
          >
            {children}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

const CaseStudyView: React.FC<{
  projectIndex: number;
  onClose: () => void;
  onSelectProject?: (index: number) => void;
}> = ({ projectIndex, onClose, onSelectProject }) => {
  const data = CASE_STUDIES[projectIndex];
  if (!data) return null;

  const situationContent = Array.isArray(data.situation) ? data.situation : [data.situation];

  return (
    <div className="min-h-full w-full bg-white antialiased" style={{ isolation: 'isolate' }}>
      {/* Back — floating, minimal */}
      <motion.button
        type="button"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
        className="fixed top-5 left-5 sm:top-6 sm:left-6 z-20 font-sans text-black/60 hover:text-black text-[13px] sm:text-sm font-normal flex items-center gap-2 transition-colors rounded-full pl-2.5 pr-3.5 py-2 hover:bg-black/[0.06] touch-manipulation"
        style={{ margin: 0 }}
        aria-label="Back to projects"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </motion.button>

      {/* Hero — full-bleed, no card */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
        className="relative w-full min-h-[50vh] sm:min-h-[55vh] flex flex-col justify-end overflow-hidden"
        style={{
          background: data.heroImage
            ? `linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 45%), url(${data.heroImage}) center center / cover no-repeat`
            : 'linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        }}
      >
        <div className="relative z-10 px-5 sm:px-8 pb-10 sm:pb-14 pt-24 sm:pt-28 max-w-3xl">
          <h1
            className="font-noto-condensed text-white font-semibold tracking-tight mb-2"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', lineHeight: 1.1, letterSpacing: '-0.02em' }}
          >
            {data.title}
          </h1>
          <p className="font-sans text-white/80 font-light text-sm sm:text-base max-w-xl" style={{ letterSpacing: '0.01em' }}>
            {data.subtitle}
          </p>
        </div>
      </motion.header>

      {/* Intro — first block, no card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
        className="px-5 sm:px-8 pt-12 sm:pt-16 pb-6 max-w-2xl"
      >
        <p className="font-sans text-black/70 font-light leading-[1.75] text-base sm:text-lg">
          {data.intro}
        </p>
      </motion.div>

      {/* Jump links — horizontal, minimal */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.35 }}
        className="px-5 sm:px-8 pb-10 sm:pb-12 max-w-2xl flex flex-wrap gap-x-6 gap-y-1"
        aria-label="Sections"
      >
        {SECTION_IDS.map((id) => (
          <a
            key={id}
            href={`#${id}`}
            className="font-sans text-black/45 hover:text-black text-[13px] font-normal transition-colors"
          >
            {SECTION_LABELS[id]}
          </a>
        ))}
      </motion.nav>

      {/* STAR — single column, no cards */}
      <div className="px-5 sm:px-8 max-w-2xl">
        <CaseStudySection index={0} starTitle="Situation" id="situation">
          {situationContent.length === 1 ? (
            <p>{situationContent[0]}</p>
          ) : (
            <ul className="list-none pl-0 space-y-2">
              {situationContent.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-black/30 shrink-0" aria-hidden>—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </CaseStudySection>

        <CaseStudySection index={1} starTitle="Task" id="task">
          <ul className="list-none pl-0 space-y-2">
            {data.task.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-black/30 shrink-0" aria-hidden>—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CaseStudySection>

        <CaseStudySection index={2} starTitle="Action" id="action">
          <ul className="list-none pl-0 space-y-2">
            {data.action.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-black/30 shrink-0" aria-hidden>—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CaseStudySection>

        <CaseStudySection index={3} starTitle="Result" id="result">
          <ul className="list-none pl-0 space-y-2">
            {data.result.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-black/30 shrink-0" aria-hidden>—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CaseStudySection>
      </div>

      {/* Footer — minimal line */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 sm:mt-12 px-5 sm:px-8 py-6 border-t border-black/[0.06] max-w-2xl mx-auto"
      >
        <nav
          className="flex flex-wrap items-center gap-x-5 gap-y-1 font-sans text-[13px] text-black/50"
          aria-label="Case study navigation"
        >
          <button type="button" onClick={onClose} className="hover:text-black transition-colors">
            All
          </button>
          {CASE_STUDY_INDICES.map((index) => {
            const label = FOOTER_LABELS[index] ?? CASE_STUDIES[index]?.title ?? `Project ${index}`;
            const isActive = index === projectIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={() => onSelectProject?.(index)}
                className={`transition-colors ${isActive ? 'text-black font-medium' : 'hover:text-black'}`}
              >
                {label}
              </button>
            );
          })}
        </nav>
      </motion.footer>
    </div>
  );
};

export default CaseStudyView;
