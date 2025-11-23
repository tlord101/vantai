import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, X, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GlassCard } from './GlassCard';
import { paystackService } from '../services/paystack';
import { subscriptionService, PLANS, SubscriptionData } from '../services/subscription';

interface SubscriptionPageProps {
  onSubscribed?: () => void;
  onClose?: () => void;
}

export function SubscriptionPage({ onSubscribed, onClose }: SubscriptionPageProps) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    loadSubscription();
  }, [currentUser]);

  const loadSubscription = async () => {
    if (!currentUser) return;
    const sub = await subscriptionService.getUserSubscription(currentUser.uid);
    setCurrentSubscription(sub);
  };

  const handleSubscribe = async (plan: 'basic' | 'premium') => {
    if (!currentUser) return;

    setProcessingPlan(plan);
    setLoading(true);

    const planDetails = PLANS[plan];
    const reference = paystackService.generateReference(currentUser.uid);

    try {
      paystackService.initializePayment({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: currentUser.email || '',
        amount: planDetails.price,
        ref: reference,
        metadata: {
          userId: currentUser.uid,
          plan,
          custom_fields: [
            {
              display_name: 'Plan',
              variable_name: 'plan',
              value: planDetails.name,
            },
            {
              display_name: 'User ID',
              variable_name: 'user_id',
              value: currentUser.uid,
            },
          ],
        },
        onSuccess: async (response) => {
          console.log('Payment successful:', response);
          
          // Upgrade subscription
          await subscriptionService.upgradeSubscription(
            currentUser.uid,
            plan,
            response.reference
          );

          // Reload subscription
          await loadSubscription();

          setLoading(false);
          setProcessingPlan(null);

          if (onSubscribed) {
            onSubscribed();
          }
        },
        onClose: () => {
          setLoading(false);
          setProcessingPlan(null);
        },
      });
    } catch (error) {
      console.error('Payment error:', error);
      setLoading(false);
      setProcessingPlan(null);
    }
  };

  const isCurrentPlan = (plan: string) => {
    return currentSubscription?.plan === plan;
  };

  const isExpired = () => {
    if (!currentSubscription || currentSubscription.plan === 'free') return false;
    return new Date() > currentSubscription.endDate;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full glass-effect mb-6"
          >
            <Crown className="w-10 h-10 text-yellow-400" />
          </motion.div>
          <h1 className="text-5xl font-bold text-white mb-4">Choose Your Plan</h1>
          <p className="text-white/70 text-lg">
            Unlock the full power of AI chat with image generation
          </p>
          
          {onClose && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 p-3 rounded-full glass-effect hover:bg-white/20 transition-all"
            >
              <X className="w-6 h-6 text-white" />
            </motion.button>
          )}
        </div>

        {/* Current Subscription Status */}
        {currentSubscription && currentSubscription.plan !== 'free' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    Current Plan: {PLANS[currentSubscription.plan].name}
                  </h3>
                  <p className="text-white/60 text-sm">
                    {isExpired() ? (
                      <span className="text-red-400">Expired on {currentSubscription.endDate.toLocaleDateString()}</span>
                    ) : (
                      <span>Valid until {currentSubscription.endDate.toLocaleDateString()}</span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-sm">Images used today</p>
                  <p className="text-white font-bold text-2xl">
                    {currentSubscription.imagesUsedToday}
                    {PLANS[currentSubscription.plan].dailyImageLimit === -1 
                      ? ' / ∞' 
                      : ` / ${PLANS[currentSubscription.plan].dailyImageLimit}`}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className={`p-8 h-full ${isCurrentPlan('free') ? 'ring-2 ring-white/30' : ''}`}>
              <div className="text-center mb-6">
                <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">₦0</span>
                  <span className="text-white/60">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {PLANS.free.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-white/70">
                    <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan('free') && (
                <div className="text-center py-3 rounded-xl bg-white/10 text-white/60 text-sm">
                  Current Plan
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Basic Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className={`p-8 h-full ${isCurrentPlan('basic') ? 'ring-2 ring-purple-400' : ''}`}>
              <div className="text-center mb-6">
                <Zap className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Basic</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">₦15,000</span>
                  <span className="text-white/60">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {PLANS.basic.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-white/90">
                    <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan('basic') && !isExpired() ? (
                <div className="text-center py-3 rounded-xl bg-purple-500/20 text-purple-300 text-sm">
                  Current Plan
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSubscribe('basic')}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {processingPlan === 'basic' && loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    'Subscribe Now'
                  )}
                </motion.button>
              )}
            </GlassCard>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className={`p-8 h-full relative overflow-hidden ${isCurrentPlan('premium') ? 'ring-2 ring-yellow-400' : ''}`}>
              {/* Popular Badge */}
              <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-4 py-1 rounded-bl-xl">
                POPULAR
              </div>

              <div className="text-center mb-6 mt-4">
                <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">₦25,000</span>
                  <span className="text-white/60">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {PLANS.premium.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-white/90">
                    <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan('premium') && !isExpired() ? (
                <div className="text-center py-3 rounded-xl bg-yellow-500/20 text-yellow-300 text-sm">
                  Current Plan
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSubscribe('premium')}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {processingPlan === 'premium' && loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    'Subscribe Now'
                  )}
                </motion.button>
              )}
            </GlassCard>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-white/50 text-sm mt-8"
        >
          Secure payment powered by Paystack • Cancel anytime
        </motion.p>
      </motion.div>
    </div>
  );
}
