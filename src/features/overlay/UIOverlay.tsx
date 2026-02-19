// Import standard React library
import React, { useMemo } from 'react';
// Import framer-motion components and types for premium UI animations
import { motion, Variants } from 'framer-motion';


const CONTACT_EMAIL = 'maielamin@hotmail.com';
const MAILTO_HREF = `mailto:${CONTACT_EMAIL}`;

export const MailCta: React.FC = () => (
    <header
        style={{
            position: 'absolute',
            top: 0,
            right: 0,
            padding: '24px',
            paddingTop: 'max(24px, env(safe-area-inset-top))',
            zIndex: 70,
            pointerEvents: 'auto',
            opacity: 1,
        }}
    >
        <motion.a
            href={MAILTO_HREF}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ color: '#fb923c' }}
            transition={{
                opacity: { delay: 0.8, duration: 0.6 },
                color: { duration: 0 },
            }}
            className="rounded-full active:scale-95 select-none no-underline touch-manipulation origin-center group"
            style={{
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
            }}
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
        </motion.a>
    </header>
);

/**
 * UIOverlay component: Handles the cinematic text reveal and scroll-driven parallax on top of the 3D scene
 */
const UIOverlay: React.FC<{ scrollProgress?: number; showHeader?: boolean; viewportSize?: { width: number; height: number } }> = ({ scrollProgress = 0, showHeader = true, viewportSize = { width: 0, height: 0 } }) => {

    const subtitle = "Made vibe coding";

    // Environment fades in first, then heading starts
    const ENV_FADE_DURATION = 0.1;
    const titleVariants: Variants = {
        hidden: {
            opacity: 0,
            filter: 'blur(15px)',
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            transition: {
                duration: 1.5,
                delay: ENV_FADE_DURATION,
                ease: "easeInOut",
            } as any,
        },
    };

    const subtitleVariants: Variants = {
        hidden: {
            opacity: 0,
            filter: 'blur(10px)',
        },
        visible: {
            opacity: 0.8,
            filter: 'blur(0px)',
            transition: {
                duration: 1.5,
                delay: ENV_FADE_DURATION,
                ease: "easeInOut",
            } as any,
        },
    };


    // Helper for fade-in/out opacity calculation
    const fadeInOut = (start: number, peak: number, end: number, progress: number) => {
        if (progress <= start || progress >= end) return 0;
        return progress < peak
            ? (progress - start) / (peak - start)
            : (end - progress) / (end - peak);
    };

    // Parallax and fade values
    const parallaxY = scrollProgress * -220;
    const contentOpacity = Math.max(0, 1 - scrollProgress * 2.2);
    const bioOpacity = fadeInOut(0.42, 0.58, 0.74, scrollProgress);
    const onboardOpacity = fadeInOut(0.73, 0.81, 0.90, scrollProgress);

    // Responsive header font size (eases smaller as screen narrows below 990px)
    const responsiveHeaderFontSize = useMemo(() => {
        if (viewportSize.width <= 0) {
            return 'clamp(2.8rem, 7vw, 6.5rem)'; // fallback for desktop
        }
        // Calculate easing factor: 0 at 990px (no change), 1 at 480px (max reduction)
        const maxWidth = 990;
        const minWidth = 480;
        const easeT = Math.max(0, Math.min(1, (maxWidth - viewportSize.width) / (maxWidth - minWidth)));
        // Ease from desktop clamp to mobile clamp
        // Desktop: clamp(2.95rem, 7vw, 6.65rem)
        // Mobile: clamp(1.75rem, 6.2vw, 2.45rem)
        const desktopMin = 2.95;
        const desktopMax = 6.65;
        const mobileMin = 1.75;
        const mobileMax = 2.45;
        const easeInQuad = easeT * easeT;
        const minVal = desktopMin - (desktopMin - mobileMin) * easeInQuad;
        const maxVal = desktopMax - (desktopMax - mobileMax) * easeInQuad;
        return `clamp(${minVal.toFixed(2)}rem, 7vw, ${maxVal.toFixed(2)}rem)`;
    }, [viewportSize.width]);

    // Responsive subtitle font size
    const responsiveSubtitleFontSize = useMemo(() => {
        if (viewportSize.width <= 0) {
            return '1.25rem'; // fallback
        }
        const maxWidth = 990;
        const minWidth = 480;
        const easeT = Math.max(0, Math.min(1, (maxWidth - viewportSize.width) / (maxWidth - minWidth)));
        const easeInQuad = easeT * easeT;
        const desktopVal = 1.25;
        const mobileVal = 0.9;
        const value = desktopVal - (desktopVal - mobileVal) * easeInQuad;
        return `${value.toFixed(2)}rem`;
    }, [viewportSize.width]);

    // Responsive vertical offset (lower header/subtitle as screen gets smaller)
    const responsiveVerticalOffset = useMemo(() => {
        if (viewportSize.height <= 0) return 0;
        const maxWidth = 1200;
        const minWidth = 480;
        const easeT = Math.max(0, Math.min(1, (maxWidth - viewportSize.width) / (maxWidth - minWidth)));
        const easeInQuad = easeT * easeT;
        // Move down 0-350px as screen narrows from 1200px to 480px
        return easeInQuad * 350;
    }, [viewportSize.width, viewportSize.height]);

    const BIO_TEXT = "Hey it's Mai! A senior product designer learning AI and travelling the world. Previously at Twitter, Google, Ford and Deliveroo by DoorDash.";

    // Responsive vertical offset for bio/onboarding (projects onboard)
    const projectsVerticalOffset = useMemo(() => {
        if (viewportSize.height <= 0) return 0;
        const maxWidth = 1200;
        const minWidth = 480;
        const easeT = Math.max(0, Math.min(1, (maxWidth - viewportSize.width) / (maxWidth - minWidth)));
        const easeInQuad = easeT * easeT;
        // Move down 0-700px as screen narrows from 1200px to 480px
        return easeInQuad * 700;
    }, [viewportSize.width, viewportSize.height]);

    return (
        <section id="hero" style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 10, overflow: 'visible' }}>
            {showHeader && <MailCta />}

            {/* MAIN CONTENT */}
            <div
                style={{
                    position: 'absolute',
                    top: '46%',
                    left: '50%',
                    transform: `translate3d(-50%, calc(-50% + ${parallaxY}px), 0)`,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    opacity: contentOpacity,
                    willChange: 'transform, opacity',
                }}
            >
                <div className="pt-8 pb-0 px-6 perspective-[1000px]" style={{ width: '100%', textAlign: 'center' }}>
                    <motion.h1
                        className="font-noto-condensed text-white tracking-[-0.02em] select-none origin-center"
                        initial="hidden"
                        animate="visible"
                        variants={titleVariants}
                        style={{
                            fontFeatureSettings: '"liga" 0',
                            color: '#ffffff',
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                            fontSize: responsiveHeaderFontSize,
                            lineHeight: 1.0,
                            letterSpacing: '-0.02em',
                            opacity: scrollProgress < 0.45 ? Math.max(0.5, 1 - scrollProgress * 1.2) : 0,
                            filter: scrollProgress < 0.45 ? 'blur(0px)' : 'blur(15px)',
                        }}
                    >
                        Come <span style={{ letterSpacing: '0.08em' }}>fly</span> with Mai
                    </motion.h1>
                </div>

                <motion.p
                    className="font-hk text-white font-medium select-none"
                    initial="hidden"
                    animate="visible"
                    variants={subtitleVariants}
                    style={{ 
                        textShadow: 'none', 
                        marginTop: '-1.2em', 
                        fontSize: responsiveSubtitleFontSize, 
                        color: 'rgba(255, 255, 255, 0.8)',
                        opacity: scrollProgress < 0.45 ? Math.max(0.5, 1 - scrollProgress * 1.2) : 0,
                    }}
                >
                    {subtitle}
                </motion.p>
            </div>

            {/* SCROLL DOWN */}
            <div
                style={{
                    position: 'absolute',
                    top: 'calc(45% + 320px)',
                    left: 0,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `translate3d(0, ${parallaxY}px, 0)`,
                    opacity: contentOpacity,
                }}
            >
                <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: [0, 6, 0, 6, 0] }}
                    transition={{ 
                        opacity: { delay: 1.0, duration: 0.4 },
                        y: { delay: 1.0, duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
                    }}
                >
                    <span className="font-hk text-white text-sm" style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Scroll down</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white" style={{ color: '#ffffff', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                        <path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </motion.div>
            </div>

            {/* BIO */}
            <div
                style={{
                    position: 'absolute',
                    top: '48%',
                    left: '50%',
                    transform: `translate(-50%, calc(-50% + ${projectsVerticalOffset}px))`,
                    width: '100%',
                    textAlign: 'center',
                    opacity: bioOpacity,
                    pointerEvents: 'none',
                    padding: '0 24px'
                }}
            >
                <p className="font-sans text-white font-light mx-auto drop-shadow-md" style={{ color: '#ffffff', maxWidth: '620px', lineHeight: 1.8, fontSize: 'clamp(0.9rem, 1.9vw, 1.1rem)' }}>
                    {BIO_TEXT}
                </p>
            </div>

            {/* ONBOARDING */}
            <div
                style={{
                    position: 'absolute',
                    top: '52%',
                    left: '50%',
                    transform: `translate(-50%, calc(-50% + ${projectsVerticalOffset}px))`,
                    width: '100%',
                    textAlign: 'center',
                    opacity: onboardOpacity,
                    pointerEvents: 'none',
                    padding: '0 24px'
                }}
            >
                <p className="font-sans text-white font-light mx-auto drop-shadow-md" style={{ color: '#ffffff', maxWidth: '620px', lineHeight: 1.8, fontSize: 'clamp(0.9rem, 1.9vw, 1.1rem)' }}>
                    Fasten your seatbelt
                </p>
            </div>
        </section>
    );
};

// Export the UIOverlay component as the default export
export default UIOverlay;
