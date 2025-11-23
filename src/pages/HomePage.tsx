// Example page component
import { useAuth } from '../hooks/useAuth';
import { getUserProfile } from '../lib/rtdb-helpers';
import { useEffect, useState } from 'react';

interface UserData {
  profile: {
    name: string;
    email: string;
    createdAt: number;
  };
  credits: number;
}

export default function HomePage() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        try {
          const data = await getUserProfile(currentUser.uid);
          setUserData(data);
        } catch (error) {
          console.error('Error loading user data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadUserData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
            {userData?.profile.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {userData?.profile.name || 'User'}!
          </h1>
          <p className="text-lg text-gray-600">
            Your Vantai dashboard is ready
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
            <div className="text-3xl mb-2">💳</div>
            <p className="text-sm text-gray-600 mb-1">Credits</p>
            <p className="text-3xl font-bold text-gray-900">
              {userData?.credits || 0}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-sm text-gray-600 mb-1">Messages</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6">
            <div className="text-3xl mb-2">⭐</div>
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <p className="text-lg font-semibold text-gray-900">Active</p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-gray-50 rounded-xl">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all">
              Start New Conversation
            </button>
            <button className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-all">
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

