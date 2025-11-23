/**
 * usePopup Hook
 * 
 * Global popup state management for opening/closing sliding panels
 * across the application.
 * 
 * Usage:
 * ```tsx
 * const { openPopup, closePopup } = usePopup();
 * 
 * openPopup('payment', { amount: 500 });
 * closePopup('payment');
 * ```
 */

import { create } from 'zustand';
import type { ReactNode } from 'react';

interface PopupState {
  id: string;
  isOpen: boolean;
  content?: ReactNode;
  props?: Record<string, unknown>;
}

interface PopupStore {
  popups: Record<string, PopupState>;
  openPopup: (id: string, content?: ReactNode, props?: Record<string, unknown>) => void;
  closePopup: (id: string) => void;
  isPopupOpen: (id: string) => boolean;
  getPopupProps: (id: string) => Record<string, unknown> | undefined;
}

export const usePopupStore = create<PopupStore>((set, get) => ({
  popups: {},

  openPopup: (id, content, props) => {
    set((state) => ({
      popups: {
        ...state.popups,
        [id]: {
          id,
          isOpen: true,
          content,
          props,
        },
      },
    }));
  },

  closePopup: (id) => {
    set((state) => ({
      popups: {
        ...state.popups,
        [id]: {
          ...state.popups[id],
          isOpen: false,
        },
      },
    }));
  },

  isPopupOpen: (id) => {
    return get().popups[id]?.isOpen ?? false;
  },

  getPopupProps: (id) => {
    return get().popups[id]?.props;
  },
}));

/**
 * Hook for managing a specific popup
 */
export function usePopup(id: string) {
  const { openPopup, closePopup, isPopupOpen, getPopupProps } = usePopupStore();

  return {
    isOpen: isPopupOpen(id),
    props: getPopupProps(id),
    open: (content?: ReactNode, props?: Record<string, unknown>) => openPopup(id, content, props),
    close: () => closePopup(id),
  };
}

/**
 * Hook for accessing all popups
 */
export function usePopups() {
  return usePopupStore();
}
