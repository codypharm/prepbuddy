import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Calendar,
  Clock,
  Target,
  BookOpen,
  CheckCircle,
  Share,
  Plus,
  Upload,
  FileText,
  X,
  Play,
  Award,
  Brain,
  Download,
} from "lucide-react";
import { StudyPlan, Quiz } from "../App";
import { FileProcessor } from "../services/fileProcessor";
import { AIService } from "../services/aiService";
import AICoaching from "./AICoaching";
import { useSubscriptionStore } from "../stores/useSubscriptionStore";
import { useUsageStore } from "../stores/useUsageStore";
import { useTaskCompletionStore } from "../stores/useTaskCompletionStore";
import { useQuizStore } from "../stores/useQuizStore";
import FileIntentModal from "./modals/FileIntentModal";

interface StudyPlanDisplayProps {
  studyPlans: StudyPlan[];
  onStartOver: () => void;
  onAddFile: (
    planId: string,
    filesData: { file: File; content: string }[],
    updates?: {
      schedule?: Array<{
        day: number;
        title: string;
        tasks: string[];
        estimatedTime: string;
        completed?: boolean;
      }>;
      progress?: {
        completedTasks: number;
        totalTasks: number;
        completedDays: number;
        totalDays: number;
      };
    }
  ) => Promise<void>;
  onTaskComplete?: (planId: string, dayIndex: number, taskIndex: number, completed: boolean) => Promise<void>;
  onStartQuiz?: (quiz: any, dayIndex: number, planId: string) => void;
  incentiveData: {
    currentStreak: number;
    longestStreak: number;
    hasStudiedToday: boolean;
    totalXP: number;
    level: number;
    achievements: string[];
    lastStudyDate: Date | null;
  };
}

const StudyPlanDisplay: React.FC<StudyPlanDisplayProps> = ({
  studyPlans,
  onAddFile,
  onTaskComplete,
  onStartQuiz = () => {},
  incentiveData,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Find the study plan by ID from URL params
  const studyPlan = studyPlans.find((plan) => plan.id === id);

  // If plan not found, redirect to dashboard
  useEffect(() => {
    if (!studyPlan) {
      navigate("/dashboard/plans");
    }
  }, [studyPlan, navigate]);

  // Check sessionStorage for last selected day (used when returning from quiz)
  const getInitialDay = () => {
    if (studyPlan) {
      const storedDay = sessionStorage.getItem(`lastSelectedDay-${studyPlan.id}`);
      if (storedDay) {
        // Remove the stored day so it's only used once
        sessionStorage.removeItem(`lastSelectedDay-${studyPlan.id}`);
        return Number(storedDay);
      }
    }
    return 1; // Default to day 1 if no stored day found
  };
  
  // Check if we just completed a quiz for the given day
  const checkJustCompletedQuiz = (planId: string, dayNumber: number) => {
    const key = `justCompletedQuiz-${planId}-${dayNumber}`;
    const value = sessionStorage.getItem(key);
    
    // Don't remove the flag so it persists through re-renders
    // This ensures the quiz button shows "Retake Quiz" consistently
    // after completing a quiz and manually returning to the study plan
    return value === "true";
  };
  
  const [selectedDay, setSelectedDay] = useState(getInitialDay);
  const [dayChangeWarning, setDayChangeWarning] = useState<string | null>(null);
  const [showAddFile, setShowAddFile] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState<number | null>(null);
  const [showAICoach, setShowAICoach] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showFileIntentModal, setShowFileIntentModal] = useState(false);
  const [pendingUploadedFiles, setPendingUploadedFiles] = useState<{file: File; content: string}[]>([]);
  const [processingAI, setProcessingAI] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(
    null
  );

  // Get subscription and usage data
  const { getCurrentPlan } = useSubscriptionStore();
  const { getUsage, incrementUsage } = useUsageStore();
  const { isTaskCompleted, markTaskComplete, markTaskIncomplete } =
    useTaskCompletionStore();
  const { quizResults } = useQuizStore();

  // Don't render if plan not found
  if (!studyPlan) {
    return null;
  }
  
  // Debug log files
  console.log("StudyPlanDisplay - studyPlan files:", studyPlan.files);

  const toggleTask = async (taskId: string) => {
    const [dayIndex, taskIndex] = taskId.split("-").map(Number);
    const isCurrentlyCompleted = isTaskCompleted(
      studyPlan.id,
      dayIndex,
      taskIndex
    );

    if (!isCurrentlyCompleted) {
      await markTaskComplete(studyPlan.id, dayIndex, taskIndex);
      // Call the parent component's onTaskComplete handler if provided
      if (onTaskComplete) {
        await onTaskComplete(studyPlan.id, dayIndex, taskIndex, true);
      }
    } else {
      await markTaskIncomplete(studyPlan.id, dayIndex, taskIndex);
      // Call the parent component's onTaskComplete handler with completed=false if provided
      if (onTaskComplete) {
        await onTaskComplete(studyPlan.id, dayIndex, taskIndex, false);
      }
    }
  };

  const processSingleFileUpload = async (file: File) => {
    try {
      // Check subscription limits for file uploads
      const currentPlan = getCurrentPlan();
      const usage = await getUsage();

      if (currentPlan.limits.fileUploads !== "unlimited") {
        if (usage.fileUploads >= currentPlan.limits.fileUploads) {
          throw new Error(
            `You've reached your limit of ${currentPlan.limits.fileUploads} file uploads per month. ` +
              `Please upgrade your plan to upload more files.`,
          );
        }
      }

      // Check storage limits
      const storageLimit = currentPlan.limits.storage;
      const currentStorage = usage.storageUsed;
      const fileSizeBytes = file.size;

      // Convert storage limit to bytes
      let storageLimitBytes: number;
      if (storageLimit === "unlimited") {
        storageLimitBytes = Number.MAX_SAFE_INTEGER;
      } else {
        const match = storageLimit.match(/(\d+)(MB|GB)/);
        if (!match) throw new Error("Invalid storage limit format");

        const amount = parseInt(match[1]);
        const unit = match[2];

        if (unit === "MB") {
          storageLimitBytes = amount * 1024 * 1024;
        } else if (unit === "GB") {
          storageLimitBytes = amount * 1024 * 1024 * 1024;
        } else {
          throw new Error("Invalid storage unit");
        }
      }

      if (currentStorage + fileSizeBytes > storageLimitBytes) {
        throw new Error(
          `You've reached your storage limit of ${storageLimit}. ` +
            `Please upgrade your plan or delete some files to free up space.`,
        );
      }

      if (!FileProcessor.validateFileSize(file)) {
        throw new Error("File size exceeds 25MB limit");
      }

      const content = await FileProcessor.extractTextFromFile(file);

      // Track file upload usage
      await incrementUsage("fileUploads");
      await incrementUsage("storageUsed", file.size);

      return { file, content };
    } catch (error) {
      throw error;
    }
  };

  const handleFilesUpload = async (files: File[]) => {
    setIsUploadingFile(true);
    setUploadError(null);

    try {
      const uploadedData: { file: File; content: string }[] = [];
      for (const file of files) {
        const result = await processSingleFileUpload(file);
        uploadedData.push(result);
      }
      
      // Store the uploaded files and show the intent modal
      setPendingUploadedFiles(uploadedData);
      setShowFileIntentModal(true);
      setShowAddFile(false);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Failed to process file"
      );
    } finally {
      setIsUploadingFile(false);
    }
  };

  const generateQuizForDay = async (dayIndex: number) => {
    setGeneratingQuiz(dayIndex);

    try {
      // Check AI request limits before generating quiz
      const currentPlan = getCurrentPlan();
      const usage = await getUsage();

      if (currentPlan.limits.aiRequests !== "unlimited") {
        if (usage.aiRequests >= currentPlan.limits.aiRequests) {
          throw new Error(
            `You've reached your limit of ${currentPlan.limits.aiRequests} AI requests per month. ` +
              `Please upgrade your plan to generate more quizzes.`
          );
        }
      }

      const day = studyPlan.schedule[dayIndex];
      const dayContent = studyPlan.files.map((f) => f.content).join("\n\n");

      // Generate quiz using AI service
      const quiz = await AIService.generateQuiz({
        content: dayContent,
        topic: day.title,
        difficulty: studyPlan.difficulty,
        questionCount: 5,
      });

      // Trigger quiz start
      onStartQuiz(quiz, dayIndex, studyPlan.id);
    } catch (error) {
      console.error("Failed to generate quiz:", error);

      if (error instanceof Error && error.message.includes("limit")) {
        setSubscriptionError(error.message);
      } else {
        // Create a fallback quiz
        const fallbackQuiz: Quiz = {
          id: `quiz-${studyPlan.id}-${dayIndex}`,
          title: `${studyPlan.schedule[dayIndex].title} Quiz`,
          questions: [
            {
              id: "1",
              question: `What is the main focus of today's study session: "${studyPlan.schedule[dayIndex].title}"?`,
              options: [
                "Understanding core concepts",
                "Memorizing facts only",
                "Skipping difficult parts",
                "Rushing through material",
              ],
              correctAnswer: 0,
              explanation:
                "The main focus should be understanding core concepts to build a solid foundation.",
            },
            {
              id: "2",
              question:
                "Which study technique is most effective for long-term retention?",
              options: [
                "Passive reading",
                "Active recall and spaced repetition",
                "Highlighting everything",
                "Cramming before tests",
              ],
              correctAnswer: 1,
              explanation:
                "Active recall and spaced repetition are proven to be the most effective for long-term retention.",
            },
          ],
          passingScore: 70,
        };

        onStartQuiz(fallbackQuiz, dayIndex, studyPlan.id);
      }
    } finally {
      setGeneratingQuiz(null);
    }
  };

  const shareProgress = async () => {
    // Use the same completion rate calculation that includes quiz completions
    const progressPercentage = Math.round(completionRate);

    const shareText = `🎓 Making great progress on my "${studyPlan.title}" study plan! ${progressPercentage}% complete with a ${incentiveData.currentStreak}-day study streak. Learning with PrepBuddy AI! 🚀`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Study Progress",
          text: shareText,
          url: window.location.href,
        });
      } catch (error) {
        // Handle share cancellation or permission denied gracefully
        if (error instanceof Error && error.name !== "AbortError") {
          // If it's not a user cancellation, fall back to clipboard
          try {
            await navigator.clipboard.writeText(shareText);
            alert("Progress copied to clipboard!");
          } catch (clipboardError) {
            // Final fallback if clipboard also fails
            console.error(
              "Share and clipboard both failed:",
              error,
              clipboardError
            );
            alert("Unable to share progress. Please try again.");
          }
        }
        // If it's AbortError (user cancelled), do nothing
      }
    } else {
      // Fallback for browsers without native share support
      try {
        await navigator.clipboard.writeText(shareText);
        alert("Progress copied to clipboard!");
      } catch (clipboardError) {
        console.error("Clipboard access failed:", clipboardError);
        alert("Unable to copy to clipboard. Please try again.");
      }
    }
  };

  const handleTaskHelp = async (task: string) => {
    try {
      // Check AI request limits before showing AI coach
      const currentPlan = getCurrentPlan();
      const usage = await getUsage();

      if (currentPlan.limits.aiRequests !== "unlimited") {
        if (usage.aiRequests >= currentPlan.limits.aiRequests) {
          throw new Error(
            `You've reached your limit of ${currentPlan.limits.aiRequests} AI requests per month. ` +
              `Please upgrade your plan to use the AI coach.`
          );
        }
      }

      setSelectedTask(task);
      setShowAICoach(true);
    } catch (error) {
      console.error("Failed to show AI coach:", error);
      if (error instanceof Error) {
        setSubscriptionError(error.message);
      }
    }
  };

  const selectedDayData = studyPlan.schedule.find(
    (day) => day.day === selectedDay
  );
  // Calculate completion rate including quiz completions
  const calculateCompletionRate = () => {
    // Get completed tasks count
    const completedTasksCount = studyPlan.progress.completedTasks;
    const totalTasksCount = studyPlan.progress.totalTasks;

    // Count completed quizzes (those with a passing score)
    const totalQuizzes = studyPlan.schedule.filter((day) => day.quiz).length;
    const completedQuizzes = studyPlan.schedule
      .filter((day) => day.quiz)
      .filter((day) => isDayQuizPassed(day.day)).length;

    // Calculate total items (tasks + quizzes)
    const totalItems = totalTasksCount + totalQuizzes;

    // Calculate completed items (completed tasks + completed quizzes)
    const completedItems = completedTasksCount + completedQuizzes;

    // Calculate percentage
    return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  };

  const completionRate = calculateCompletionRate();

  // Check if day is completed
  const isDayCompleted = selectedDayData
    ? selectedDayData.tasks.every((_, index) =>
        isTaskCompleted(studyPlan.id, selectedDay - 1, index)
      )
    : false;

  const dayQuizResult = selectedDayData?.quiz
    ? quizResults.find((r) => r.quizId === selectedDayData.quiz!.id)
    : null;

  // Check if a day's quiz is passed
  const isDayQuizPassed = (dayNumber: number) => {
    const dayData = studyPlan.schedule.find((day) => day.day === dayNumber);
    if (!dayData || !dayData.quiz) return true; // If no quiz, consider it passed

    const result = dayData.quiz
      ? quizResults.find((r) => r.quizId === dayData.quiz!.id)
      : null;
    return result && result.score >= 70; // 70% is passing score
  };

  // Check if all tasks for a specific day are completed
  const areAllDayTasksCompleted = (dayIndex: number) => {
    const dayData = studyPlan.schedule.find(day => day.day === dayIndex);
    if (!dayData) return false;
    
    return dayData.tasks.every((_, taskIndex) => 
      isTaskCompleted(studyPlan.id, dayIndex - 1, taskIndex)
    );
  };
  
  // Handle file download
  const handleFileDownload = (file: { name: string; content: string }) => {
    const blob = new Blob([file.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Handle the user's intent selection for uploaded files
  const handleFileIntentSelection = async (intent: "reference" | "extend" | "enhance") => {
    if (pendingUploadedFiles.length === 0) {
      setShowFileIntentModal(false);
      return;
    }
    
    try {
      if (intent === "reference") {
        // Simply add the files as reference materials (original behavior)
        await onAddFile(studyPlan.id, pendingUploadedFiles);
      } else {
        setProcessingAI(true);
        
        // First add the files to make them available
        await onAddFile(studyPlan.id, pendingUploadedFiles);
        
        // We'll use just the content of the files for analysis
        // (instead of trying to concat incompatible file types)
        
        if (intent === "extend") {
          // Extend the study plan with new days
          const currentDaysCount = studyPlan.schedule.length;
          const existingTopics = studyPlan.schedule.map(day => day.title);
          
          // Generate new study days based on the new content
          const extendedPlan = await AIService.extendStudyPlan({
            existingPlan: studyPlan,
            newContent: pendingUploadedFiles.map(f => f.content).join("\n\n"),
            existingTopics,
            currentDaysCount
          });
          
          // Update the study plan with extended schedule
          if (extendedPlan && extendedPlan.newDays && extendedPlan.newDays.length > 0) {
            const updatedSchedule = [...studyPlan.schedule, ...extendedPlan.newDays];
            const updatedProgress = {
              ...studyPlan.progress,
              totalDays: updatedSchedule.length,
              totalTasks: updatedSchedule.reduce((sum: number, day: { tasks: string[] }) => sum + day.tasks.length, 0)
            };
            
            // Update the plan with new days and progress
            await onAddFile(studyPlan.id, [], {
              schedule: updatedSchedule,
              progress: updatedProgress
            });
          }
          
        } else if (intent === "enhance") {
          // Enhance existing days with new tasks or modify existing content
          const enhancedPlan = await AIService.enhanceStudyPlan({
            existingPlan: studyPlan,
            newContent: pendingUploadedFiles.map(f => f.content).join("\n\n")
          });
          
          if (enhancedPlan && enhancedPlan.updatedSchedule) {
            const updatedProgress = {
              ...studyPlan.progress,
              totalTasks: enhancedPlan.updatedSchedule.reduce((sum: number, day: { tasks: string[] }) => sum + day.tasks.length, 0)
            };
            
            // Update the plan with enhanced days and progress
            await onAddFile(studyPlan.id, [], {
              schedule: enhancedPlan.updatedSchedule,
              progress: updatedProgress
            });
          }
        }
      }
    } catch (error) {
      console.error("Error processing file intent:", error);
      setUploadError(
        error instanceof Error 
          ? `Error using files to ${intent} plan: ${error.message}` 
          : `Failed to ${intent} plan with uploaded files`
      );
    } finally {
      setProcessingAI(false);
      setShowFileIntentModal(false);
      setPendingUploadedFiles([]);
    }
  };
  
  // Handle day selection with restrictions
  const handleDaySelection = (dayNumber: number) => {
    // Always allow selection of current day or previous days
    if (dayNumber <= selectedDay) {
      setSelectedDay(dayNumber);
      setDayChangeWarning(null);
      return;
    }
    
    // Check if trying to jump ahead more than one day
    if (dayNumber > selectedDay + 1) {
      setDayChangeWarning(
        "You can only move to the next day. Please complete your current day tasks first."
      );
      return;
    }
    
    // Check if current day tasks are completed when trying to move to the next day
    if (dayNumber === selectedDay + 1 && !areAllDayTasksCompleted(selectedDay)) {
      setDayChangeWarning(
        "Please complete all tasks for the current day before moving to the next day."
      );
      return;
    }

    // Check if previous day's quiz is passed when moving forward
    if (dayNumber === selectedDay + 1 && !isDayQuizPassed(selectedDay)) {
      setDayChangeWarning(
        "Warning: You haven't passed the quiz for the current day. It's recommended to complete it before moving on."
      );
      // Still allow them to proceed, but with warning
    } else {
      setDayChangeWarning(null);
    }

    setSelectedDay(dayNumber);
  };

  return (
    <div className="min-h-screen py-4 sm:py-8 px-4">
      {/* File Intent Modal */}
      <FileIntentModal
        isOpen={showFileIntentModal}
        onClose={() => setShowFileIntentModal(false)}
        onSelectIntent={handleFileIntentSelection}
        fileCount={pendingUploadedFiles.length}
      />
      
      {/* AI Processing Overlay */}
      {processingAI && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Processing your content</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Our AI is analyzing your files to update your study plan. This may take a minute...  
            </p>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        {/* Header - Mobile Optimized */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-8 mb-6 sm:mb-8">
          {/* Title and Description */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {studyPlan.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
              {studyPlan.description}
            </p>
          </div>

          {/* Action Buttons - Mobile Stack */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
            <button
              onClick={() => navigate("/dashboard/plans")}
              className="flex items-center justify-center px-4 py-2 text-purple-600 rounded-lg transition-colors duration-200 border border-purple-700"
            >
              <FileText className="h-5 w-5 mr-2" />
              Back to Study Plans
            </button>
            <button
              onClick={() => setShowAddFile(true)}
              className="flex items-center justify-center px-4 py-2 text-blue-600  rounded-lg transition-colors duration-200 border border-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add File
            </button>
            <button
              onClick={shareProgress}
              className="flex items-center justify-center px-4 py-2 text-green-600 rounded-lg transition-colors duration-200 border border-green-700"
            >
              <Share className="h-5 w-5 mr-2" />
              Share Progress
            </button>
          </div>

          {/* Stats - Mobile Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-xl">
              <div className="flex items-center mb-2">
                <Calendar className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600 mr-1 sm:mr-2" />
                <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                  Duration
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">
                {studyPlan.duration}
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-xl">
              <div className="flex items-center mb-2">
                <Target className="h-4 sm:h-5 w-4 sm:w-5 text-green-600 mr-1 sm:mr-2" />
                <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                  Progress
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-green-600">
                {Math.round(completionRate)}%
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-xl">
              <div className="flex items-center mb-2">
                <BookOpen className="h-4 sm:h-5 w-4 sm:w-5 text-purple-600 mr-1 sm:mr-2" />
                <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                  Files
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">
                {studyPlan.files.length}
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 sm:p-4 rounded-xl">
              <div className="flex items-center mb-2">
                <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-orange-600 mr-1 sm:mr-2" />
                <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                  Daily Time
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-orange-600">
                {selectedDayData?.estimatedTime || "1-hour"}
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 sm:p-4 rounded-xl col-span-2 sm:col-span-1">
              <div className="flex items-center mb-2">
                <Award className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-600 mr-1 sm:mr-2" />
                <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                  Level
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                {incentiveData.level}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content - Mobile Responsive Layout */}
        <div>
          {dayChangeWarning && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200">
              <p>{dayChangeWarning}</p>
            </div>
          )}
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Schedule Overview - Mobile First */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                  Study Schedule
                </h2>
                <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto dark:bg-gray-800">
                  {studyPlan.schedule.map((day) => {
                    const dayCompleted = day.tasks.every((_, index) =>
                      isTaskCompleted(studyPlan.id, day.day - 1, index)
                    );

                    // Check if day's quiz is passed (if it has a quiz)
                    const hasQuiz = Boolean(day.quiz);
                    const quizPassed = isDayQuizPassed(day.day);
                    const fullyCompleted =
                      dayCompleted && (!hasQuiz || quizPassed);

                    // Determine if this day is selectable
                    const isSelectable = day.day <= selectedDay || 
                      (day.day === selectedDay + 1 && areAllDayTasksCompleted(selectedDay));

                    return (
                      <button
                        key={`${studyPlan.id}-${day.day}`}
                        onClick={() => isSelectable && handleDaySelection(day.day)}
                        disabled={!isSelectable}
                        className={`w-full text-left p-3 sm:p-4 rounded-lg transition-all duration-200 ${
                          selectedDay === day.day
                            ? "bg-blue-50 border-2 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700"
                            : isSelectable
                              ? "bg-gray-50 hover:bg-blue-50 border-2 border-transparent dark:bg-gray-700 dark:hover:bg-blue-900/10 dark:border-transparent" 
                              : "bg-gray-100 border-2 border-transparent text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500 dark:border-transparent"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-1">
                              <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                                Day {day.day}
                              </span>
                              {fullyCompleted && (
                                <CheckCircle className="h-4 w-4 text-green-500 ml-2 flex-shrink-0" />
                              )}
                              {dayCompleted && hasQuiz && !quizPassed && (
                                <AlertCircle className="h-4 w-4 text-yellow-500 ml-2 flex-shrink-0" />
                              )}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate pr-2">
                              {day.title}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {day.estimatedTime}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Files Section - Mobile Optimized */}
              {studyPlan.files.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold dark:text-white text-gray-900 mb-4">
                    Study Files
                  </h3>
                  <div className="space-y-3">
                    {studyPlan.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center p-3 bg-gray-50 rounded-lg dark:bg-gray-700"
                      >
                        <FileText className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate dark:text-white">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Added {new Date(file.addedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleFileDownload(file)}
                          className="ml-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex-shrink-0"
                          title="Download file"
                        >
                          <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Coach Quick Access - Mobile Optimized */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-blue-600" />
                  AI Learning Coach
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Get instant help with any task. Click the brain icon next to
                  any task to start learning!
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-blue-800 dark:text-blue-400 text-xs">
                    💡 <strong>Tip:</strong> The AI coach can explain concepts,
                    provide examples, and guide you through difficult tasks.
                  </p>
                </div>
              </div>
            </div>

            {/* Day Details - Mobile Responsive */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-8">
                {/* Day Header - Mobile Stack */}
                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      Day {selectedDay}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
                      {selectedDayData?.title}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Estimated time: {selectedDayData?.estimatedTime}
                    </div>
                    {/* Show quiz button only if all tasks are completed */}
                    {isDayCompleted && (
                      <>
                        {/* Show quiz result if it exists */}
                        {dayQuizResult && (
                          <div className="flex items-center justify-center px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-lg text-sm">
                            <Award className="h-4 w-4 mr-2" />
                            Quiz: {dayQuizResult.score}%
                          </div>
                        )}
                        
                        {/* Show quiz button only if quiz is not passed */}
                        {(!dayQuizResult || (dayQuizResult && !dayQuizResult.passed)) && (
                          <button
                            onClick={() => generateQuizForDay(selectedDay - 1)}
                            disabled={generatingQuiz === selectedDay - 1}
                            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 text-sm w-full sm:w-auto"
                          >
                            {generatingQuiz === selectedDay - 1 ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Generating...
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                {/* Show "Retake Quiz" if we have a previous result or just completed */}
                                {dayQuizResult || checkJustCompletedQuiz(studyPlan.id, selectedDay) ? "Retake Quiz" : "Take Quiz"}
                              </>
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Tasks Section - Mobile Optimized */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">
                    Today's Tasks
                  </h3>
                  {selectedDayData?.tasks.map((task, index) => {
                    const taskId = `${selectedDay - 1}-${index}`;
                    const isCompleted = isTaskCompleted(
                      studyPlan.id,
                      selectedDay - 1,
                      index
                    );

                    return (
                      <div
                        key={taskId}
                        className={`flex items-start p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${
                          isCompleted
                            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700"
                            : "bg-gray-50 border-gray-200 hover:border-blue-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-blue-700"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 sm:mr-4 transition-all duration-200 cursor-pointer flex-shrink-0 mt-0.5 ${
                            isCompleted
                              ? "bg-green-500 border-green-500"
                              : "border-gray-300 hover:border-blue-400 dark:border-gray-500 dark:hover:border-blue-500"
                          }`}
                          onClick={() => toggleTask(taskId)}
                        >
                          {isCompleted && (
                            <CheckCircle className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div
                          className={`flex-1 cursor-pointer text-sm sm:text-base leading-relaxed ${
                            isCompleted
                              ? "text-green-700 line-through dark:text-green-400"
                              : "text-gray-900 dark:text-gray-200"
                          }`}
                          onClick={() => toggleTask(taskId)}
                        >
                          {task}
                        </div>
                        <button
                          onClick={() => handleTaskHelp(task)}
                          className="ml-3 sm:ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 flex-shrink-0 dark:hover:bg-blue-900/20"
                          title="Get AI help with this task"
                        >
                          <Brain className="h-4 sm:h-5 w-4 sm:w-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Study Tips - Mobile Optimized */}
                <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl dark:from-blue-900/20 dark:to-indigo-900/20">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">
                    Study Tips for Today
                  </h4>
                  <ul className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 space-y-2">
                    <li>
                      • Take breaks every 25-30 minutes using the Pomodoro
                      technique
                    </li>
                    <li>
                      • Create a distraction-free environment for optimal focus
                    </li>
                    <li>
                      • Review previous day's material briefly before starting
                    </li>
                    <li>
                      • Make notes of key concepts and questions for later
                      review
                    </li>
                    <li>
                      • Use the AI coach (🧠 icon) for help with any confusing
                      tasks
                    </li>
                    <li>
                      • Complete the quiz after finishing all tasks to test your
                      understanding
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Topics Overview - Mobile Responsive */}
          <div className="mt-6 sm:mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Learning Topics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {studyPlan.topics.map((topic, index) => (
                <div
                  key={`${topic}-${index}`}
                  className="p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 dark:from-gray-700 dark:to-blue-900/20 dark:border-gray-700"
                >
                  <div className="flex items-center">
                    <div className="bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium px-2 py-1 rounded mr-2 sm:mr-3 flex-shrink-0 dark:bg-blue-900/30 dark:text-blue-400">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base leading-tight">
                      {topic}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Coach Modal */}
        {showAICoach && (
          <AICoaching
            studyPlans={[studyPlan]}
            currentPlan={studyPlan}
            currentDay={selectedDay}
            currentTask={selectedTask || undefined}
            mode="contextual"
            onClose={() => {
              setShowAICoach(false);
              setSelectedTask(null);
            }}
          />
        )}

        {/* Add File Modal - Mobile Responsive */}
        {showAddFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Add Study File
                </h3>
                <button
                  onClick={() => setShowAddFile(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {uploadError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-700">
                  <p className="text-red-700 text-sm dark:text-red-400">
                    {uploadError}
                  </p>
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center dark:border-gray-600">
                {isUploadingFile ? (
                  <div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-sm dark:text-gray-400">
                      Processing file...
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-4 dark:text-gray-500" />
                    <p className="text-gray-600 mb-4 text-sm dark:text-gray-400">
                      <label className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium dark:hover:text-blue-500">
                        Choose file to upload
                        <input
                          type="file"
                          className="hidden"
                          accept={FileProcessor.getAcceptString()}
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) handleFilesUpload(files);
                          }}
                          multiple
                        />
                      </label>
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Supports PDF, DOCX, TXT, MD, RTF, LaTeX, BibTeX (max 25MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Subscription Error Modal */}
        {subscriptionError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Subscription Limit Reached
                </h3>
                <button
                  onClick={() => setSubscriptionError(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {subscriptionError ||
                  "You've reached your subscription limit. Please upgrade your plan to continue."}
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSubscriptionError(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Close
                </button>
                <a
                  href="/pricing"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Upgrade Plan
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyPlanDisplay;
