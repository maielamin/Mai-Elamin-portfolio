import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type CaseStudyData = {
  title: string;
  subtitle: string;
  intro: string;
  situation: string | string[];
  task: string[];
  action: string[];
  result: string[];
};

type SectionBlock = {
  eyebrow: string;
  title: string;
  lead: string;
  body: string;
  featureA: { label: string; description: string };
  featureB: { label: string; description: string };
  chartTheme: { lineA: string; lineB: string; glow: string };
};

const CASE_STUDIES: Record<number, CaseStudyData> = {
  0: {
    title: 'The options liquidity layer for DeFi.',
    subtitle: 'Lyra is evolving to be more than just the models.',
    intro: 'It supports an entire ecosystem — from products to the APIs and platforms helping developers and businesses innovate.',
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
    title: 'The options liquidity layer for DeFi.',
    subtitle: 'Lyra is evolving to be more than just the models.',
    intro: 'It supports an entire ecosystem — from products to the APIs and platforms helping developers and businesses innovate.',
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
  2: {
    title: 'The options liquidity layer for DeFi.',
    subtitle: 'Lyra is evolving to be more than just the models.',
    intro: 'It supports an entire ecosystem — from products to the APIs and platforms helping developers and businesses innovate.',
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
  3: {
    title: 'The options liquidity layer for DeFi.',
    subtitle: 'Lyra is evolving to be more than just the models.',
    intro: 'It supports an entire ecosystem — from products to the APIs and platforms helping developers and businesses innovate.',
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

const NAV_LINKS = [
  { key: 'all', label: 'All' },
  { key: '0', label: 'Google Play Store' },
  { key: '1', label: 'Twitter: Quick Promote' },
  { key: '2', label: 'Twitter: Super Follows' },
  { key: '3', label: 'Twitter: Twitter Blue' },
];

const chartPresets = [
  { lineA: '#22d3ee', lineB: '#a855f7', glow: 'rgba(34,211,238,0.35)' },
  { lineA: '#38bdf8', lineB: '#f472b6', glow: 'rgba(56,189,248,0.35)' },
  { lineA: '#a855f7', lineB: '#22d3ee', glow: 'rgba(168,85,247,0.35)' },
];

const CaseStudyView: React.FC<{
  projectIndex: number;
  onClose: () => void;
  onSelectProject?: (index: number) => void;
}> = ({ projectIndex, onClose, onSelectProject }) => {
  const data = CASE_STUDIES[projectIndex];
  const [activeIndex, setActiveIndex] = useState(0);

  const sections = useMemo<SectionBlock[]>(() => {
    if (!data) return [];
    const situation = Array.isArray(data.situation) ? data.situation.join(' ') : data.situation;
    return [
      {
        eyebrow: 'Overview',
        title: data.title,
        lead: data.subtitle,
        body: data.intro,
        featureA: {
          label: 'Faaast',
          description: data.task[0] ?? 'It supports an entire helping developers and innovate.',
        },
        featureB: {
          label: 'Powerful',
          description: data.task[1] ?? 'It supports an entire helping developers and businesses.',
        },
        chartTheme: chartPresets[0],
      },
      {
        eyebrow: 'Process',
        title: 'From idea to impact.',
        lead: 'It supports an entire ecosystem — from products to the APIs and platforms helping developers and businesses innovate.',
        body: [...data.action, situation].join(' • '),
        featureA: {
          label: 'Clarity',
          description: data.action[0] ?? 'Clear preview and confirmation at every step.',
        },
        featureB: {
          label: 'Control',
          description: data.action[1] ?? 'Sensible defaults and undo support.',
        },
        chartTheme: chartPresets[1],
      },
      {
        eyebrow: 'Outcome',
        title: 'Results that move the needle.',
        lead: 'It supports an entire ecosystem — from products to the APIs and platforms helping developers and businesses innovate.',
        body: data.result.join(' • '),
        featureA: {
          label: 'Outcomes',
          description: data.result[0] ?? 'Measured improvements across speed and confidence.',
        },
        featureB: {
          label: 'Momentum',
          description: data.result[1] ?? 'Continued adoption across teams.',
        },
        chartTheme: chartPresets[2],
      },
    ];
  }, [data]);

  if (!data || sections.length === 0) return null;

  return (
    <div className="min-h-screen w-full bg-[#050812] text-white font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 lg:px-10 transition-all duration-300 bg-[#050812]/80 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-xl font-bold bg-gradient-to-r from-[#22d3ee] to-[#a855f7] bg-clip-text text-transparent">
            Lyra
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Ecosystem', 'Protocol', 'Integrations', 'Docs'].map((link) => (
              <a key={link} href="#" className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                {link}
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-4">
            <button className="px-4 py-2 text-sm text-[#9ca3af] border border-white/10 rounded-full hover:border-[#22d3ee] hover:text-white transition-all">
              Sign in
            </button>
            <button className="px-4 py-2 text-sm text-white bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-full hover:shadow-lg hover:shadow-[rgba(59,130,246,0.4)] transition-all">
              Launch app
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 px-6 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(59,130,246,0.12)_0%,transparent_50%),radial-gradient(ellipse_at_70%_20%,rgba(139,92,246,0.08)_0%,transparent_40%)]" />
        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex px-3 py-1 bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.25)] rounded-full text-[#22d3ee] text-xs font-medium tracking-wide">
                Options ecosystem
              </span>
              <h1 className="text-[2.75rem] lg:text-[3.25rem] font-bold leading-[1.1] tracking-tight mt-5 mb-5 text-white">
                The options liquidity layer for DeFi.
              </h1>
              <p className="text-[#9ca3af] text-base leading-relaxed mb-8 max-w-lg">
                Lyra provides the infrastructure for perpetual options trading, connecting protocols, traders, and integrators into a unified liquidity network.
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-full hover:shadow-lg hover:shadow-[rgba(59,130,246,0.4)] hover:-translate-y-0.5 transition-all">
                  Launch app
                </button>
                <button className="px-6 py-2.5 text-sm font-medium text-[#9ca3af] border border-white/10 rounded-full hover:border-[#22d3ee] hover:text-white transition-all flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Read docs
                </button>
              </div>
            </motion.div>

            {/* Right Analytics Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="relative"
            >
              <div className="rounded-2xl border border-white/10 bg-[#0b1020] p-4 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
                {/* Chart Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-[#9ca3af] uppercase tracking-wide">Total Value Locked</span>
                  <span className="text-xl font-bold text-white">$284.5M</span>
                </div>
                {/* Chart Area */}
                <div className="relative h-24 rounded-lg bg-[#0d1119] overflow-hidden mb-3">
                  <svg viewBox="0 0 200 60" className="absolute inset-0 w-full h-full">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,50 Q25,45 50,38 T100,32 T150,22 T200,18 L200,60 L0,60 Z" fill="url(#chartGrad)" />
                    <path d="M0,50 Q25,45 50,38 T100,32 T150,22 T200,18" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-[#0d1119] p-3 text-center">
                    <div className="text-sm font-bold text-white">$1.2B</div>
                    <div className="text-[10px] text-[#9ca3af]">Open Interest</div>
                    <div className="text-[10px] text-[#22d3ee] mt-0.5">+12.5%</div>
                  </div>
                  <div className="rounded-lg bg-[#0d1119] p-3 text-center">
                    <div className="text-sm font-bold text-white">$842M</div>
                    <div className="text-[10px] text-[#9ca3af]">Volume</div>
                    <div className="text-[10px] text-[#22d3ee] mt-0.5">+8.3%</div>
                  </div>
                  <div className="rounded-lg bg-[#0d1119] p-3 text-center">
                    <div className="text-sm font-bold text-white">$46.8M</div>
                    <div className="text-[10px] text-[#9ca3af]">24h Fees</div>
                    <div className="text-[10px] text-[#22d3ee] mt-0.5">+6.1%</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="py-16 px-6 lg:px-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl font-bold text-white mb-3">The Lyra ecosystem</h2>
            <p className="text-[#9ca3af] text-sm max-w-xl mx-auto">
              Lyra connects protocols, traders, and integrators into a unified liquidity network for decentralized options.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '🔷', title: 'Lyra Protocol', desc: 'Smart contract infrastructure for permissionless options trading with automated market making.' },
              { icon: '⚡', title: 'Trader API', desc: 'REST and WebSocket APIs for programmatic trading with real-time pricing and order execution.' },
              { icon: '🔒', title: 'Vaults', desc: 'Permissionless liquidity provision with automated delta hedging and yield generation.' },
              { icon: '⚠️', title: 'Risk Engine', desc: 'Real-time risk calculation and margin management for safe, efficient leverage.' },
              { icon: '🔗', title: 'Integrations', desc: 'Native integrations with major DeFi protocols, aggregators, and trading platforms.' },
              { icon: '🛠️', title: 'Developer Tools', desc: 'SDKs, documentation, and testing environments for building on Lyra.' },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group rounded-xl border border-white/10 bg-[#0b1020] p-4 cursor-pointer hover:border-white/20 hover:bg-[#0f1520] transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(59,130,246,0.2)] flex items-center justify-center text-sm">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">{card.title}</h3>
                    <p className="text-xs text-[#9ca3af] leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-16 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-center mb-10"
          >
            How Lyra fits into your stack
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6"
          >
            {/* Exchanges Box */}
            <div className="rounded-xl border border-white/10 bg-[#0b1020] px-5 py-3 text-center min-w-[140px]">
              <div className="text-xs font-semibold text-white">Exchanges / L1s</div>
              <div className="text-[10px] text-[#9ca3af] mt-0.5">Ethereum, Arbitrum</div>
            </div>
            
            <div className="hidden lg:block text-xl text-[#22d3ee]">→</div>
            <div className="lg:hidden text-lg text-[#22d3ee]">↓</div>
            
            {/* Lyra Protocol Box */}
            <div className="rounded-xl border border-[rgba(59,130,246,0.4)] bg-[rgba(59,130,246,0.08)] px-6 py-4 text-center min-w-[180px]">
              <div className="text-sm font-bold text-white mb-1">Lyra Protocol</div>
              <div className="text-[10px] text-[#9ca3af]">Core smart contracts</div>
              <div className="flex gap-1.5 justify-center mt-2">
                <span className="px-2 py-0.5 text-[9px] rounded-full bg-[rgba(139,92,246,0.2)] text-[#a855f7] border border-[rgba(139,92,246,0.25)]">Risk</span>
                <span className="px-2 py-0.5 text-[9px] rounded-full bg-[rgba(139,92,246,0.2)] text-[#a855f7] border border-[rgba(139,92,246,0.25)]">Pricing</span>
                <span className="px-2 py-0.5 text-[9px] rounded-full bg-[rgba(139,92,246,0.2)] text-[#a855f7] border border-[rgba(139,92,246,0.25)]">Settlement</span>
              </div>
            </div>
            
            <div className="hidden lg:block text-xl text-[#22d3ee]">→</div>
            <div className="lg:hidden text-lg text-[#22d3ee]">↓</div>
            
            {/* Traders Box */}
            <div className="rounded-xl border border-white/10 bg-[#0b1020] px-5 py-3 text-center min-w-[140px]">
              <div className="text-xs font-semibold text-white">Traders / Frontends</div>
              <div className="text-[10px] text-[#9ca3af] mt-0.5">DApps, APIs</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10 py-12">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <div className="space-y-14">
            {sections.map((section, index) => (
              <ContentSection
                key={`${section.eyebrow}-${index}`}
                index={index}
                section={section}
                onVisible={() => setActiveIndex(index)}
              />
            ))}
          </div>

          {/* Sticky Chart */}
          <div className="relative hidden lg:block">
            <div className="sticky top-24">
              <div className="rounded-2xl border border-white/10 bg-[#0b1020] p-2">
                <div className="rounded-xl border border-white/5 bg-[#0c0d12] overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeIndex}
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <ChartGraphic theme={sections[activeIndex].chartTheme} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-[#050812]">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10 py-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-xs text-[#9ca3af] hover:text-white transition-colors"
            aria-label="Back to projects"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <nav className="flex flex-wrap items-center gap-4 text-xs text-[#9ca3af]">
            {NAV_LINKS.map((link) => (
              <button
                key={link.key}
                type="button"
                onClick={() => {
                  if (link.key === 'all') {
                    onClose();
                    return;
                  }
                  const index = Number(link.key);
                  if (Number.isNaN(index) || !onSelectProject) return;
                  onSelectProject(index);
                }}
                className={`transition-colors ${
                  link.key === String(projectIndex)
                    ? 'text-white'
                    : 'text-[#9ca3af] hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
};

const ContentSection: React.FC<{
  index: number;
  section: SectionBlock;
  onVisible: () => void;
}> = ({ index, section, onVisible }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = React.useMemo(() => {
    if (!ref.current) return false;
    const rect = ref.current.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.8 && rect.bottom > 0;
  }, [ref]);

  React.useEffect(() => {
    if (inView) onVisible();
  }, [inView, onVisible]);

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2.5 text-[10px] uppercase tracking-[0.2em] text-[#9ca3af]">
        <span className="text-[#22d3ee]">{String(index + 1).padStart(2, '0')}</span>
        <span>{section.eyebrow}</span>
      </div>
      <h2 className="text-xl sm:text-2xl font-bold leading-tight text-white">
        {section.title}
      </h2>
      <p className="text-xs text-[#9ca3af] max-w-md">
        <span className="text-white font-medium">{section.lead}</span>
      </p>
      <p className="text-xs text-[#9ca3af] leading-relaxed max-w-lg">
        {section.body}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-[#22d3ee]">{section.featureA.label}</div>
          <p className="text-[10px] text-[#9ca3af]">{section.featureA.description}</p>
        </div>
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-[#a855f7]">{section.featureB.label}</div>
          <p className="text-[10px] text-[#9ca3af]">{section.featureB.description}</p>
        </div>
      </div>
    </motion.section>
  );
};

const ChartGraphic: React.FC<{ theme: { lineA: string; lineB: string; glow: string } }> = ({ theme }) => (
  <div className="absolute inset-0 p-3">
    <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.04), transparent 50%)' }} />
    <svg viewBox="0 0 400 200" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="glowGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={theme.lineA} stopOpacity="0.08" />
          <stop offset="100%" stopColor={theme.lineA} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <g stroke="rgba(255,255,255,0.04)">
        {[...Array(5)].map((_, i) => (
          <line key={i} x1="20" y1={35 + i * 35} x2="380" y2={35 + i * 35} />
        ))}
      </g>
      <path
        d="M20 160 Q60 150 100 140 T180 110 T260 125 T340 80 T380 90"
        fill="none"
        stroke={theme.lineA}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 175 Q60 170 100 160 T180 155 T260 150 T340 135 T380 130"
        fill="none"
        stroke={theme.lineB}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 160 Q60 150 100 140 T180 110 T260 125 T340 80 T380 90"
        fill="none"
        stroke="url(#glowGrad)"
        strokeWidth="6"
        opacity="0.4"
        strokeLinecap="round"
      />
    </svg>
    <div className="absolute inset-0" style={{ pointerEvents: 'none', boxShadow: `inset 0 0 40px ${theme.glow}` }} />
  </div>
);

export default CaseStudyView;
