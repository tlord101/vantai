import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from './GlassCard';
import { subscriptionService, SubscriptionData } from '../services/subscription';
import { Users, Shield, LogOut, Crown, Zap, Gift } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

interface UserData {
  uid: string;
  email: string;
  subscription: SubscriptionData;
}

export const AdminDashboard = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  useEffect(() => {
    void loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersList = await subscriptionService.getAllUsers();
      setUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async (userId: string, newPlan: 'free' | 'basic' | 'premium') => {
    setUpdatingUser(userId);
    try {
      await subscriptionService.updateUserPlan(userId, newPlan);
      await loadUsers(); // Reload users to get updated data
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Failed to update subscription plan');
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'premium':
        return <Crown className="w-4 h-4" />;
      case 'basic':
        return <Zap className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium':
        return 'from-yellow-500 to-orange-500';
      case 'basic':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen w-full p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                  <p className="text-white/60 text-sm">Manage users and subscriptions</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-white/60 text-xs">Total Users</p>
                <p className="text-white text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <Gift className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-white/60 text-xs">Free Plan</p>
                <p className="text-white text-2xl font-bold">
                  {users.filter(u => u.subscription.plan === 'free').length}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-cyan-400" />
              <div>
                <p className="text-white/60 text-xs">Basic Plan</p>
                <p className="text-white text-2xl font-bold">
                  {users.filter(u => u.subscription.plan === 'basic').length}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-white/60 text-xs">Premium Plan</p>
                <p className="text-white text-2xl font-bold">
                  {users.filter(u => u.subscription.plan === 'premium').length}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full"
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-white/60 text-sm font-medium py-3 px-4">Email</th>
                      <th className="text-left text-white/60 text-sm font-medium py-3 px-4">Current Plan</th>
                      <th className="text-left text-white/60 text-sm font-medium py-3 px-4">Images Used</th>
                      <th className="text-left text-white/60 text-sm font-medium py-3 px-4">Expires</th>
                      <th className="text-left text-white/60 text-sm font-medium py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <motion.tr
                        key={user.uid}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <p className="text-white text-sm">{user.email}</p>
                          <p className="text-white/40 text-xs">{user.uid.slice(0, 8)}...</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${getPlanColor(user.subscription.plan)}`}>
                            {getPlanIcon(user.subscription.plan)}
                            <span className="text-white text-xs font-medium capitalize">
                              {user.subscription.plan}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-white text-sm">
                            {user.subscription.imagesUsedToday} / {user.subscription.plan === 'premium' ? '∞' : user.subscription.plan === 'basic' ? '10' : '0'}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-white/60 text-sm">
                            {new Date(user.subscription.endDate).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleChangePlan(user.uid, 'free')}
                              disabled={user.subscription.plan === 'free' || updatingUser === user.uid}
                              className="px-3 py-1 rounded-lg bg-gray-500/20 hover:bg-gray-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs transition-colors"
                            >
                              Free
                            </button>
                            <button
                              onClick={() => handleChangePlan(user.uid, 'basic')}
                              disabled={user.subscription.plan === 'basic' || updatingUser === user.uid}
                              className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs transition-colors"
                            >
                              Basic
                            </button>
                            <button
                              onClick={() => handleChangePlan(user.uid, 'premium')}
                              disabled={user.subscription.plan === 'premium' || updatingUser === user.uid}
                              className="px-3 py-1 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs transition-colors"
                            >
                              Premium
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>

                {users.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40">No users found</p>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};
