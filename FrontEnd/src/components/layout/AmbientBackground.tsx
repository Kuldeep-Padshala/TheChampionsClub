import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * AmbientBackground — Ultra-lightweight luxury atmospheric lighting.
 * Seamlessly adapts between Pure Obsidian (#000000) Night and Champagne Pearl Day.
 */
export const AmbientBackground: React.FC = () => {
  const { theme } = useTheme();
  const isNight = theme === 'night';

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden transition-all duration-700 ease-out"
      style={{
        transform: 'translateZ(0)',
        contain: 'strict',
        backgroundColor: isNight ? '#000000' : '#FAF9F6',
        backgroundImage: isNight
          ? `
            radial-gradient(circle at 12% 15%, rgba(184, 144, 71, 0.12) 0%, transparent 45%),
            radial-gradient(circle at 88% 20%, rgba(30, 58, 138, 0.10) 0%, transparent 40%),
            radial-gradient(circle at 50% 65%, rgba(184, 144, 71, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 82% 88%, rgba(184, 144, 71, 0.09) 0%, transparent 45%)
          `
          : `
            radial-gradient(circle at 10% 10%, rgba(197, 160, 89, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 90% 15%, rgba(0, 113, 227, 0.05) 0%, transparent 40%),
            radial-gradient(circle at 50% 60%, rgba(245, 240, 230, 0.5) 0%, transparent 50%),
            radial-gradient(circle at 85% 90%, rgba(197, 160, 89, 0.07) 0%, transparent 45%)
          `,
      }}
    />
  );
};

export default AmbientBackground;
