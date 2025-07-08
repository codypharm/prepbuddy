import React from 'react';
import UnifiedInput from '../UnifiedInput';

// Import the FileData interface from UnifiedInput
interface FileData {
  file: File;
  content: string;
}

interface DashboardCreateProps {
  onSubmit: (data: {
    content: string;
    files?: FileData[];
    hasFile: boolean;
  }) => void;
}

const DashboardCreate: React.FC<DashboardCreateProps> = ({ onSubmit }) => {
  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Create New Study Plan
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Transform your content into a personalized AI-powered learning experience
        </p>
      </div>
      <UnifiedInput onSubmit={onSubmit} />
    </div>
  );
};

export default DashboardCreate;
