import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthState {
  currentUser: User | null;
  loading: boolean;
  error: Error | null;
  isAdmin: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    currentUser: null,
    loading: true,
    error: null,
    isAdmin: false,
  });

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        let isAdmin = false;
        
        if (user) {
          // Check for admin custom claim
          const tokenResult = await user.getIdTokenResult();
          isAdmin = !!tokenResult.claims.admin;
        }
        
        setAuthState({
          currentUser: user,
          loading: false,
          error: null,
          isAdmin,
        });
      },
      error => {
        setAuthState({
          currentUser: null,
          loading: false,
          error: error as Error,
          isAdmin: false,
        });
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return authState;
};
