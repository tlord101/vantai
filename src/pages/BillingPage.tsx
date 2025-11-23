/**
 * Billing Page Component
 * 
 * Displays user credits, purchase options, transaction history, and subscription management.
 * Features glass morphism design with real-time credit updates.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { doc, collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { CreditCard, Zap, Crown, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

interface Transaction {
  id: string;
  type: 'purchase' | 'charge';
  amount: number;
  credits: number;
  timestamp: Date;
  status: 'success' | 'pending' | 'failed';
  metadata?: {
    action?: string;
    prompt?: string;
  };
}

interface Subscription {
  planId: string;
  status: 'active' | 'inactive' | 'cancelled';
  startDate: Date;
  nextBillingDate?: Date;
  credits: number;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 50,
    price: 500,
    icon: Zap,
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 150,
    price: 1200,
    popular: true,
    icon: TrendingUp,
  },
  {
    id: 'premium',
    name: 'Premium',
    credits: 500,
    price: 3500,
    icon: Crown,
  },
];

export default function BillingPage() {
  const { currentUser: user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);

  // Real-time credit balance
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCredits(data.credits ?? 0);
      } else {
        setCredits(0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Load transaction history
  useEffect(() => {
    if (!user) return;

    const billingQuery = query(
      collection(db, 'billing'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(billingQuery, (snapshot) => {
      const txs: Transaction[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || 'purchase',
          amount: data.amount || 0,
          credits: data.credits || 0,
          timestamp: data.timestamp?.toDate() || new Date(),
          status: data.status || 'success',
          metadata: data.metadata,
        };
      });
      setTransactions(txs);
    });

    return () => unsubscribe();
  }, [user]);

  // Load subscription status
  useEffect(() => {
    if (!user) return;

    const subDocRef = doc(db, 'subscriptions', user.uid);
    const unsubscribe = onSnapshot(subDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSubscription({
          planId: data.planId || '',
          status: data.status || 'inactive',
          startDate: data.startDate?.toDate() || new Date(),
          nextBillingDate: data.nextBillingDate?.toDate(),
          credits: data.credits || 0,
        });
      } else {
        setSubscription(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handlePurchase = async (packageId: string) => {
    if (!user) return;

    setPurchaseLoading(packageId);

    try {
      const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
      if (!pkg) throw new Error('Package not found');

      const token = await user.getIdToken();
      const response = await fetch(
        `${import.meta.env.VITE_FIREBASE_FUNCTIONS_URL}/createSubscription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            planId: packageId,
            credits: pkg.credits,
            amount: pkg.price,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Purchase failed');
      }

      const data = await response.json();
      
      // Redirect to Paystack checkout
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      alert(`Purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPurchaseLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG')}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/80"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Credit Balance */}
        <div className="glass-panel p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Billing & Credits</h1>
              <p className="text-white/70">Manage your credits and subscription</p>
            </div>
            <div className="text-right">
              <div className="text-white/70 text-sm mb-1">Available Credits</div>
              <div className="text-5xl font-bold text-white credit-pulse">
                {credits !== null ? credits.toLocaleString() : '---'}
              </div>
            </div>
          </div>
        </div>

        {/* Active Subscription (if any) */}
        {subscription && subscription.status === 'active' && (
          <div className="glass-panel p-6 border-2 border-blue-400/30">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Crown className="w-8 h-8 text-yellow-400" />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    Active Subscription
                  </h3>
                  <p className="text-white/70">
                    Plan: <span className="text-white font-medium capitalize">{subscription.planId}</span>
                  </p>
                  <p className="text-white/70 text-sm mt-1">
                    Started: {formatDate(subscription.startDate)}
                  </p>
                  {subscription.nextBillingDate && (
                    <p className="text-white/70 text-sm">
                      Next billing: {formatDate(subscription.nextBillingDate)}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/70 text-sm">Monthly Credits</div>
                <div className="text-3xl font-bold text-white">{subscription.credits}</div>
              </div>
            </div>
          </div>
        )}

        {/* Credit Packages */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Buy Credits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CREDIT_PACKAGES.map((pkg) => {
              const Icon = pkg.icon;
              const pricePerCredit = pkg.price / pkg.credits;

              return (
                <div
                  key={pkg.id}
                  className={`glass-panel p-6 relative transition-all hover:scale-105 ${
                    pkg.popular ? 'border-2 border-blue-400/50' : ''
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        POPULAR
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="w-8 h-8 text-white/90" />
                    <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                  </div>

                  <div className="mb-6">
                    <div className="text-4xl font-bold text-white mb-2">
                      {pkg.credits}
                    </div>
                    <div className="text-white/70">Credits</div>
                    <div className="text-2xl font-bold text-white mt-3">
                      {formatCurrency(pkg.price)}
                    </div>
                    <div className="text-white/50 text-sm mt-1">
                      {formatCurrency(pricePerCredit)}/credit
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={purchaseLoading !== null}
                    className="w-full glass-button py-3 px-4 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {purchaseLoading === pkg.id ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        <span>Buy Now</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Transaction History</h2>
          <div className="glass-panel overflow-hidden">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-white/60">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Type</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Credits</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Amount</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          {getStatusIcon(tx.status)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white capitalize">{tx.type}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${tx.type === 'purchase' ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.type === 'purchase' ? '+' : '-'}{tx.credits}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white">
                          {tx.amount > 0 ? formatCurrency(tx.amount) : '—'}
                        </td>
                        <td className="px-6 py-4 text-white/70 text-sm">
                          {formatDate(tx.timestamp)}
                        </td>
                        <td className="px-6 py-4 text-white/70 text-sm">
                          {tx.metadata?.action && (
                            <span className="capitalize">{tx.metadata.action}</span>
                          )}
                          {tx.metadata?.prompt && (
                            <div className="truncate max-w-xs" title={tx.metadata.prompt}>
                              {tx.metadata.prompt}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Info */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Credit Usage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/80">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <span>Image Generation</span>
              <span className="font-semibold">5 credits</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <span>Image Editing</span>
              <span className="font-semibold">3 credits</span>
            </div>
          </div>
          <p className="text-white/60 text-sm mt-4">
            Credits never expire. Admin users have unlimited access.
          </p>
        </div>
      </div>
    </div>
  );
}
