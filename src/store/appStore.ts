// Zustand store for global state management
import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>(set => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  setUser: user =>
    set({ user, isAuthenticated: user !== null, isLoading: false }),
  setLoading: loading => set({ isLoading: loading }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
