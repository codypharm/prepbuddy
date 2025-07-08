import React from "react";
import { BookOpen, Calendar, PlusCircle, FileText } from "lucide-react";

interface FileIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIntent: (intent: "reference" | "extend" | "enhance") => void;
  fileCount: number;
}

const FileIntentModal: React.FC<FileIntentModalProps> = ({
  isOpen,
  onClose,
  onSelectIntent,
  fileCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            How would you like to use {fileCount > 1 ? "these files" : "this file"}?
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => onSelectIntent("reference")}
            className="w-full flex items-center p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-4">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-gray-900 dark:text-white">Add as reference material</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Use these files for quiz generation and as reference materials only
              </p>
            </div>
          </button>

          <button
            onClick={() => onSelectIntent("extend")}
            className="w-full flex items-center p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mr-4">
              <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-gray-900 dark:text-white">Extend my study plan</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add additional days based on new content
              </p>
            </div>
          </button>

          <button
            onClick={() => onSelectIntent("enhance")}
            className="w-full flex items-center p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mr-4">
              <PlusCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-gray-900 dark:text-white">Enhance existing plan</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Fill knowledge gaps in current days based on new content
              </p>
            </div>
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          <p>
            You can always access all your files in the "Study Materials" section
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileIntentModal;
