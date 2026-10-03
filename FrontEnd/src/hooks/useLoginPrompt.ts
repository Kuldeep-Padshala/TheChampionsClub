import { useUIStore } from '../store/uiStore';

export const useLoginPrompt = () => {
  const openLoginModal = useUIStore((state) => state.openLoginModal);
  const closeLoginModal = useUIStore((state) => state.closeLoginModal);
  const isOpen = useUIStore((state) => state.loginModalOpen);
  const actionText = useUIStore((state) => state.loginModalAction);

  const requireLogin = (actionName: string) => {
    openLoginModal(actionName);
  };

  return { isOpen, actionText, requireLogin, closeLoginModal };
};

