# VanTai - Liquid Glass Chat App with Authentication

A beautiful mobile chat application featuring liquid glass effects, smooth animations, and secure Firebase authentication, powered by Google's Gemini AI.

## 🎨 Features

### Design
- **Liquid Glass Morphism**: Stunning transparent glass effects throughout the UI
- **Animated Background**: Dynamic liquid blob animations
- **Smooth Transitions**: Framer Motion animations for delightful interactions
- **Mobile-First**: Responsive design optimized for mobile devices

### Authentication
- **Email/Password Auth**: Secure registration and login
- **Google Sign-In**: One-click authentication with Google
- **Protected Routes**: Chat only accessible to authenticated users
- **User Profile**: Display user name/email in chat header
- **Secure Logout**: Clean session management

### Chat Features
- **Gemini AI Integration**: Powered by Google's advanced AI
- **Image Analysis**: Upload and analyze images
- **Real-time Responses**: Fast AI-powered conversations
- **Message History**: Track conversation flow

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Authentication:
   - Go to **Build** → **Authentication**
   - Click **Get Started**
   - Enable **Email/Password** provider
   - Enable **Google** provider (add your domain)
4. Get your Firebase config:
   - Go to **Project Settings** → **General**
   - Scroll to "Your apps" section
   - Click the web icon `</>`
   - Copy the config values

### 3. Configure Gemini AI

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key

### 4. Environment Variables

Update your `.env` file with your credentials:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 5. Run the App

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## 📱 Usage

### Authentication Flow

1. **First Visit**: Users see the beautiful glass-themed login page
2. **Sign Up**: 
   - Click "Sign Up" tab
   - Enter name, email, and password (min 6 characters)
   - Or click "Continue with Google"
3. **Login**:
   - Enter email and password
   - Or use Google Sign-In
4. **Chat**: Once authenticated, access the full chat interface
5. **Logout**: Click the logout button in the header

### Chat Features

- **Text Messages**: Type and send messages to Gemini AI
- **Image Upload**: Click the image icon to upload and analyze images
- **Conversations**: View your message history with AI responses

## 🎨 Glass Theme Design

The authentication system features:

- **Transparent Cards**: Frosted glass effect with backdrop blur
- **Gradient Accents**: Purple and pink gradients for CTAs
- **Smooth Animations**: Fade-ins, scales, and transitions
- **Liquid Background**: Animated blobs for visual interest
- **Form Styling**: Glass-themed inputs with focus states
- **Error Handling**: Beautiful error messages with animations

## 🔐 Security Features

- **Firebase Authentication**: Industry-standard security
- **Password Requirements**: Minimum 6 characters
- **Protected Routes**: Chat requires authentication
- **Secure Token Management**: Handled by Firebase
- **Session Persistence**: Stay logged in across refreshes

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Firebase Auth** - Authentication
- **Google Gemini AI** - AI chat capabilities
- **Lucide Icons** - Beautiful icons

## 📁 Project Structure

```
src/
├── components/
│   ├── AuthPage.tsx          # Login/Signup UI with glass theme
│   ├── ChatHeader.tsx         # Header with user info & logout
│   ├── ChatInput.tsx          # Message input component
│   ├── MessageList.tsx        # Chat messages display
│   ├── GlassCard.tsx          # Reusable glass card
│   └── LiquidBackground.tsx   # Animated background
├── contexts/
│   └── AuthContext.tsx        # Authentication state management
├── services/
│   ├── firebase.ts            # Firebase initialization
│   └── gemini.ts              # Gemini AI service
├── App.tsx                    # Main app with auth routing
└── main.tsx                   # App entry point
```

## 🎯 Key Components

### AuthPage
- Login/Signup toggle
- Email/Password forms
- Google Sign-In button
- Glass morphism design
- Error handling
- Form validation

### AuthContext
- User state management
- Authentication methods
- Session persistence
- Protected route logic

### ChatHeader
- User display name/email
- Logout functionality
- Animated AI icon
- Liquid effects

## 🌟 Design Philosophy

The app combines:
1. **Glassmorphism**: Semi-transparent elements with blur
2. **Liquid Motion**: Smooth, organic animations
3. **Gradient Accents**: Vibrant colors for emphasis
4. **Minimalism**: Clean, uncluttered interface
5. **Mobile-First**: Touch-optimized interactions

## 📝 Notes

- Firebase config values are in `.env` file (never commit this file!)
- Use `.env.example` as a template
- Gemini API has usage limits on free tier
- Google Sign-In requires authorized domains in Firebase console

## 🐛 Troubleshooting

### Authentication Issues
- Verify Firebase config in `.env`
- Check Firebase Console for enabled auth methods
- Ensure authorized domains include `localhost`

### Gemini API Issues
- Verify API key is correct
- Check API quota limits
- Ensure Gemini API is enabled in Google Cloud

### Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`

## 📄 License

MIT

---

Built with ❤️ using Liquid Glass Design & Firebase Auth
