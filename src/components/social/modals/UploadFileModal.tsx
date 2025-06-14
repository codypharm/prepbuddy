import React from "react";
import { X, Upload } from "lucide-react";
import { FileProcessor } from "../../../services/fileProcessor";

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUploading: boolean;
  uploadError: string | null;
  onFileUpload: (file: File) => void;
}

const UploadFileModal: React.FC<UploadFileModalProps> = ({
  isOpen,
  onClose,
  isUploading,
  uploadError,
  onFileUpload,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            Upload Study File
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {uploadError && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
            <p className="text-red-300 text-sm">{uploadError}</p>
          </div>
        )}

        <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-gray-600 transition-colors">
          {isUploading ? (
            <div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-300">Processing file...</p>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-300 mb-4">
                <label className="text-blue-400 hover:text-blue-300 cursor-pointer font-medium transition-colors">
                  Choose file to upload
                  <input
                    type="file"
                    className="hidden"
                    accept={FileProcessor.getAcceptString()}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onFileUpload(file);
                    }}
                  />
                </label>
              </p>
              <p className="text-sm text-gray-400">
                Supports PDF, DOCX, TXT, MD, RTF, LaTeX, BibTeX (max 25MB)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadFileModal;
