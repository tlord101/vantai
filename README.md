# Liquid Glass Chat - Gemini AI Powered Mobile Chat App

A stunning mobile chat application featuring liquid glass morphism design with smooth animations, powered by Google's Gemini AI for text and image analysis.

## ✨ Features

- 🎨 **Liquid Glass Design**: Beautiful glassmorphism UI with animated liquid blobs
- 🌊 **Smooth Animations**: Framer Motion powered transitions and micro-interactions
- 🤖 **Gemini AI Integration**: Text and image analysis using Gemini Pro
- 📱 **Mobile-First**: Fully responsive design optimized for mobile devices
- 🖼️ **Image Support**: Upload and analyze images with AI
- ⚡ **Fast & Modern**: Built with Vite, React 18, and TypeScript

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure your Gemini API key:**
   
   Add your Gemini API key to the `.env` file:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   
   Navigate to `http://localhost:5173`

## 🎨 Design Features

### Liquid Glass Effects
- Animated morphing blobs in the background
- Glassmorphism cards with backdrop blur
- Smooth color gradients (purple, blue, pink, cyan)
- Floating particle animations

### Chat Interface
- Bubble messages with glass effect
- Animated avatar icons
- Real-time typing indicators
- Smooth message transitions
- Image preview and upload

### Animations
- Liquid blob morphing (8-15s loops)
- Message pop-in animations
- Button hover effects
- Pulsing glow effects
- Floating particle movements

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Google Gemini AI** - AI capabilities
- **Lucide React** - Icons

## 📱 Mobile Optimization

- Responsive layout (max-width: 2xl on desktop)
- Touch-friendly UI elements
- Optimized animations for mobile performance
- Custom scrollbars for better UX
- Viewport height management

## 🎯 Usage

1. **Text Chat**: Type your message and press Enter or click Send
2. **Image Analysis**: Click the image icon to upload a photo
3. **Combined Input**: Send text with an image for contextual analysis

## 🔧 Configuration

### Environment Variables

```env
# Required
VITE_GEMINI_API_KEY=your_gemini_api_key

# Optional (already configured for Firebase)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

### Customization

You can customize the liquid animations in `tailwind.config.js`:
- Animation durations
- Color schemes
- Blob movements
- Glass effect opacity

## 📦 Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

## 🌐 Deployment

### Deploy to Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

### Deploy to Vercel/Netlify

Simply connect your repository and the build settings will be auto-detected.

## 🎨 Color Palette

- **Primary**: Purple (#A855F7) to Pink (#EC4899)
- **Secondary**: Cyan (#06B6D4) to Blue (#3B82F6)
- **Background**: Deep Purple/Blue gradient
- **Glass**: White with 10-15% opacity + backdrop blur

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Google Gemini AI for powerful AI capabilities
- Framer Motion for smooth animations
- Tailwind CSS for utility-first styling

---

Built with ❤️ using React, TypeScript, and Gemini AI
