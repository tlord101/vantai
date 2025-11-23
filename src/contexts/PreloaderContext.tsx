/**
 * Preloader Context & Component
 * 
 * Global preloader system for displaying loading states across the app.
 * Uses animated logo with liquid-glass backdrop.
 * 
 * Usage:
 * ```tsx
 * // In App.tsx
 * import { PreloaderProvider } from './contexts/PreloaderContext';
 * <PreloaderProvider>
 *   <YourApp />
 * </PreloaderProvider>
 * 
 * // In any component
 * const { showPreloader, hidePreloader } = usePreloader();
 * 
 * showPreloader('Uploading image...');
 * // Later...
 * hidePreloader();
 * ```
 */

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface PreloaderContextType {
  isVisible: boolean;
  message: string;
  showPreloader: (message?: string) => void;
  hidePreloader: () => void;
}

const PreloaderContext = createContext<PreloaderContextType | undefined>(undefined);

export function usePreloader() {
  const context = useContext(PreloaderContext);
  if (!context) {
    throw new Error('usePreloader must be used within PreloaderProvider');
  }
  return context;
}

interface PreloaderProviderProps {
  children: ReactNode;
}

export function PreloaderProvider({ children }: PreloaderProviderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');

  const showPreloader = (msg = 'Loading...') => {
    setMessage(msg);
    setIsVisible(true);
  };

  const hidePreloader = () => {
    setIsVisible(false);
    // Clear message after animation completes
    setTimeout(() => setMessage(''), 300);
  };

  return (
    <PreloaderContext.Provider value={{ isVisible, message, showPreloader, hidePreloader }}>
      {children}
      {isVisible && <PreloaderOverlay message={message} />}
    </PreloaderContext.Provider>
  );
}

/**
 * Preloader Overlay Component
 */
function PreloaderOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center preloader-overlay">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md preloader-backdrop" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 preloader-content">
        {/* Animated Logo */}
        <div className="relative">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 border-r-purple-400 animate-spin w-24 h-24" 
               style={{ animationDuration: '1.5s' }} 
          />
          
          {/* Middle rotating ring (opposite direction) */}
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-green-400 border-l-yellow-400 animate-spin-reverse w-20 h-20"
               style={{ animationDuration: '2s' }}
          />
          
          {/* Inner pulsing circle */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 animate-pulse-scale w-16 h-16" />
          
          {/* Logo text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-white logo-text">V</span>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="liquid-glass px-8 py-4 rounded-xl border border-white/10 preloader-message">
            <p className="text-white/90 text-sm font-medium">{message}</p>
          </div>
        )}

        {/* Loading dots */}
        <div className="flex gap-2">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
