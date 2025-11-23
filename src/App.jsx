import React, { useState, useEffect, useRef } from 'react';
import { 
  Banana, Wand2, Image as ImageIcon, Download, RefreshCw, 
  AlertCircle, Settings, X, Loader2, Upload, Trash2, 
  CreditCard, LogOut, Coins, User, CheckCircle2, ShieldCheck 
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  increment,
  collection 
} from 'firebase/firestore';

// --- Configuration ---

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwi-x6zG01qxonURhflnGPTz6fhtFQVUw",
  authDomain: "vantflowv1.firebaseapp.com",
  projectId: "vantflowv1",
  storageBucket: "vantflowv1.firebasestorage.app",
  messagingSenderId: "1047381509296",
  appId: "1:1047381509296:web:d834083441fb015a9f2775",
  measurementId: "G-JPEWFMF61Y",
  databaseURL: "https://vantflowv1-default-rtdb.firebaseio.com"
};

// Paystack Public Key
const PAYSTACK_PUBLIC_KEY = "pk_live_4d609974f9080d629d43b0a8b4f2a01d54159140";

// --- Initialization ---

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "nano-banana-v1"; // Internal App ID for Firestore pathing

// Pricing Constants
const COST_PER_GEN = 1;
const MIN_BUY_AMOUNT = 10;
const PRICE_PER_NANO_NGN = 1000; // 1 Nano = 1000 Naira

// --- Components ---

const AuthScreen = ({ onLogin, loading }) => (
  <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
    {/* Background Elements */}
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl" style={{ animationDelay: '1s' }}></div>
    </div>

    <div className="z-10 bg-neutral-800/50 p-8 rounded-3xl border border-yellow-500/20 shadow-2xl max-w-md w-full backdrop-blur-md">
      <div className="flex justify-center mb-6">
        <div className="bg-yellow-400 p-4 rounded-2xl shadow-lg rotate-3 hover:rotate-6 transition-transform">
          <Banana className="w-10 h-10 text-neutral-900 fill-neutral-900" />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-center text-white mb-2">Nano Banana</h1>
      <p className="text-center text-neutral-400 mb-8">Sign in to start peeling pixels.</p>

      <button
        onClick={onLogin}
        disabled={loading}
        className="w-full bg-white text-neutral-900 font-bold h-14 rounded-xl flex items-center justify-center gap-3 hover:bg-neutral-200 transition-colors shadow-lg group relative overflow-hidden"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            <span>Continue with Google</span>
          </>
        )}
      </button>
      
      <div className="mt-8 text-center text-xs text-neutral-500">
        By continuing, you agree to the Terms of Service & Privacy Policy.
      </div>
    </div>
  </div>
);

const PaymentModal = ({ onClose, onSuccess, userEmail, paystackLoaded }) => {
  const [amount, setAmount] = useState(MIN_BUY_AMOUNT);
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    if (!paystackLoaded || !window.PaystackPop) {
      alert('Payment system is still loading. Please wait a moment and try again.');
      return;
    }

    setProcessing(true);
    const costInKobo = amount * PRICE_PER_NANO_NGN * 100; // Paystack works in Kobo

    try {
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: userEmail,
        amount: costInKobo,
        currency: 'NGN',
        ref: 'nano-' + Date.now() + '-' + Math.floor((Math.random() * 1000000)),
        metadata: {
          custom_fields: [
            {
              display_name: "Nano Credits",
              variable_name: "nano_credits",
              value: amount
            }
          ]
        },
        callback: function(response) {
          console.log('Payment successful:', response);
          setProcessing(false);
          onSuccess(amount, response.reference);
        },
        onClose: function() {
          console.log('Payment window closed');
          setProcessing(false);
        }
      });

      handler.openIframe();
    } catch (error) {
      console.error('Paystack error:', error);
      alert('Payment initialization failed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-yellow-500/30 w-full max-w-md rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              Top Up Nano
              <Coins className="w-6 h-6 text-yellow-400" />
            </h3>
            <p className="text-neutral-400 text-sm mt-1">Get credits to generate more images.</p>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6 relative z-10">
          <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700">
            <label className="text-xs text-neutral-400 uppercase tracking-wider font-bold mb-2 block">Select Amount</label>
            <div className="grid grid-cols-3 gap-3">
              {[10, 20, 50].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`py-3 px-2 rounded-lg font-bold text-sm transition-all ${
                    amount === val 
                      ? 'bg-yellow-400 text-neutral-900 shadow-lg scale-105' 
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700'
                  }`}
                >
                  {val} Nano
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center py-4 border-t border-neutral-800">
            <span className="text-neutral-400">Price per Nano</span>
            <span className="text-white font-mono">₦{PRICE_PER_NANO_NGN}</span>
          </div>
          
          <div className="flex justify-between items-center py-2">
            <span className="text-xl font-bold text-white">Total</span>
            <span className="text-3xl font-bold text-yellow-400">₦{(amount * PRICE_PER_NANO_NGN).toLocaleString()}</span>
          </div>

          <button 
            onClick={handlePay}
            disabled={processing || !paystackLoaded}
            className="w-full bg-green-500 hover:bg-green-400 text-white h-14 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!paystackLoaded ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading Payment System...
              </>
            ) : processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay Now with Paystack
              </>
            )}
          </button>
          
          <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
            <ShieldCheck className="w-3 h-3" />
            <span>Secured by Paystack</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const NanoBananaApp = () => {
  // App State
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(0);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Generation State
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  
  // API Key
  const apiKey = "AIzaSyDVRaBh8YkiFoDG2GDt9szZVSypM6AyO0s"; 
  
  const fileInputRef = useRef(null);

  // --- Effects ---

  // Check if Paystack is loaded
  useEffect(() => {
    const checkPaystack = () => {
      if (window.PaystackPop) {
        setPaystackLoaded(true);
      } else {
        setTimeout(checkPaystack, 100);
      }
    };
    checkPaystack();
  }, []);

  // Auth & Firestore Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Setup Firestore listener for credits
        // Using path: artifacts/{appId}/users/{uid}/account/balance
        const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'account', 'balance');
        
        // Check if doc exists, if not create it
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
          await setDoc(userRef, { credits: 0, email: currentUser.email });
        }

        const unsubscribeSnapshot = onSnapshot(userRef, (doc) => {
          setCredits(doc.data()?.credits || 0);
        });
        
        setLoadingAuth(false);
        return () => unsubscribeSnapshot();
      } else {
        setCredits(0);
        setLoadingAuth(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // --- Handlers ---

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed", err);
      setError("Login failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setGeneratedImage(null);
    setUploadedImage(null);
    setPrompt('');
  };

  const handlePaymentSuccess = async (amountBought, reference) => {
    if (!user) return;
    
    // In a real app, you would verify the transaction reference via a Cloud Function
    // before updating the balance. For this client-side demo, we update directly.
    try {
      const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'account', 'balance');
      await updateDoc(userRef, {
        credits: increment(amountBought)
      });
      setShowPayment(false);
      setPaymentSuccess(`Successfully added ${amountBought} Nano!`);
      setTimeout(() => setPaymentSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to update credits", err);
      setError("Payment successful but credit update failed. Please contact support.");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      setError("Please upload a valid image file (PNG or JPEG).");
    }
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // 1. Credit Check
    if (credits < COST_PER_GEN) {
      setShowPayment(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    // 2. Deduct Credit Optimistically
    const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'account', 'balance');
    try {
      await updateDoc(userRef, { credits: increment(-COST_PER_GEN) });
    } catch (err) {
      setError("Failed to process transaction.");
      setIsGenerating(false);
      return;
    }

    // 3. API Call
    let url, payload, isEditing;

    if (uploadedImage) {
      // Editing Mode
      isEditing = true;
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
      const base64Data = uploadedImage.split(',')[1];
      const mimeType = uploadedImage.split(';')[0].split(':')[1];

      payload = {
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mimeType, data: base64Data } }
          ]
        }],
        generationConfig: { responseModalities: ['IMAGE'] }
      };
    } else {
      // Generation Mode
      isEditing = false;
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
      payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'] }
      };
    }

    const makeRequest = async (retryCount = 0) => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          let errorMsg = `Error: ${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.error?.message || errorMsg;
          } catch(e) {}
          throw new Error(errorMsg);
        }

        const result = await response.json();
        
        let base64Image;
        // Both editing and generation use the same API response format
        const part = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part && part.inlineData && part.inlineData.data) {
          base64Image = part.inlineData.data;
        }

        if (base64Image) {
          setGeneratedImage(`data:image/png;base64,${base64Image}`);
        } else {
          throw new Error("Unexpected response format. No image data found.");
        }

      } catch (err) {
        if (retryCount < 4) {
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return makeRequest(retryCount + 1);
        } else {
          // Refund credit on failure
          await updateDoc(userRef, { credits: increment(COST_PER_GEN) });
          setError(err.message || "Failed to generate. Credits have been refunded.");
        }
      }
    };

    await makeRequest();
    setIsGenerating(false);
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `nano-banana-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // --- Loading State ---
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    );
  }

  // --- Auth Render ---
  if (!user) {
    return <AuthScreen onLogin={handleLogin} loading={loadingAuth} />;
  }

  // --- Main App Render ---
  return (
    <div className="min-h-screen bg-neutral-900 text-yellow-50 font-sans selection:bg-yellow-500 selection:text-neutral-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-yellow-500/10 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="bg-yellow-400 p-1.5 rounded-lg group-hover:rotate-12 transition-transform duration-300">
              <Banana className="w-5 h-5 text-neutral-900 fill-neutral-900" />
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-yellow-400 hidden sm:block">
              Nano<span className="text-white">Banana</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Credit Display */}
            <div 
              onClick={() => setShowPayment(true)}
              className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-yellow-500/20 px-3 py-1.5 rounded-full cursor-pointer transition-colors group"
            >
              <div className="bg-yellow-400/20 p-1 rounded-full">
                <Coins className="w-4 h-4 text-yellow-400" />
              </div>
              <span className={`font-mono font-bold ${credits < 1 ? 'text-red-400' : 'text-white'}`}>
                {credits}
              </span>
              <div className="w-px h-4 bg-neutral-700 mx-1"></div>
              <span className="text-xs font-bold text-yellow-500 group-hover:text-yellow-400 uppercase">Buy</span>
            </div>

            {/* Profile Dropdown/Logout */}
            <div className="flex items-center gap-3 pl-2 border-l border-neutral-800">
               <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-white"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-full transition-colors text-neutral-400"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        
        {/* Left Panel: Controls */}
        <div className="flex-1 flex flex-col gap-6 order-2 lg:order-1">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {uploadedImage ? "Edit Mode" : "Generation Mode"}
            </h2>
            <p className="text-neutral-400 text-sm">
              {uploadedImage ? "Describe changes to your image." : "Create new images from text."}
            </p>
          </div>

          <div className="bg-neutral-800/40 border border-yellow-500/10 rounded-2xl p-4 md:p-6 shadow-xl backdrop-blur-sm space-y-6">
            
            {/* Image Upload */}
            <div>
              <label className="text-xs font-bold text-yellow-500 mb-2 uppercase tracking-wider flex items-center justify-between">
                <span>Reference Image</span>
                {uploadedImage && (
                  <button onClick={clearUploadedImage} className="text-neutral-400 hover:text-red-400 flex items-center gap-1 transition-colors">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                )}
              </label>
              
              {!uploadedImage ? (
                <div 
                  onClick={() => fileInputRef.current.click()}
                  className="border-2 border-dashed border-neutral-700 hover:border-yellow-400/50 rounded-xl h-24 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-neutral-900/30 group"
                >
                  <Upload className="w-6 h-6 text-neutral-500 group-hover:text-yellow-400 transition-colors" />
                  <p className="text-xs text-neutral-500">Tap to upload for editing</p>
                </div>
              ) : (
                <div className="relative h-40 rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900/30 group">
                  <img src={uploadedImage} alt="Upload preview" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={clearUploadedImage} className="bg-red-500/80 p-2 rounded-full text-white">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/png, image/jpeg" 
                className="hidden" 
              />
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-xs font-bold text-yellow-500 mb-2 uppercase tracking-wider">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={uploadedImage ? "Make it cyberpunk style..." : "A futuristic banana city..."}
                className="w-full h-32 bg-neutral-900/50 border border-neutral-700 rounded-xl p-4 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-400/50 resize-none transition-all text-sm"
              />
            </div>
            
            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className={`w-full h-14 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden ${
                isGenerating || !prompt.trim()
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-yellow-400 text-neutral-900 hover:bg-yellow-300 hover:shadow-[0_0_20px_rgba(250,204,21,0.3)] transform hover:-translate-y-0.5'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  {uploadedImage ? `Edit (${COST_PER_GEN} Nano)` : `Generate (${COST_PER_GEN} Nano)`}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div className="flex-[1.5] order-1 lg:order-2 bg-neutral-950 rounded-3xl border-2 border-dashed border-neutral-800 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px] group">
          
          {generatedImage ? (
            <>
              <img 
                src={generatedImage} 
                alt="Generated output" 
                className="w-full h-full object-contain z-10 animate-in fade-in zoom-in duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-end justify-center pb-8 gap-4">
                  <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-neutral-900 rounded-full hover:bg-yellow-400 transition-colors shadow-lg font-bold"
                  >
                    <Download className="w-5 h-5" /> Save
                  </button>
                  <button 
                    onClick={handleGenerate}
                    className="flex items-center gap-2 px-6 py-3 bg-neutral-800 text-white rounded-full hover:bg-neutral-700 transition-colors shadow-lg border border-neutral-700 font-bold"
                  >
                    <RefreshCw className="w-5 h-5" /> Retry
                  </button>
              </div>
            </>
          ) : (
            <div className="text-center p-8 space-y-4 opacity-40">
              <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center mx-auto border border-neutral-800">
                {isGenerating ? (
                   <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
                ) : (
                   <ImageIcon className="w-10 h-10 text-neutral-600" />
                )}
              </div>
              <p className="text-neutral-500 font-medium text-lg">
                {isGenerating ? "Burning Nano..." : "Ready to create"}
              </p>
            </div>
          )}

          {/* Messages (Error / Success) */}
          {error && (
            <div className="absolute bottom-4 left-4 right-4 bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3 backdrop-blur-md z-30 animate-in slide-in-from-bottom-5">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto hover:text-white"><X className="w-4 h-4" /></button>
            </div>
          )}
          
          {paymentSuccess && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-500/20 border border-green-500/50 text-green-200 px-6 py-3 rounded-full flex items-center gap-2 backdrop-blur-md z-30 animate-in slide-in-from-top-5">
              <CheckCircle2 className="w-5 h-5" />
              <p className="text-sm font-bold">{paymentSuccess}</p>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showPayment && (
        <PaymentModal 
          onClose={() => setShowPayment(false)} 
          onSuccess={handlePaymentSuccess}
          userEmail={user.email}
          paystackLoaded={paystackLoaded}
        />
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-yellow-400" />
                App Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-neutral-800 rounded-xl">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center"><User className="w-5 h-5"/></div>
                )}
                <div>
                  <p className="text-sm font-bold text-white">{user.displayName || 'User'}</p>
                  <p className="text-xs text-neutral-400">{user.email}</p>
                </div>
              </div>

              <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700">
                <p className="text-xs text-neutral-400 mb-2">Credits</p>
                <p className="text-2xl font-bold text-yellow-400">{credits} Nano</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowSettings(false)}
                className="bg-yellow-400 text-neutral-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 text-center text-neutral-600 text-xs">
        <p>© 2024 Nano Banana. Secured by Firebase & Paystack.</p>
      </footer>
    </div>
  );
};

export default NanoBananaApp;
