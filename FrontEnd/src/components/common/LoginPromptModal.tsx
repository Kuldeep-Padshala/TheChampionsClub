import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useLoginPrompt } from '../../hooks/useLoginPrompt';
import { ROUTES } from '../../constants/routes';

export const LoginPromptModal = () => {
  const { isOpen, actionText, closeLoginModal } = useLoginPrompt();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    closeLoginModal();
    navigate(path);
  };

  return (
    <Modal isOpen={isOpen} onClose={closeLoginModal}>
      <div className="text-center space-y-6 py-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold-light/20">
          <Lock className="h-6 w-6 text-gold-primary" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-primary mb-2">Members Only</h2>
          <p className="text-text-secondary">
            Please log in or create an account to {actionText}.
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <Button onClick={() => handleNavigate(ROUTES.LOGIN)} className="w-full">
            Log In
          </Button>
          <Button variant="outline" onClick={() => handleNavigate(ROUTES.REGISTER)} className="w-full">
            Sign Up
          </Button>
        </div>
      </div>
    </Modal>
  );
};

