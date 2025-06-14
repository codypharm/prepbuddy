import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import { useAuthStore } from '../stores/useAuthStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const { isAuthenticated } = useAuthStore();

  // Close modal if user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      onClose();
    }
  }, [isAuthenticated, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="relative p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {mode === 'signin' ? (
            <SignInForm
              onSwitchToSignUp={() => setMode('signup')}
              onClose={onClose}
            />
          ) : (
            <SignUpForm
              onSwitchToSignIn={() => setMode('signin')}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;