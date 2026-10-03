import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  return { isLoggedIn, user, login, logout };
};

