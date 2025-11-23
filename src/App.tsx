import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { LiquidBackground } from './components/LiquidBackground';
import { GlassCard } from './components/GlassCard';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { AuthPage } from './components/AuthPage';
import { SubscriptionPage } from './components/SubscriptionPage';
import { AdminDashboard } from './components/AdminDashboard';
import { useAuth } from './contexts/AuthContext';
import { geminiService, Message } from './services/gemini';
import { subscriptionService, SubscriptionData } from './services/subscription';

function App() {
  const { currentUser, isAdmin } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [showSubscriptionPage, setShowSubscriptionPage] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load subscription data - hooks must be at top level
  useEffect(() => {
    if (currentUser && !isAdmin) {
      loadSubscription();
    }
  }, [currentUser, isAdmin]);

  // Load chat history on mount
  useEffect(() => {
    if (currentUser && !isAdmin) {
      setMessages(loadChatHistory());
    }
  }, [currentUser, isAdmin]);

  // Auto-scroll and save chat history
  useEffect(() => {
    scrollToBottom();
    if (currentUser && messages.length > 0) {
      try {
        localStorage.setItem(`chat_history_${currentUser.uid}`, JSON.stringify(messages));
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    }
  }, [messages, currentUser]);

  const loadSubscription = async () => {
    if (!currentUser) return;
    setSubscriptionLoading(true);
    const sub = await subscriptionService.getUserSubscription(currentUser.uid);
    setSubscription(sub);
    
    // Show subscription page if user has no active subscription
    if (sub && sub.plan === 'free') {
      setShowSubscriptionPage(true);
    } else if (sub && new Date() > sub.endDate) {
      // Subscription expired
      setShowSubscriptionPage(true);
    }
    setSubscriptionLoading(false);
  };

  const loadChatHistory = (): Message[] => {
    try {
      const saved = localStorage.getItem(`chat_history_${currentUser?.uid}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
    return [
      {
        id: '1',
        text: '🎨 Welcome to VanTai AI Image Generator! Powered by Google Imagen 3 (gemini-3-pro-image-preview).\n\n✨ Create stunning images:\n• Text-to-image: Describe what you want to see\n• Image-to-image: Upload a reference and describe edits\n\nExample prompts:\n"A serene mountain landscape at sunset with dramatic clouds"\n"Make this photo look vintage with warm sepia tones"\n"Add dramatic studio lighting to enhance this portrait"',
        sender: 'ai',
        timestamp: new Date(),
      },
    ];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Show auth page if not logged in
  if (!currentUser) {
    return (
      <div className="relative w-full h-screen overflow-hidden">
        <LiquidBackground />
        <div className="relative z-10">
          <AuthPage />
        </div>
      </div>
    );
  }

  // Show admin dashboard if user is admin
  if (isAdmin) {
    return (
      <div className="relative w-full h-screen overflow-hidden">
        <LiquidBackground />
        <div className="relative z-10">
          <AdminDashboard />
        </div>
      </div>
    );
  }

  // Show subscription page
  if (subscriptionLoading) {
    return (
      <div className="relative w-full h-screen overflow-hidden">
        <LiquidBackground />
        <div className="relative z-10 h-full flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full"
          />
        </div>
      </div>
    );
  }

  if (showSubscriptionPage) {
    return (
      <div className="relative w-full h-screen overflow-hidden">
        <LiquidBackground />
        <div className="relative z-10">
          <SubscriptionPage 
            onSubscribed={() => {
              loadSubscription();
              setShowSubscriptionPage(false);
            }}
            onClose={subscription?.plan !== 'free' ? () => setShowSubscriptionPage(false) : undefined}
          />
        </div>
      </div>
    );
  }

  const handleSendMessage = async (text: string, image?: File) => {
    if (!currentUser) return;

    // Check if user has active subscription for text chat
    if (subscription?.plan === 'free') {
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: '🔒 Please subscribe to a plan to start generating images. Click the upgrade button in the header.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    // Check image limit if image is being sent
    if (image) {
      const { allowed, remaining } = await subscriptionService.checkImageLimit(currentUser.uid);
      if (!allowed) {
        const errorMessage: Message = {
          id: Date.now().toString(),
          text: remaining === 0 
            ? '🚫 You have reached your daily image generation limit. Upgrade to Premium for unlimited images or wait until tomorrow.'
            : '🔒 Image generation requires a subscription. Please upgrade to Basic or Premium.',
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text || (image ? '📷 Reference image uploaded' : ''),
      sender: 'user',
      timestamp: new Date(),
      image: image ? URL.createObjectURL(image) : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await geminiService.sendMessage(
        text || 'Generate a creative image based on this reference.',
        image
      );

      // Increment image count if image was generated
      if (currentUser) {
        await subscriptionService.incrementImageCount(currentUser.uid);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'ai',
        timestamp: new Date(),
        generatedImage: response.generatedImage,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error generating the image. Please make sure Imagen API is enabled in your Google Cloud project.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    const initialMessage: Message = {
      id: '1',
      text: 'Hello! I\'m Gemini AI. I can help you with text and image analysis. How can I assist you today?',
      sender: 'ai',
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
    if (currentUser) {
      localStorage.removeItem(`chat_history_${currentUser.uid}`);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <LiquidBackground />
      
      <div className="relative z-10 h-full flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl h-full max-h-[900px] flex flex-col"
        >
          <GlassCard className="flex-1 flex flex-col overflow-hidden">
            <ChatHeader 
              onClearChat={handleClearChat} 
              subscription={subscription}
              onUpgrade={() => setShowSubscriptionPage(true)}
            />
            
            <MessageList messages={messages} />
            <div ref={messagesEndRef} />
            
            <ChatInput 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading}
              subscription={subscription ? {
                plan: subscription.plan,
                imagesUsedToday: subscription.imagesUsedToday,
                dailyImageLimit: subscription.plan === 'premium' ? -1 : subscription.plan === 'basic' ? 10 : 0
              } : null}
            />
          </GlassCard>

          {/* Bottom Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-center"
          >
            <p className="text-white/70 text-sm glass-effect rounded-full px-6 py-2 inline-block">
              Powered by Imagen 3 (gemini-3-pro-image-preview) ✨
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default App;
