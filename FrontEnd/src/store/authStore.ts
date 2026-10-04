import { create } from 'zustand';
import { AuthState } from '../types/user.types';

interface AuthStore extends AuthState {
  login: (credentials: any) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isLoggedIn: false,
  user: null,
  login: async () => { /* Mock for phase 2 */ },
  logout: () => set({ isLoggedIn: false, user: null }),
}));

