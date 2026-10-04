import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useTheme } from '../../context/ThemeContext';

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  borderGlowColor?: string;
  enableTilt?: boolean;
  tiltIntensity?: number;
  interactive?: boolean;
}

/**
 * SpotlightCard — Ultra-Luxury Cursor-Tracking Spotlight & 3D Tilt Component
 * Inspired by Aceternity UI, ReactBits.dev, and Kokonut UI.
 * 
 * Features:
 * - 120 FPS hardware-accelerated mouse-tracking radial spotlight
 * - Precision cursor-following border glow beam
 * - Weighted, subtle 3D perspective tilt with spring physics
 * - Seamless adaptation between Champagne Pearl Day and Pure Obsidian Night
 * - Automatic touch device detection (bypasses heavy tilt on mobile)
 */
export const SpotlightCard = React.forwardRef<HTMLDivElement, SpotlightCardProps>(
  (
    {
      children,
      className,
      spotlightColor,
      borderGlowColor,
      enableTilt = true,
      tiltIntensity = 4,
      interactive = true,
      ...props
    },
    forwardedRef
  ) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();
    const isNight = theme === 'night';
    const [isHovered, setIsHovered] = useState(false);
    const [canHover, setCanHover] = useState(true);

    // Detect if device supports real hover
    useEffect(() => {
      setCanHover(window.matchMedia('(hover: hover)').matches);
    }, []);

    // Motion values for smooth cursor tracking
    const mouseX = useMotionValue(-1000);
    const mouseY = useMotionValue(-1000);

    // Spring damping for 3D tilt
    const springConfig = { stiffness: 260, damping: 24, mass: 0.8 };
    const tiltX = useSpring(0, springConfig);
    const tiltY = useSpring(0, springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current || !interactive || !canHover) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mouseX.set(x);
      mouseY.set(y);

      if (enableTilt) {
        // Calculate relative position (-1 to 1)
        const relX = (x / rect.width) * 2 - 1;
        const relY = (y / rect.height) * 2 - 1;
        tiltX.set(-relY * tiltIntensity);
        tiltY.set(relX * tiltIntensity);
      }
    };

    const handleMouseEnter = () => {
      if (canHover) setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      mouseX.set(-1000);
      mouseY.set(-1000);
      if (enableTilt) {
        tiltX.set(0);
        tiltY.set(0);
      }
    };

    // Dynamic radial gradient spotlight
    const activeSpotlight = spotlightColor || (
      isNight
        ? 'rgba(184, 144, 71, 0.16)'
        : 'rgba(184, 144, 71, 0.10)'
    );

    const activeBorderGlow = borderGlowColor || (
      isNight
        ? 'rgba(234, 210, 154, 0.55)'
        : 'rgba(184, 144, 71, 0.45)'
    );

    const spotlightBackground = useMotionTemplate`radial-gradient(420px circle at ${mouseX}px ${mouseY}px, ${activeSpotlight}, transparent 75%)`;
    const borderMask = useMotionTemplate`radial-gradient(280px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

    return (
      <motion.div
        ref={(node) => {
          (cardRef as any).current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef) (forwardedRef as any).current = node;
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transformStyle: 'preserve-3d',
          rotateX: enableTilt && canHover ? tiltX : 0,
          rotateY: enableTilt && canHover ? tiltY : 0,
        }}
        className={cn(
          'relative rounded-[32px] transition-shadow duration-500 overflow-hidden',
          isNight
            ? 'bg-[#0A0A0D] border border-white/[0.08] shadow-[0_16px_45px_-12px_rgba(0,0,0,0.85)] hover:shadow-[0_24px_60px_-15px_rgba(0,0,0,0.95),0_0_35px_rgba(184,144,71,0.18)]'
            : 'bg-white border border-black/[0.07] shadow-[0_16px_36px_-12px_rgba(20,25,35,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_24px_50px_-15px_rgba(20,25,35,0.12),0_0_30px_rgba(184,144,71,0.15)]',
          className
        )}
        {...(props as any)}
      >
        {/* Specular Inner Edge Highlight */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-[32px] pointer-events-none z-20"
          style={{
            boxShadow: isNight
              ? 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.6)'
              : 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.04)',
          }}
        />

        {/* Cursor Following Radial Spotlight Fill */}
        {interactive && canHover && (
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
            style={{
              background: spotlightBackground,
              opacity: isHovered ? 1 : 0,
            }}
          />
        )}

        {/* Cursor Following Glowing Border Beam */}
        {interactive && canHover && (
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 rounded-[32px] pointer-events-none z-20 transition-opacity duration-300"
            style={{
              border: `1.5px solid ${activeBorderGlow}`,
              WebkitMaskImage: borderMask,
              maskImage: borderMask,
              opacity: isHovered ? 1 : 0,
            }}
          />
        )}

        {/* Card Body Content */}
        <div className="relative z-10 h-full flex flex-col">{children}</div>
      </motion.div>
    );
  }
);

SpotlightCard.displayName = 'SpotlightCard';

export default SpotlightCard;
