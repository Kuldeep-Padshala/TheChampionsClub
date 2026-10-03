import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Modal — reusable overlay modal component.
 * - Backdrop click closes the modal
 * - Escape key closes the modal
 * - Smooth fade-in animation
 * - Used by LoginPromptModal
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

  // Don't render anything if not open
  if (!isOpen) return null;

  return (
    /* Backdrop overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-primary/50 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal panel — stop click propagation so clicks inside don't close it */}
      <div
        className={cn(
          'relative bg-bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-md p-8',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-navy-primary transition-colors rounded-md p-1 hover:bg-bg-subtle"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {children}
      </div>
    </div>
  );
};
