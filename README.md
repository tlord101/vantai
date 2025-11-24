# Vant AI - Image Generation App

AI-powered image generation application using Google's Generative AI API with Firebase authentication and Paystack payment integration.

## Features

- 🎨 AI Image Generation using Google Imagen & Gemini
- 🖼️ Image Editing Mode
- 🔐 Firebase Authentication (Email & Google)
- 💳 Paystack Payment Integration
- ⚡ Smart Queue System (handles multiple users gracefully)
- 🎯 Toast Notifications for errors and success messages
- 🔒 Secure API key management with environment variables
- ⏱️ Rate limiting with intelligent queueing (3 requests per minute per user)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Then edit `.env` and add your actual API keys:

- **Firebase Configuration**: Get from Firebase Console
- **Paystack Public Key**: Get from Paystack Dashboard
- **Google Generative AI API Key**: Get from Google AI Studio

### 3. Run the Application

Start the development server:

```bash
npm start
```

Or use nodemon for auto-reload during development:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Deployment to Vercel

### Environment Variables Setup

Add the following environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add all variables from `.env`:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
   - `FIREBASE_MEASUREMENT_ID`
   - `FIREBASE_DATABASE_URL`
   - `PAYSTACK_PUBLIC_KEY`
   - `GOOGLE_GEN_API_KEY`

4. Redeploy your application

The serverless functions in the `/api` folder will automatically handle requests on Vercel.

## Rate Limiting

The application implements an intelligent queue system to handle multiple concurrent users:

- **Smart Processing**: Requests are processed one by one to prevent API throttling
- **Rate Limiting**: Each user can make 3 requests per minute
- **User-Friendly Wait**: Instead of rejecting requests, users are placed in a queue
- **Visual Feedback**: Users see their queue position and a friendly waiting message
- **Automatic Processing**: The system automatically processes queued requests in order

### How It Works:
1. When multiple users send requests simultaneously, they're added to a queue
2. Each request is processed sequentially with proper rate limiting
3. Users see a beautiful animated message: "Please hold on, your image will be generated soon! ✨"
4. Queue position is displayed in real-time
5. Once processed, users receive their generated image with a success notification

## Toast Notifications

The app uses a custom toast notification system for user feedback:
- ✅ **Success** - Green toasts for successful operations
- ❌ **Error** - Red toasts for errors and failures
- ⚠️ **Warning** - Orange toasts for warnings
- ℹ️ **Info** - Blue toasts for informational messages

## API Endpoints

### GET `/api/config`
Returns Firebase and Paystack configuration (public keys only)

### POST `/api/generate`
Generates or edits images using AI

**Request Body:**
```json
{
  "prompt": "A futuristic city",
  "userId": "user-id",
  "customKey": "optional-custom-api-key",
  "isEdit": false,
  "imageBase64": "optional-base64-image",
  "imageMime": "optional-mime-type"
}
```

**Response:**
```json
{
  "success": true,
  "imageData": "base64-encoded-image"
}
```

## Security Notes

- ⚠️ Never commit `.env` file to version control
- 🔒 API keys are stored server-side and not exposed to client
- 🛡️ Rate limiting prevents API abuse
- ✅ Firebase handles authentication securely

## Technologies Used

- **Frontend**: HTML, Tailwind CSS, Vanilla JavaScript
- **Backend**: Node.js, Express
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Payment**: Paystack
- **AI**: Google Generative AI (Imagen & Gemini)

## License

© 2024 Vant AI
