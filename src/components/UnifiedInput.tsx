import React, { useCallback, useState, useEffect } from 'react';
import { Upload, Type, FileText, CheckCircle, AlertCircle, X, BookOpen, GraduationCap, Brain, ArrowUpRight } from 'lucide-react';
import { FileProcessor } from '../services/fileProcessor';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { useUsageStore } from '../stores/useUsageStore';
import LimitReachedModal from './LimitReachedModal';
import { useNavigate } from 'react-router-dom';

// Define a file data structure to pass both file metadata and content
interface FileData {
  file: File;
  content: string;
}

interface UnifiedInputProps {
  onSubmit: (data: { content: string; files?: FileData[]; hasFile: boolean }) => void;
}

const UnifiedInput: React.FC<UnifiedInputProps> = ({ onSubmit }) => {
  const navigate = useNavigate();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);
  const [textContent, setTextContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [extractedContent, setExtractedContent] = useState<string>('');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');
  const [planLimitReached, setPlanLimitReached] = useState(false);

  // Get subscription and usage data
  const { getCurrentPlan } = useSubscriptionStore();
  const { getUsage, incrementUsage } = useUsageStore();
  
  // Check if user has reached their plan limit on component mount
  useEffect(() => {
    const checkPlanLimits = async () => {
      try {
        const currentPlan = getCurrentPlan();
        const usage = await getUsage();
        
        if (currentPlan.limits.studyPlans !== 'unlimited' && 
            usage.studyPlansCreated >= currentPlan.limits.studyPlans) {
          setPlanLimitReached(true);
        } else {
          setPlanLimitReached(false);
        }
      } catch (error) {
        console.error('Failed to check plan limits:', error);
      }
    };
    
    checkPlanLimits();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Check subscription limits for file uploads
      const currentPlan = getCurrentPlan();
      const usage = await getUsage();
      const availableUploads = currentPlan.limits.fileUploads === 'unlimited' ? Infinity : currentPlan.limits.fileUploads - usage.fileUploads;

      if (files.length > availableUploads) {
        setLimitMessage(
          `You can upload ${availableUploads} more files. ` +
          `Please upgrade your plan to upload more files.`
        );
        setShowLimitModal(true);
        throw new Error('File upload limit reached');
      }

      const newFiles: FileData[] = [];
      let newContent = '';

      for (const file of files) {
        // Check storage limits
        const storageLimit = currentPlan.limits.storage;
        const currentStorage = usage.storageUsed;
        const fileSizeBytes = file.size;

        // Convert storage limit to bytes
        let storageLimitBytes: number;
        if (storageLimit === 'unlimited') {
          storageLimitBytes = Number.MAX_SAFE_INTEGER;
        } else {
          const match = storageLimit.match(/(\d+)(MB|GB)/);
          if (!match) throw new Error('Invalid storage limit format');

          const amount = parseInt(match[1]);
          const unit = match[2];

          if (unit === 'MB') {
            storageLimitBytes = amount * 1024 * 1024;
          } else if (unit === 'GB') {
            storageLimitBytes = amount * 1024 * 1024 * 1024;
          } else {
            throw new Error('Invalid storage unit');
          }
        }

        if (currentStorage + fileSizeBytes > storageLimitBytes) {
          setLimitMessage(
            `You've reached your storage limit of ${storageLimit}. ` +
            `Please upgrade your plan or delete some files to free up space.`
          );
          setShowLimitModal(true);
          throw new Error('Storage limit reached');
        }

        // Validate file size
        if (!FileProcessor.validateFileSize(file)) {
          throw new Error(`File ${file.name} size exceeds 25MB limit`);
        }

        const content = await FileProcessor.extractTextFromFile(file);

        if (content.length < 50) {
          throw new Error(`File ${file.name} content is too short. Please provide more substantial content for analysis.`);
        }

        // Store both file and its content
        newFiles.push({
          file,
          content
        });
        newContent += content + '\n\n';

        // Track file upload usage
        await incrementUsage('fileUploads');
        await incrementUsage('storageUsed', file.size);
      }

      setUploadedFiles(newFiles);
      setExtractedContent(newContent);

    } catch (error) {
      if (error instanceof Error && !error.message.includes('limit reached')) {
        setError(error.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  }, [uploadedFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const combinedContent = [extractedContent, textContent].filter(Boolean).join('\n\n');
    
    if (combinedContent.trim().length < 50) {
      setError('Please provide more content (minimum 50 characters) either by uploading a file or entering text.');
      return;
    }

    try {
      // Check AI request limits before submitting
      const currentPlan = getCurrentPlan();
      const usage = await getUsage();
      
      if (currentPlan.limits.aiRequests !== 'unlimited') {
        if (usage.aiRequests >= currentPlan.limits.aiRequests) {
          setLimitMessage(
            `You've reached your limit of ${currentPlan.limits.aiRequests} AI requests per month. ` +
            `Please upgrade your plan to generate more study plans.`
          );
          setShowLimitModal(true);
          return;
        }
      }

      // Pass both the combined content and file data objects with individual content
      onSubmit({
        content: combinedContent,
        files: uploadedFiles, // Pass actual file data objects with content
        hasFile: uploadedFiles.length > 0
      });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  };

  const clearFiles = () => {
    setUploadedFiles([]);
    setExtractedContent('');
    setError(null);
  };

  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
  };

  const clearError = () => {
    setError(null);
  };

  const totalContent = [extractedContent, textContent].filter(Boolean).join('\n\n');
  const wordCount = totalContent.trim().split(/\s+/).filter(word => word.length > 0).length;
  const isValid = totalContent.trim().length >= 50;

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 p-8 text-center border-b border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Your Study Plan</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Upload your documents and add notes to let PrepBuddy's AI create your perfect learning path
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700 dark:text-red-400 text-sm">{error}</span>
                </div>
                <button type="button" onClick={clearError} className="text-red-500 hover:text-red-700 dark:hover:text-red-300">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* File Upload Section */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📁 Upload Study Materials (Optional)
            </label>
            
            {uploadedFiles.length > 0 ? (
              <div className="space-y-4">
                {uploadedFiles.map((fileData, index) => (
                  <div key={index} className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                          <p className="font-medium text-green-900 dark:text-green-400">{fileData.file.name}</p>
                          <p className="text-sm text-green-700 dark:text-green-400">
                            {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-green-600 hover:text-green-800 dark:hover:text-green-400 p-2"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  isDragOver 
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isProcessing ? (
                  <div className="py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">PrepBuddy is analyzing your document...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Drop your files here, or{' '}
                      <label className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                        browse
                        <input
                          type="file"
                          className="hidden"
                          accept={FileProcessor.getAcceptString()}
                          onChange={handleFileSelect}
                          multiple
                        />
                      </label>
                    </p>
                    <div className="grid md:grid-cols-3 gap-4 mt-6">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Academic Papers</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">PDF, DOCX</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                        <FileText className="h-6 w-6 text-green-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Text Documents</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">TXT, MD, RTF</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                        <GraduationCap className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Academic Formats</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">TEX, BIB</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Text Input Section */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
              ✍️ Additional Notes & Content (Optional)
            </label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Add any additional notes, questions, or content you'd like PrepBuddy to include in your study plan..."
              className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              disabled={isProcessing}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Additional content: {textContent.length} characters
              </span>
            </div>
          </div>

          {/* Content Summary */}
          {totalContent.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                Content Summary
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Total Characters: </span>
                  <span className="text-blue-600 dark:text-blue-400">{totalContent.length.toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Word Count: </span>
                  <span className="text-blue-600 dark:text-blue-400">{wordCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Reading Time: </span>
                  <span className="text-blue-600 dark:text-blue-400">~{Math.ceil(wordCount / 200)} minutes</span>
                </div>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Source File(s): </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {uploadedFiles.map(fileData => fileData.file.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Plan Limit Notice and Upgrade Button */}
          {planLimitReached && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">Study Plan Limit Reached</h3>
                  <p className="text-yellow-700 dark:text-yellow-200 text-sm">
                    You've reached your monthly limit for creating study plans. Upgrade your plan to create more study plans and unlock additional features.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Submit Button or Upgrade Button */}
          {planLimitReached ? (
            <button
              type="button"
              onClick={() => navigate('/settings/subscription')}
              className="w-full py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center
                bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <ArrowUpRight className="h-6 w-6 mr-2" />
              Upgrade Plan to Create More Study Plans
            </button>
          ) : (
            <button
              type="submit"
              disabled={!isValid || isProcessing}
              className={`w-full py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center ${
                isValid && !isProcessing
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Brain className="h-6 w-6 mr-2" />
                  Generate AI Study Plan with PrepBuddy
                </>
              )}
            </button>
          )}

          {/* Features List */}
          <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              <span>AI-powered content analysis</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              <span>Personalized learning paths</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              <span>Progress tracking included</span>
            </div>
          </div>
        </form>
      </div>

      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => {
          setShowLimitModal(false);
          setLimitMessage("");
        }}
        message={limitMessage}
        featureName="File Upload"
        currentPlan={getCurrentPlan().name}
      />
    </div>
  );
};

export default UnifiedInput;
