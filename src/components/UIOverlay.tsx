// Import standard React library
import React from 'react';
// Import framer-motion components and types for premium UI animations
import { motion, Variants } from 'framer-motion';


/**
 * UIOverlay component: Handles the cinematic text reveal and scroll-driven parallax on top of the 3D scene
 */
const UIOverlay: React.FC<{ scrollProgress?: number; skyColor?: string }> = ({ scrollProgress = 0, skyColor = '#2563eb' }) => {

    // Definining the content strings for the headline and the attribution line
    const subtitle = "Made vibe coding";

    /**
     * Premium Blur-in / Focus-in animation variants for the main heading.
     * Starts out of focus and resolving into sharp clarity.
     */
    // Environment fades in first, then heading starts. Reduced to 0.1s for faster debugging/visibility.
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

    /**
     * Staggered animation variants for the subtitle description.
     */
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

    /**
     * Animation variants for the footer scroll indicator
     */
    const footerVariants: Variants = {
        hidden: {
            opacity: 0,
            y: 20
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                delay: ENV_FADE_DURATION + 2.5, // Appears last to guide the user's eye
                duration: 2,
                ease: [0.16, 1, 0.3, 1],
            } as any,
        },
    };

    // Parallax: move content up in lockstep with plane layer (same eased progress from App)
    const parallaxY = scrollProgress * -220; // px upward — matches "fly into" plane scale
    // Fade so title hands off to plane: content gone by ~45% scroll, footer by ~25%
    const contentOpacity = Math.max(0, 1 - scrollProgress * 2.2);
    const footerOpacity = Math.max(0, 1 - scrollProgress * 10);
    const footerTranslateY = scrollProgress * -150; // moves upward as user scrolls

    // Bio layer: visible halfway between start and end (before the plane layer takes over)
    const BIO_START = 0.42;
    const BIO_PEAK = 0.58;
    const BIO_END = 0.74;
    const bioOpacity =
        scrollProgress <= BIO_START
            ? 0
            : scrollProgress >= BIO_END
                ? 0
                : scrollProgress < BIO_PEAK
                    ? (scrollProgress - BIO_START) / (BIO_PEAK - BIO_START)
                    : (BIO_END - scrollProgress) / (BIO_END - BIO_PEAK);
    const BIO_TEXT =
        "Hey it's Mai! A senior product designer learning AI and travelling the world. Previously at Twitter, Google, Ford and Deliveroo by DoorDash.";

    // Onboarding: visible right before the plane layer takes over (later in scroll)
    const ONBOARD_START = 0.72;
    const ONBOARD_PEAK = 0.80;
    const ONBOARD_END = 0.89;
    const onboardOpacity =
        scrollProgress <= ONBOARD_START
            ? 0
            : scrollProgress >= ONBOARD_END
                ? 0
                : scrollProgress < ONBOARD_PEAK
                    ? (scrollProgress - ONBOARD_START) / (ONBOARD_PEAK - ONBOARD_START)
                    : (ONBOARD_END - scrollProgress) / (ONBOARD_END - ONBOARD_PEAK);

    // End message: visible at the very end
    const END_START = 0.95;
    const END_PEAK = 0.98;
    const END_END = 1.0;
    const endOpacity =
        scrollProgress <= END_START
            ? 0
            : scrollProgress >= END_END
                ? 1
                : (scrollProgress - END_START) / (END_PEAK - END_START);

    const contactEmail = 'maielamin@hotmail.com';
    const mailtoHref = `mailto:${contactEmail}`;

    return (
        // Hero section: all UI elements layered over the 3D environment
        <section id="hero" style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 60, overflow: 'hidden' }}>

            {/* HEADER: Top Right */}
            <header
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    padding: '24px',
                    paddingTop: 'max(24px, env(safe-area-inset-top))',
                    zIndex: 70,
                    pointerEvents: contentOpacity > 0.1 ? 'auto' : 'none',
                    opacity: contentOpacity,
                }}
            >
                <motion.a
                    href={mailtoHref}
                    initial={{ opacity: 0, scale: 0.8, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                        delay: 0.8,
                        duration: 1.2,
                        ease: [0.16, 1, 0.3, 1]
                    }}
                    className="rounded-full active:scale-95 transition-all duration-500 select-none no-underline touch-manipulation origin-center group"
                    style={{
                        width: '48px',
                        height: '48px',
                        display: 'grid',
                        placeItems: 'center',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1.5px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '50%',
                        boxShadow: '0 0 0 1.5px rgba(255, 255, 255, 0.6), 0 16px 32px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
                        backdropFilter: 'blur(40px) saturate(1.8)',
                        WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
                        cursor: 'pointer',
                        outline: 'none',
                    }}
                    aria-label={`Contact me by email to ${contactEmail}`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 -960 960 960"
                        fill="#ffffff"
                        className="group-hover:scale-110 transition-transform duration-500"
                        style={{ width: '24px', height: '24px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                    >
                        <path d="M80-40v-80h800v80H80Zm80-120v-240q-33-54-51-114.5T91-638q0-61 15.5-120T143-874q8-21 26-33.5t40-12.5q31 0 53 21t18 50l-11 91q-6 48 8.5 91t43.5 75.5q29 32.5 70 52t89 19.5q60 0 120.5 12.5T706-472q45 23 69.5 58.5T800-326v166H160Zm80-80h480v-86q0-24-12-42.5T674-398q-41-20-95-31t-99-11q-66 0-122.5-27t-96-72.5Q222-585 202-644.5T190-768q-10 30-14.5 64t-4.5 66q0 58 20.5 111.5T240-422v182Zm127-367q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47Zm169.5-56.5Q560-687 560-720t-23.5-56.5Q513-800 480-800t-56.5 23.5Q400-753 400-720t23.5 56.5Q447-640 480-640t56.5-23.5ZM320-160v-37q0-67 46.5-115T480-360h160v80H480q-34 0-57 24.5T400-197v37h-80Zm160-80Zm0-480Z" />
                    </svg>
                </motion.a>
            </header>

            {/* MAIN CONTENT: Centered using absolute positioning + transform */}
            <div
                style={{
                    position: 'absolute',
                    top: '45%',
                    left: '50%',
                    transform: `translate3d(-50%, calc(-50% + ${parallaxY}px), 0)`,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    zIndex: 60,
                    opacity: contentOpacity,
                    willChange: 'transform, opacity',
                }}
            >
                <div className="pt-8 pb-0 px-6 perspective-[1000px]" style={{ width: '100%', textAlign: 'center' }}>
                    <motion.h1
                        variants={titleVariants}
                        initial="hidden"
                        animate="visible"
                        className="font-noto-condensed text-white tracking-[-0.02em] select-none origin-center"
                        style={{
                            fontFeatureSettings: '"liga" 0',
                            color: '#ffffff',
                            textShadow: '0 4px 24px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
                            fontSize: 'clamp(2.5rem, 6vw, 6rem)',
                            lineHeight: 1.0,
                        }}
                    >
                        Come <span style={{ letterSpacing: '0.08em' }}>fly</span> with Mai
                    </motion.h1>
                </div>

                <motion.p
                    variants={subtitleVariants}
                    initial="hidden"
                    animate="visible"
                    // Using inline margin-top to force the position, as tailwind -mt-6 wasn't updating visually for user
                    className="font-hk text-white font-medium select-none"
                    style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)', marginTop: '-1.3em', fontSize: '1.25rem', color: '#ffffff' }}
                >
                    {subtitle}
                </motion.p>
            </div>

            {/* SCROLL DOWN: 300px below subtitle */}
            <div
                style={{
                    position: 'absolute',
                    top: 'calc(45% + 350px)',
                    left: 0,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `translate3d(0, ${parallaxY}px, 0)`,
                    opacity: contentOpacity,
                    zIndex: 60,
                }}
            >
                <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: [0, 6, 0] }}
                    transition={{ delay: 2.6, duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <span className="font-hk text-white text-sm" style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Scroll down</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white" style={{ color: '#ffffff', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                        <path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </motion.div>
            </div>

            {/* BIO: Centered */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    textAlign: 'center',
                    opacity: bioOpacity,
                    pointerEvents: 'none',
                    padding: '0 24px'
                }}
            >
                <p className="font-sans text-white text-lg font-light mx-auto drop-shadow-md" style={{ color: '#ffffff', maxWidth: '620px', lineHeight: 1.8 }}>
                    {BIO_TEXT}
                </p>
            </div>

            {/* ONBOARDING: Centered */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    textAlign: 'center',
                    opacity: onboardOpacity,
                    pointerEvents: 'none',
                    padding: '0 24px'
                }}
            >
                <p className="font-sans text-white text-lg font-light mx-auto drop-shadow-md" style={{ color: '#ffffff', maxWidth: '620px', lineHeight: 1.8 }}>
                    Fasten your seatbelt
                </p>
            </div>


        </section>
    );
};

// Export the UIOverlay component as the default export
export default UIOverlay;
