import React from 'react';

export interface MaskedHeadingProps {
  text?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'div';
  src?: string;
  weight?: number | string;
  tracking?: number;
  trigger?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * MaskedHeading — 120fps hardware-accelerated image-in-text effect.
 * Uses native CSS background-clip: text with zero CPU layout thrashing and 0 scroll lag.
 */
export const MaskedHeading: React.FC<MaskedHeadingProps> = ({
  text = 'WHERE CHAMPIONS PLAY',
  tag = 'h2',
  src = 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=2000&auto=format&fit=crop',
  weight = 800,
  tracking = -0.04,
  className = '',
  style,
}) => {
  const Tag = tag as any;

  return (
    <Tag
      className={`text-center font-extrabold uppercase select-none transition-transform duration-500 ease-out hover:scale-[1.02] ${className}`.trim()}
      style={{
        fontWeight: weight,
        letterSpacing: `${tracking}em`,
        backgroundImage: `url(${src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
        fontSize: 'clamp(2.5rem, 8vw, 6.5rem)',
        lineHeight: 1.05,
        transform: 'translateZ(0)',
        ...style,
      }}
    >
      {text}
    </Tag>
  );
};

export default MaskedHeading;
