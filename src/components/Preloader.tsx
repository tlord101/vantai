/**
 * Legacy Preloader Component (Deprecated)
 * 
 * NOTE: This component is deprecated. Use PreloaderContext instead:
 * 
 * ```tsx
 * import { usePreloader } from '../contexts/PreloaderContext';
 * 
 * const { showPreloader, hidePreloader } = usePreloader();
 * showPreloader('Loading...');
 * ```
 * 
 * This component is kept for backward compatibility.
 */

import { useEffect, useState } from 'react';

interface PreloaderProps {
  message?: string;
}

export default function Preloader({ message = 'Loading...' }: PreloaderProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="relative">
        {/* Liquid glass card background */}
        <div className="absolute inset-0 -m-12 rounded-3xl bg-white/40 backdrop-blur-xl shadow-2xl animate-pulse" />
        
        {/* Logo container */}
        <div className="relative z-10 flex flex-col items-center gap-6 p-12">
          {/* Animated logo */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-2xl animate-ping" />
            <div className="relative w-24 h-24 text-gray-800 animate-bounce">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 768 768"
                fill="none"
                className="w-full h-full"
              >
                <path
                  d="M384 171.429c-58.88 0-106.667 47.787-106.667 106.667 0 58.88 47.787 106.667 106.667 106.667 58.88 0 106.667-47.787 106.667-106.667 0-58.88-47.787-106.667-106.667-106.667zm0 0"
                  fill="currentColor"
                />
                <path
                  d="M277.333 490.667c-58.88 0-106.667 47.787-106.667 106.667C170.666 656.213 218.453 704 277.333 704c58.88 0 106.667-47.787 106.667-106.667 0-58.88-47.787-106.666-106.667-106.666zm0 0M490.667 490.667c-58.88 0-106.667 47.787-106.667 106.667C384 656.213 431.787 704 490.667 704c58.88 0 106.666-47.787 106.666-106.667 0-58.88-47.786-106.666-106.666-106.666zm0 0"
                  fill="currentColor"
                  opacity=".7"
                />
              </svg>
            </div>
          </div>

          {/* Loading text */}
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700">
              {message}
              <span className="inline-block w-8 text-left">{dots}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
