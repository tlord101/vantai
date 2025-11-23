/**
 * Custom Toast System
 * 
 * Custom toast notifications using react-hot-toast with liquid-glass theme.
 * Supports success, error, info, and loading states.
 * 
 * Usage:
 * ```tsx
 * import { showToast } from './utils/toast';
 * 
 * showToast.success('Payment successful!');
 * showToast.error('Failed to process payment');
 * showToast.info('Processing your request...');
 * 
 * // With custom duration
 * showToast.success('Saved!', { duration: 2000 });
 * 
 * // Loading toast
 * const toastId = showToast.loading('Uploading...');
 * // Later update it
 * showToast.success('Upload complete!', { id: toastId });
 * ```
 */

import toast, { Toaster } from 'react-hot-toast';
import type { ToastOptions, Toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Info, AlertTriangle, Loader } from 'lucide-react';

// Toast type icons
const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
  loading: Loader,
};

// Toast type colors
const toastColors = {
  success: {
    icon: 'text-green-400',
    border: 'border-green-400/30',
    bg: 'bg-green-500/10',
  },
  error: {
    icon: 'text-red-400',
    border: 'border-red-400/30',
    bg: 'bg-red-500/10',
  },
  info: {
    icon: 'text-blue-400',
    border: 'border-blue-400/30',
    bg: 'bg-blue-500/10',
  },
  warning: {
    icon: 'text-yellow-400',
    border: 'border-yellow-400/30',
    bg: 'bg-yellow-500/10',
  },
  loading: {
    icon: 'text-purple-400',
    border: 'border-purple-400/30',
    bg: 'bg-purple-500/10',
  },
};

interface CustomToastOptions extends ToastOptions {
  type?: keyof typeof toastIcons;
}

/**
 * Custom Toast Renderer
 */
function CustomToast({ t, message, type = 'info' }: { t: Toast; message: string; type?: keyof typeof toastIcons }) {
  const Icon = toastIcons[type];
  const colors = toastColors[type];

  return (
    <div
      className={`
        liquid-glass rounded-xl px-5 py-4 shadow-lg border
        ${colors.border} ${colors.bg}
        transform transition-all duration-300 ease-out
        ${t.visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95'}
        max-w-md
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${type === 'loading' ? 'animate-spin' : ''}`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        <p className="text-white/90 text-sm leading-relaxed flex-1">{message}</p>
        {type !== 'loading' && (
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 text-white/40 hover:text-white/80 transition-colors"
            aria-label="Dismiss"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Show custom toast
 */
function showCustomToast(message: string, options: CustomToastOptions = {}) {
  const { type = 'info', ...restOptions } = options;

  return toast.custom(
    (t) => <CustomToast t={t} message={message} type={type} />,
    {
      duration: type === 'loading' ? Infinity : 4000,
      position: 'top-right',
      ...restOptions,
    }
  );
}

/**
 * Toast utility functions
 */
export const showToast = {
  success: (message: string, options?: ToastOptions) =>
    showCustomToast(message, { ...options, type: 'success' }),

  error: (message: string, options?: ToastOptions) =>
    showCustomToast(message, { ...options, type: 'error' }),

  info: (message: string, options?: ToastOptions) =>
    showCustomToast(message, { ...options, type: 'info' }),

  warning: (message: string, options?: ToastOptions) =>
    showCustomToast(message, { ...options, type: 'warning' }),

  loading: (message: string, options?: ToastOptions) =>
    showCustomToast(message, { ...options, type: 'loading' }),

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    },
    options?: ToastOptions
  ) => {
    const toastId = showToast.loading(messages.loading, options);

    return promise
      .then((data) => {
        const successMessage = typeof messages.success === 'function' 
          ? messages.success(data) 
          : messages.success;
        showToast.success(successMessage, { id: toastId });
        return data;
      })
      .catch((error) => {
        const errorMessage = typeof messages.error === 'function'
          ? messages.error(error)
          : messages.error;
        showToast.error(errorMessage, { id: toastId });
        throw error;
      });
  },

  dismiss: (toastId?: string) => toast.dismiss(toastId),
  remove: (toastId?: string) => toast.remove(toastId),
};

/**
 * Toast Container Component
 * Add this to your app root (App.tsx or main.tsx)
 */
export function ToastContainer() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={12}
      containerStyle={{
        top: 80,
        right: 20,
      }}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      }}
    />
  );
}

/**
 * Inline Validation Toast
 * For showing validation errors next to form fields
 */
export function showValidationToast(fieldName: string, message: string) {
  showToast.error(`${fieldName}: ${message}`, {
    duration: 3000,
    position: 'top-center',
  });
}

/**
 * Action Toast with custom button
 */
export function showActionToast(
  message: string,
  actionText: string,
  onAction: () => void,
  options?: ToastOptions
) {
  return toast.custom(
    (t) => (
      <div
        className={`
          liquid-glass rounded-xl px-5 py-4 shadow-lg border border-blue-400/30 bg-blue-500/10
          transform transition-all duration-300 ease-out
          ${t.visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95'}
          max-w-md
        `}
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-white/90 text-sm">{message}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onAction();
                toast.dismiss(t.id);
              }}
              className="px-3 py-1.5 bg-blue-500/30 hover:bg-blue-500/40 rounded-lg text-blue-100 text-sm font-medium transition-colors"
            >
              {actionText}
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-white/40 hover:text-white/80 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    ),
    {
      duration: 6000,
      position: 'top-right',
      ...options,
    }
  );
}
