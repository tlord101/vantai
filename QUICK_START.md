# Quick Start Guide

## 🚀 Getting Your App Running in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" and follow the wizard
3. Once created, click the web icon (</>) to add a web app
4. Copy your Firebase config

### Step 3: Environment Variables

Create `.env` file in project root:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-app-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-app
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_SERVER_API_URL=http://localhost:3000/api
```

### Step 4: Enable Firebase Services

#### A) Enable Authentication
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. (Optional) Enable **Google** provider

#### B) Create Realtime Database
1. Go to **Realtime Database** → **Create Database**
2. Choose location (e.g., us-central1)
3. Start in **test mode** (we'll add rules next)

#### C) Apply Security Rules
1. Copy the contents of `firebase-rtdb-rules.json`
2. In Firebase Console → **Realtime Database** → **Rules**
3. Paste the rules and click **Publish**

### Step 5: Run the App

```bash
npm run dev
```

Visit http://localhost:5173

---

## 🎯 Testing the Features

### 1. Create an Account
- Navigate to `/register`
- Fill in email and password
- Click "Create Account"
- Your profile is created with `credits: 0`

### 2. Login
- Navigate to `/login`
- Enter your credentials
- You'll be redirected to the dashboard

### 3. Send Messages
- Click "Messages" in the navigation
- Select a conversation (demo conversations pre-loaded)
- Type a message and press Enter
- Watch it appear with optimistic UI

### 4. Test Real-time Features

**Typing Indicators:**
- Open the app in two browser windows
- Log in with different accounts
- Start typing in one window
- See the typing indicator in the other

**Presence System:**
- Your online status is automatically tracked
- Close one browser window
- See the status change to offline

**Image Messages:**
- Click the image icon in the message input
- Upload an image
- Click the image to open in full-screen modal

---

## 📁 Key Files to Understand

### 1. Firebase Config
**File:** `src/lib/firebase.ts`
```typescript
// Initializes Firebase with your config
// Exports: auth, rtdb, firestore
// Helper functions: signUpWithEmailPassword, signInWithEmailPassword, etc.
```

### 2. Messaging Service
**File:** `src/services/messagingService.ts`
```typescript
// Real-time messaging functions
sendMessage(conversationId, text, type, metadata, storageRef)
onMessages(conversationId, callback)
startTyping(conversationId)
stopTyping(conversationId)
setUserPresence(isOnline)
onUserPresence(uid, callback)
```

### 3. Custom Hooks
**File:** `src/hooks/useMessaging.ts`
```typescript
const { messages, sendMessage, typingUsers, handleTyping } = useMessaging(conversationId);
```

**File:** `src/hooks/usePresence.ts`
```typescript
usePresence(); // Track current user
const { isOnline, lastSeen } = usePresence(userId); // Monitor another user
```

### 4. ChatRoom Component
**File:** `src/components/ChatRoom.tsx`
- Full-featured chat interface
- 3-panel layout (conversations | messages | settings)
- Optimistic UI updates
- Typing indicators
- Image preview modal

---

## 🎨 Using the Glass Design System

### Basic Glass Card
```tsx
<div className="liquid-glass p-6 rounded-2xl">
  <h2 className="text-glass-primary">Title</h2>
  <p className="text-glass-secondary">Description</p>
</div>
```

### Glass Input
```tsx
<input
  type="text"
  placeholder="Enter text..."
  className="input-glass w-full px-4 py-3"
/>
```

### Glass Button
```tsx
<button className="button-glass px-6 py-3">
  Click Me
</button>
```

### Variants
```tsx
<div className="liquid-glass-light">Light variant</div>
<div className="liquid-glass-dark">Dark variant</div>
<div className="liquid-glass-intense">More opaque</div>
<div className="liquid-glass-subtle">More transparent</div>
```

---

## 🔥 Common Issues & Solutions

### Issue: "Firebase config not found"
**Solution:** Make sure `.env` file exists with all VITE_FIREBASE_* variables

### Issue: "Permission denied" when sending messages
**Solution:** Check that Firebase Realtime Database rules are published from `firebase-rtdb-rules.json`

### Issue: "User not authenticated"
**Solution:** Make sure you're logged in. Visit `/login` first.

### Issue: Messages not appearing in real-time
**Solution:** 
1. Check browser console for errors
2. Verify Firebase Realtime Database URL in `.env`
3. Ensure you're using the same `conversationId` in both windows

### Issue: Typing indicator not working
**Solution:** 
1. Make sure both users are authenticated
2. Check that `typing` rules are set in Firebase (see `firebase-rtdb-rules.json`)

---

## 🧪 Testing Real-time Features Locally

### Setup Two Users
```bash
# Terminal 1 - Start dev server
npm run dev

# Open browser window 1
http://localhost:5173/register
# Register as user1@example.com

# Open browser window 2 (incognito)
http://localhost:5173/register
# Register as user2@example.com
```

### Test Message Flow
1. In window 1: Navigate to `/messages`
2. In window 2: Navigate to `/messages`
3. In window 1: Type and send a message
4. In window 2: Watch it appear instantly

### Test Typing Indicators
1. In window 1: Start typing (don't send)
2. In window 2: See typing indicator appear
3. In window 1: Stop typing
4. In window 2: See typing indicator disappear

---

## 📊 Database Structure Example

After creating an account and sending a message, your database will look like:

```json
{
  "users": {
    "uid-user1": {
      "displayName": "User One",
      "email": "user1@example.com",
      "credits": 0,
      "createdAt": 1700000000000
    }
  },
  "conversations": {
    "conv-123": {
      "participants": {
        "uid-user1": true,
        "uid-user2": true
      },
      "lastMessage": {
        "text": "Hello!",
        "senderId": "uid-user1",
        "createdAt": 1700000000000
      },
      "typing": {
        "uid-user2": true
      }
    }
  },
  "messages": {
    "conv-123": {
      "msg-456": {
        "senderId": "uid-user1",
        "text": "Hello!",
        "type": "text",
        "createdAt": 1700000000000
      }
    }
  },
  "user_status": {
    "uid-user1": {
      "isOnline": true,
      "lastSeen": 1700000000000
    }
  }
}
```

---

## 🚀 Next Steps

1. **Add More Features**
   - File uploads (use Firebase Storage)
   - Read receipts
   - Message editing
   - Reactions (emoji)

2. **Improve UI**
   - Add avatars from Firebase Storage
   - Implement dark/light theme toggle
   - Add animations for message entry

3. **Deploy**
   ```bash
   npm run build
   firebase deploy
   ```

4. **Add Tests**
   - See `MESSAGING_TESTS.md` for test prompts
   - Install Jest: `npm install -D jest @testing-library/react`

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Router v7 Docs](https://reactrouter.com/)
- [TailwindCSS v4 Docs](https://tailwindcss.com/)
- [Vite Guide](https://vitejs.dev/guide/)

---

## 💬 Need Help?

Check the documentation files:
- `README.md` - Full project overview
- `GLASS_DESIGN_GUIDE.md` - Design system reference
- `MESSAGING_TESTS.md` - Testing guide
- `FIREBASE_RULES_NOTES.md` - Security rules explained
