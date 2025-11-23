# Vantai - React + TypeScript + Firebase App

A modern real-time chat application built with React, TypeScript, Vite, TailwindCSS, and Firebase with a unique liquid glass glassmorphism design system.

## ✨ Features

- 🔐 **Authentication** - Email/password signup/login with Firebase Auth
- 💬 **Real-time Messaging** - Instant message delivery with Firebase Realtime Database
- 👀 **Typing Indicators** - See when others are typing
- 🟢 **Presence System** - Online/offline status tracking
- 🎨 **Liquid Glass Design** - 90% transparency glassmorphism UI
- 📱 **Responsive Design** - Mobile-first layout with collapsible panels
- ⚡ **Optimistic UI** - Instant feedback with automatic error handling
- 🖼️ **Image Messages** - Send and preview images with modal viewer
- 🤖 **AI Image Generation** - Generate images from text with Gemini API
- 🎨 **AI Image Editing** - Edit images safely with identity preservation policies
- 🛡️ **Safety Controls** - Face detection and policy enforcement for responsible AI

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS v4** - Utility-first CSS framework
- **Firebase** - Backend services (Auth, Realtime Database, Firestore)
  - Modular SDK v9+ for tree-shaking
  - Real-time subscriptions
  - Presence and typing indicators
- **React Router v7** - Client-side routing
- **Zustand** - Lightweight state management
- **Axios** - HTTP client
- **Formik + Yup** - Form handling and validation
- **React Hot Toast** - Toast notifications
- **ESLint + Prettier** - Code quality and formatting

## Project Structure

```
/src
  /components     - Reusable UI components (ChatRoom, AppLayout, Preloader, etc.)
  /pages         - Page components (Auth, ChatPage, etc.)
  /lib           - Core libraries (Firebase, Gemini Proxy Client)
  /hooks         - Custom React hooks (useAuth, useMessaging, usePresence)
  /styles        - Global styles (glass.css - glassmorphism design system)
  /services      - Business logic (messagingService - real-time features)
  /utils         - Helper functions
  /store         - Zustand state stores
  /assets        - Images, fonts, static files
  main.tsx       - Application entry point
  App.tsx        - Root component with routing
  index.css      - Tailwind directives

/functions
  /src
    geminiProxy.ts  - AI image generation/editing with safety controls
    index.ts        - Cloud Functions entry point
    types.ts        - TypeScript definitions
    config.ts       - Configuration constants
    utils.ts        - Helper utilities
  package.json      - Functions dependencies
  tsconfig.json     - TypeScript config for Functions
  README.md         - Complete API documentation
  DEPLOYMENT.md     - Deployment guide
  TESTING.md        - Testing guide
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project (create one at [Firebase Console](https://console.firebase.google.com/))

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create a `.env` file from the example:

```bash
cp .env.example .env
```

3. Update `.env` with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_SERVER_API_URL=http://localhost:3000/api
```

4. Set up Firebase Realtime Database rules:

Upload `firebase-rtdb-rules.json` to your Firebase project:
- Go to Firebase Console → Realtime Database → Rules
- Copy the contents of `firebase-rtdb-rules.json`
- Publish the rules

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Firebase Setup

1. **Create Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project

2. **Enable Authentication**
   - Go to Authentication → Sign-in method
   - Enable Email/Password
   - (Optional) Enable Google, Apple providers

3. **Create Realtime Database**
   - Go to Realtime Database → Create Database
   - Start in test mode, then apply security rules from `firebase-rtdb-rules.json`

4. **Database Structure**
   ```
   /users/{uid}
     displayName: string
     email: string
     photoURL: string?
     credits: number (server-write only)
     createdAt: timestamp
   
   /conversations/{conversationId}
     participants: { [uid]: true }
     lastMessage: { text, senderId, createdAt }
     typing: { [uid]: boolean }
   
   /messages/{conversationId}/{messageId}
     senderId: string
     text: string
     type: 'text' | 'image' | 'file'
     createdAt: timestamp
     storageRef?: string
     metadata?: object
   
   /user_status/{uid}
     isOnline: boolean
     lastSeen: timestamp
   ```

## Real-time Features

### Messaging
```typescript
import { useMessaging } from './hooks/useMessaging';

const { messages, sendMessage, typingUsers, isLoading } = useMessaging(conversationId);

// Send text message
await sendMessage('Hello!', 'text');

// Send image message
await sendMessage('Check this out', 'image', metadata, storageRef);
```

### Presence
```typescript
import { usePresence } from './hooks/usePresence';

// Track current user presence
usePresence();

// Monitor another user
const { isOnline, lastSeen } = usePresence(userId);
```

### Typing Indicators
```typescript
const { handleTyping } = useMessaging(conversationId);

// Start typing
handleTyping(true);

// Stop typing
handleTyping(false);
```

## Design System

The app uses a custom **Liquid Glass** design system with 90% transparency glassmorphism.

### CSS Classes

- `.liquid-glass` - Base glass effect
- `.liquid-glass-light` / `.liquid-glass-dark` - Variants
- `.liquid-glass-intense` / `.liquid-glass-subtle` - Opacity levels
- `.text-glass-primary` / `.text-glass-secondary` / `.text-glass-tertiary` - High contrast text
- `.input-glass` - Glass input fields
- `.button-glass` - Glass buttons
- `.glass-scrollbar` - Custom scrollbars

See `GLASS_DESIGN_GUIDE.md` for complete documentation.

## Testing

See `MESSAGING_TESTS.md` for comprehensive test prompts covering:
- Unit tests for messaging functions
- Integration tests for real-time features
- Performance tests for scalability
- Mock data examples

Run tests:
```bash
npm test -- messaging
npm test -- --coverage
```

## Building for Production

```bash
npm run build
```

The optimized build will be in the `dist` folder.

Deploy to:
- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **Firebase Hosting**: `firebase deploy`

## Documentation

- `GLASS_DESIGN_GUIDE.md` - Complete design system documentation
- `MESSAGING_TESTS.md` - Testing guide for real-time features
- `FIREBASE_RULES_NOTES.md` - Security rules explanation
- `firebase-functions-example.ts` - Server-side functions reference
- `GEMINI_PROXY_SUMMARY.md` - AI image proxy implementation details
- `GEMINI_PROXY_QUICKSTART.md` - Quick setup guide for Gemini integration
- `/functions/README.md` - Complete Cloud Functions API reference
- `/functions/DEPLOYMENT.md` - Cloud Functions deployment guide
- `/functions/TESTING.md` - Cloud Functions testing guide

## AI Image Features

### Generate Images
```typescript
import { GeminiProxyClient } from './lib/geminiProxyClient';

const client = new GeminiProxyClient();
const result = await client.generateImage("A serene mountain landscape");
```

### Edit Images Safely
```typescript
// ✅ Allowed: Cosmetic changes
await client.editImage({
  prompt: "Change hair color to blonde and add makeup",
  imageData: base64Image,
  preserveIdentity: true,
});

// ❌ Blocked: Identity manipulation
await client.editImage({
  prompt: "Replace face with celebrity",  // Policy violation
  imageData: base64Image,
});
```

### Safety Features
- **Face Detection**: Detects faces using Google Cloud Vision API
- **Policy Enforcement**: Blocks identity manipulation and facial structure changes
- **Rate Limiting**: 20 requests per hour per user (configurable)
- **Audit Logging**: All operations logged for security tracking
- **Admin Override**: Manual approval for flagged requests

See `GEMINI_PROXY_QUICKSTART.md` for setup instructions.

## License

MIT

