import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { auth, app } from '../services/firebase';

const db = getFirestore(app);

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  async function signup(email: string, password: string, displayName: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        
        // Store user data in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          displayName,
          createdAt: new Date(),
          isAdmin: email === 'admin@vant.io',
        });
        
        // Check if admin
        if (email === 'admin@vant.io') {
          setIsAdmin(true);
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
    
    // Check if admin
    if (email === 'admin@vant.io') {
      setIsAdmin(true);
    }
  }

  function logout() {
    setIsAdmin(false);
    return signOut(auth);
  }

  async function loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      // Add additional scopes if needed
      provider.addScope('profile');
      provider.addScope('email');
      
      // Set custom parameters for better UX
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      
      // Store/update user data in Firestore
      if (result.user) {
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          lastLogin: new Date(),
          isAdmin: result.user.email === 'admin@vant.io',
        }, { merge: true });
        
        // Check if admin
        if (result.user.email === 'admin@vant.io') {
          setIsAdmin(true);
        }
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      // Re-throw the error so it can be caught by the UI
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      // Check if admin
      if (user?.email === 'admin@vant.io') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    isAdmin,
    signup,
    login,
    logout,
    loginWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
