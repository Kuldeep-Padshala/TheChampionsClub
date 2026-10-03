import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Card — base card container with white background, border, and rounded corners.
 * Used for court cards, product cards, and info panels.
 */
export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'bg-bg-surface border border-border/60 rounded-2xl overflow-hidden luxury-shadow transition-all duration-500',
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * CardContent — inner padding wrapper for Card.
 * Keeps padding consistent across all cards.
 */
export const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  return (
    <div className={cn('p-5', className)}>
      {children}
    </div>
  );
};
