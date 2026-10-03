import React from 'react';
import { cn } from '../../utils/cn';
import { SpotlightCard } from './SpotlightCard';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  enableTilt?: boolean;
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Card — Ultra-Luxury Base Card Container
 * Built on SpotlightCard with cursor-tracking spotlight, glowing borders,
 * and specular glass inner highlights.
 */
export const Card: React.FC<CardProps> = ({
  children,
  className,
  enableTilt = true,
  ...props
}) => {
  return (
    <SpotlightCard
      enableTilt={enableTilt}
      tiltIntensity={2.5}
      className={cn('apple-card overflow-hidden group', className)}
      {...props}
    >
      {children}
    </SpotlightCard>
  );
};

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('p-6 sm:p-7', className)} {...props}>
      {children}
    </div>
  );
};

export default Card;
