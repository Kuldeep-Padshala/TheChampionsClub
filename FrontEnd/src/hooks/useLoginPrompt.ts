import { useUIStore } from '../store/uiStore';
import { useAuth } from '../context/AuthContext';

export const useLoginPrompt = () => {
  const openLoginModal = useUIStore((state) => state.openLoginModal);
  const closeLoginModal = useUIStore((state) => state.closeLoginModal);
  const isOpen = useUIStore((state) => state.loginModalOpen);
  const actionText = useUIStore((state) => state.loginModalAction);
  const { isAuthenticated, user } = useAuth();

  const requireLogin = (actionName: string, onAuthenticated?: () => void): boolean => {
    if (isAuthenticated && user) {
      if (onAuthenticated) {
        onAuthenticated();
      }
      return false; // Already authenticated, no modal needed
    }
    openLoginModal(actionName);
    return true; // Unauthenticated, modal opened
  };

  return { isOpen, actionText, requireLogin, closeLoginModal, isAuthenticated, user };
};

