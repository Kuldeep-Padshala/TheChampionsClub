import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Modal — Haute Horlogerie & Private Club Overlay Modal
 * Smooth backdrop blur, specular inner highlights, and clean luxury dismiss.
 * Rendered directly into document.body to ensure perfect viewport centering.
 */
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className }) => {
  // Close on Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll while modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      data-lenis-prevent
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        className={cn(
          'relative bg-white dark:bg-[#0A0A0D] rounded-[32px] shadow-[0_24px_70px_-12px_rgba(0,0,0,0.35)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.95)] border border-black/[0.08] dark:border-white/[0.12] w-full max-w-md p-8 sm:p-10 select-none',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Specular Inner Edge Highlight */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-[32px] pointer-events-none"
          style={{
            boxShadow:
              'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05)',
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-20"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="relative z-10">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
