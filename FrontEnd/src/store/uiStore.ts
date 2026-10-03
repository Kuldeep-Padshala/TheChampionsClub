import { create } from 'zustand';

interface UIStore {
  loginModalOpen: boolean;
  loginModalAction: string;
  openLoginModal: (action: string) => void;
  closeLoginModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  loginModalOpen: false,
  loginModalAction: '',
  openLoginModal: (action: string) => set({ loginModalOpen: true, loginModalAction: action }),
  closeLoginModal: () => set({ loginModalOpen: false, loginModalAction: '' }),
}));

