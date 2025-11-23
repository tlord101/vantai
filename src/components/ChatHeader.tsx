import { motion } from 'framer-motion';
import { Sparkles, LogOut, Trash2, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionData, PLANS } from '../services/subscription';

interface ChatHeaderProps {
  onClearChat?: () => void;
  subscription?: SubscriptionData | null;
  onUpgrade?: () => void;
}

export const ChatHeader = ({ onClearChat, subscription, onUpgrade }: ChatHeaderProps) => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleClearChat = () => {
    if (onClearChat && window.confirm('Are you sure you want to clear the chat history?')) {
      onClearChat();
    }
  };

  const isExpired = () => {
    if (!subscription || subscription.plan === 'free') return false;
    return new Date() > subscription.endDate;
  };

  return (
    <div className="glass-effect-strong border-b border-white/10 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Animated AI Icon */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 flex items-center justify-center glass-effect"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>

          <div>
            <h1 className="text-white font-bold text-lg">VanTai Image Generator</h1>
            <div className="flex items-center gap-2">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="w-2 h-2 bg-green-400 rounded-full"
              />
              <span className="text-white/70 text-sm">
                {currentUser?.displayName || currentUser?.email}
              </span>
              {subscription && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  subscription.plan === 'premium' 
                    ? 'bg-yellow-500/20 text-yellow-300'
                    : subscription.plan === 'basic'
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-gray-500/20 text-gray-300'
                }`}>
                  {isExpired() ? 'Expired' : PLANS[subscription.plan].name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Subscription Info */}
          {subscription && subscription.plan !== 'free' && !isExpired() && (
            <div className="hidden md:block text-right text-sm">
              <p className="text-white/60">Images today</p>
              <p className="text-white font-semibold">
                {subscription.imagesUsedToday}
                {PLANS[subscription.plan].dailyImageLimit === -1 
                  ? ' / ∞' 
                  : ` / ${PLANS[subscription.plan].dailyImageLimit}`}
              </p>
            </div>
          )}

          {/* Upgrade Button */}
          {onUpgrade && (subscription?.plan === 'free' || isExpired()) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onUpgrade}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Upgrade</span>
            </motion.button>
          )}

          {/* Decorative liquid orbs */}
          <div className="relative w-16 h-16 hidden sm:block">
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full filter blur-md opacity-60"
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, 90, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute inset-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full filter blur-md opacity-60"
              animate={{
                scale: [1.3, 1, 1.3],
                rotate: [90, 0, 90],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Clear Chat Button */}
          {onClearChat && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClearChat}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm border border-white/10 group"
              title="Clear Chat History"
            >
              <Trash2 className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
            </motion.button>
          )}

          {/* Logout Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm border border-white/10 group"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
