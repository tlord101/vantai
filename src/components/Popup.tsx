/**
 * Popup / Sliding Panel Component
 * 
 * Sliding panel from right side for payment flows, image previews,
 * and other content that should minimize page navigation.
 * 
 * Features:
 * - Slides in from right with smooth animation
 * - Backdrop with blur
 * - Multiple sizes
 * - Global state management via usePopup hook
 */

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  position?: 'right' | 'left' | 'bottom';
}

export default function Popup({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEsc = true,
  showCloseButton = true,
  position = 'right',
}: PopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEsc, onClose]);

  // Prevent body scroll when popup is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  const positionClasses = {
    right: 'right-0 top-0 bottom-0 popup-slide-right',
    left: 'left-0 top-0 bottom-0 popup-slide-left',
    bottom: 'bottom-0 left-0 right-0 popup-slide-bottom',
  };

  const positionStyles = {
    right: 'h-full',
    left: 'h-full',
    bottom: 'max-h-[80vh]',
  };

  return (
    <div
      className="fixed inset-0 z-50 popup-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'popup-title' : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm popup-backdrop-overlay" />

      {/* Popup Panel */}
      <div
        ref={popupRef}
        className={`fixed ${positionClasses[position]} ${positionStyles[position]} w-full ${sizeClasses[size]} liquid-glass shadow-2xl flex flex-col`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
            {title && (
              <h2 id="popup-title" className="text-2xl font-bold text-white">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white ml-auto"
                aria-label="Close panel"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
