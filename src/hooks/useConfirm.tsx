/**
 * useConfirm Hook
 * 
 * React hook for showing confirmation dialogs before destructive actions.
 * Uses the ConfirmModal component with promise-based API.
 * 
 * Usage:
 * ```tsx
 * const confirm = useConfirm();
 * 
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete Image',
 *     message: 'Are you sure you want to delete this image? This action cannot be undone.',
 *     confirmText: 'Delete',
 *     variant: 'danger',
 *   });
 *   
 *   if (confirmed) {
 *     // Perform delete action
 *   }
 * };
 * ```
 */

import { useState, useCallback } from 'react';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'success';
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve: ((value: boolean) => void) | null;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        ...options,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [state.resolve]);

  return {
    confirm,
    ConfirmDialog: () => (
      <ConfirmDialog
        isOpen={state.isOpen}
        title={state.title}
        message={state.message}
        confirmText={state.confirmText}
        cancelText={state.cancelText}
        variant={state.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    ),
  };
}

/**
 * Internal Confirm Dialog Component
 */
import { ConfirmModal } from '../components/Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onCancel}
      onConfirm={onConfirm}
      title={title}
      message={message}
      confirmText={confirmText}
      cancelText={cancelText}
      variant={variant}
    />
  );
}

/**
 * Common confirm dialog presets
 */
export const confirmPresets = {
  delete: (itemName: string): ConfirmOptions => ({
    title: `Delete ${itemName}`,
    message: `Are you sure you want to delete this ${itemName.toLowerCase()}? This action cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
  }),

  discard: (): ConfirmOptions => ({
    title: 'Discard Changes',
    message: 'You have unsaved changes. Are you sure you want to discard them?',
    confirmText: 'Discard',
    cancelText: 'Keep Editing',
    variant: 'danger',
  }),

  logout: (): ConfirmOptions => ({
    title: 'Sign Out',
    message: 'Are you sure you want to sign out?',
    confirmText: 'Sign Out',
    cancelText: 'Cancel',
    variant: 'primary',
  }),

  removeUser: (userName: string): ConfirmOptions => ({
    title: 'Remove User',
    message: `Are you sure you want to remove ${userName} from this conversation?`,
    confirmText: 'Remove',
    cancelText: 'Cancel',
    variant: 'danger',
  }),

  cancelSubscription: (): ConfirmOptions => ({
    title: 'Cancel Subscription',
    message: 'Are you sure you want to cancel your subscription? You will lose access to premium features.',
    confirmText: 'Cancel Subscription',
    cancelText: 'Keep Subscription',
    variant: 'danger',
  }),
};
