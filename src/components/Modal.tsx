/**
 * Modal Component
 * 
 * Flexible modal dialog with liquid-glass styling, nested content support,
 * confirm/cancel callbacks, and smooth micro animations.
 * 
 * Features:
 * - CSS transform + opacity animations
 * - Backdrop click to close (optional)
 * - ESC key to close
 * - Focus trap
 * - Nested content support
 */

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  title?: string;
  children: ReactNode;
  confirmText?: string;
  cancelText?: string;
  showActions?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  confirmVariant?: 'primary' | 'danger' | 'success';
  isLoading?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showActions = true,
  closeOnBackdrop = true,
  closeOnEsc = true,
  size = 'md',
  confirmVariant = 'primary',
  isLoading = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

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

  // Focus trap and restoration
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
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

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  const confirmVariantClasses = {
    primary: 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-400/30 text-blue-100',
    danger: 'bg-red-500/20 hover:bg-red-500/30 border-red-400/30 text-red-100',
    success: 'bg-green-500/20 hover:bg-green-500/30 border-green-400/30 text-green-100',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm modal-backdrop-overlay" />

      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative w-full ${sizeClasses[size]} liquid-glass rounded-2xl shadow-2xl modal-content`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 id="modal-title" className="text-2xl font-bold text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-lg border border-white/20 hover:bg-white/10 transition-all text-white/90 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            {onConfirm && (
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className={`px-6 py-2.5 rounded-lg border transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${confirmVariantClasses[confirmVariant]}`}
              >
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                {confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Confirm Modal - Specialized modal for confirmation dialogs
 */
export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'success';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      confirmText={confirmText}
      cancelText={cancelText}
      confirmVariant={variant}
      size="sm"
      isLoading={isLoading}
    >
      <p className="text-white/80 leading-relaxed">{message}</p>
    </Modal>
  );
}
