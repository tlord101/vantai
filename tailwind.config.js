/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'glass': {
          'light': 'rgba(255, 255, 255, 0.1)',
          'medium': 'rgba(255, 255, 255, 0.15)',
          'dark': 'rgba(0, 0, 0, 0.3)',
        }
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'liquid-1': 'liquid1 8s ease-in-out infinite',
        'liquid-2': 'liquid2 10s ease-in-out infinite',
        'liquid-3': 'liquid3 12s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        liquid1: {
          '0%, 100%': { 
            transform: 'translate(0, 0) scale(1)',
            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
          },
          '25%': { 
            transform: 'translate(20px, -20px) scale(1.1)',
            borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%',
          },
          '50%': { 
            transform: 'translate(-20px, 20px) scale(0.9)',
            borderRadius: '70% 30% 50% 50% / 30% 50% 50% 70%',
          },
          '75%': { 
            transform: 'translate(-10px, -30px) scale(1.05)',
            borderRadius: '40% 70% 60% 30% / 70% 40% 60% 30%',
          },
        },
        liquid2: {
          '0%, 100%': { 
            transform: 'translate(0, 0) rotate(0deg)',
            borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
          },
          '33%': { 
            transform: 'translate(-30px, 10px) rotate(120deg)',
            borderRadius: '70% 30% 30% 70% / 70% 70% 30% 30%',
          },
          '66%': { 
            transform: 'translate(10px, -30px) rotate(240deg)',
            borderRadius: '50% 50% 50% 50% / 50% 50% 50% 50%',
          },
        },
        liquid3: {
          '0%, 100%': { 
            transform: 'translate(0, 0) scale(1) rotate(0deg)',
            borderRadius: '40% 60% 60% 40% / 60% 40% 60% 40%',
          },
          '20%': { 
            transform: 'translate(15px, -25px) scale(1.15) rotate(72deg)',
            borderRadius: '60% 40% 50% 50% / 40% 60% 40% 60%',
          },
          '40%': { 
            transform: 'translate(-25px, -15px) scale(0.85) rotate(144deg)',
            borderRadius: '50% 50% 40% 60% / 50% 50% 60% 40%',
          },
          '60%': { 
            transform: 'translate(-15px, 25px) scale(1.1) rotate(216deg)',
            borderRadius: '40% 60% 60% 40% / 60% 40% 60% 40%',
          },
          '80%': { 
            transform: 'translate(25px, 15px) scale(0.95) rotate(288deg)',
            borderRadius: '60% 40% 40% 60% / 40% 60% 40% 60%',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { 
            opacity: '0.5',
            filter: 'blur(10px)',
          },
          '50%': { 
            opacity: '0.8',
            filter: 'blur(15px)',
          },
        },
      },
    },
  },
  plugins: [],
}
