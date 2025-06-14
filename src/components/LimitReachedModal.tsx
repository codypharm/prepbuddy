import React from 'react';
import { X, AlertCircle } from 'lucide-react';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  featureName: string;
  currentPlan: string;
}

const LimitReachedModal: React.FC<LimitReachedModalProps> = ({
  isOpen,
  onClose,
  message,
  featureName,
  currentPlan
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          {featureName} Limit Reached
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-2">
            Your Current Plan: {currentPlan}
          </h4>
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            Upgrade to a higher tier to get more {featureName.toLowerCase()} and unlock additional features.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
          <a
            href="/pricing"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg transition-colors"
          >
            View Plans
          </a>
        </div>
      </div>
    </div>
  );
};

export default LimitReachedModal;