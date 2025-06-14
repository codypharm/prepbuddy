import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Target, BookOpen, CheckCircle, Download, Share, RefreshCw, Plus, Upload, FileText, X, Play, Award, Users, MessageCircle, Brain } from 'lucide-react';
import { StudyPlan, Quiz } from '../App';
import { FileProcessor } from '../services/fileProcessor';
import { AIService } from '../services/aiService';
import AICoaching from './AICoaching';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { useUsageStore } from '../stores/useUsageStore';

interface StudyPlanDisplayProps {
  studyPlan: StudyPlan;
  onStartOver: () => void;
  onAddFile: (planId: string, file: File, content: string) => void;
  onTaskComplete: (planId: string, dayIndex: number, taskIndex: number, completed: boolean) => void;
  onStartQuiz: (quiz: Quiz, dayIndex: number, planId: string) => void;
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
  studyPlan, 
  onStartOver, 
  onAddFile, 
  onTaskComplete, 
  onStartQuiz,
  incentiveData
}) => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [showAddFile, setShowAddFile] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState<number | null>(null);
  const [showSocialShare, setShowSocialShare] = useState(false);
  const [showAICoach, setShowAICoach] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  // Get subscription and usage data
  const { getCurrentPlan } = useSubscriptionStore();
  const { getUsage, incrementUsage } = useUsageStore();

  // Load completed tasks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`completed-tasks-${studyPlan.id}`);
    if (saved) {
      setCompletedTasks(new Set(JSON.parse(saved)));
    }
  }, [studyPlan.id]);

  const toggleTask = (taskId: string) => {
    const [dayIndex, taskIndex] = taskId.split('-').map(Number);
    const newCompleted = new Set(completedTasks);
    const isCompleted = !newCompleted.has(taskId);
    
    if (isCompleted) {
      newCompleted.add(taskId);
    } else {
      newCompleted.delete(taskId);
    }
    
    setCompletedTasks(newCompleted);
    onTaskComplete(studyPlan.id, dayIndex, taskIndex, isCompleted);
  };

  const handleFileUpload = async (file: File) => {
    setIsUploadingFile(true);
    setUploadError(null);
    
    try {
      // Check subscription limits for file uploads
      const currentPlan = getCurrentPlan();
      const usage = await getUsage();
      
      if (currentPlan.limits.fileUploads !== 'unlimited') {
        if (usage.fileUploads >= currentPlan.limits.fileUploads) {
          throw new Error(
            `You've reached your limit of ${currentPlan.limits.fileUploads} file uploads per month. ` +
            `Please upgrade your plan to upload more files.`
          );
        }
      }
      
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
        throw new Error(
          `You've reached your storage limit of ${storageLimit}. ` +
          `Please upgrade your plan or delete some files to free up space.`
        );
      }

      if (!FileProcessor.validateFileSize(file)) {
        throw new Error('File size exceeds 25MB limit');
      }

      const content = await FileProcessor.extractTextFromFile(file);
      await onAddFile(studyPlan.id, file, content);
      
      // Track file upload usage
      await incrementUsage('fileUploads');
      await incrementUsage('storageUsed', file.size);
      
      setShowAddFile(false);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to process file');
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
      
      if (currentPlan.limits.aiRequests !== 'unlimited') {
        if (usage.aiRequests >= currentPlan.limits.aiRequests) {
          throw new Error(
            `You've reached your limit of ${currentPlan.limits.aiRequests} AI requests per month. ` +
            `Please upgrade your plan to generate more quizzes.`
          );
        }
      }
      
      const day = studyPlan.schedule[dayIndex];
      const dayContent = studyPlan.files.map(f => f.content).join('\n\n');
      
      // Generate quiz using AI service
      const quiz = await AIService.generateQuiz({
        content: dayContent,
        topic: day.title,
        difficulty: studyPlan.difficulty,
        questionCount: 5
      });

      // Add quiz to the day and trigger quiz start
      const updatedDay = { ...day, quiz };
      onStartQuiz(quiz, dayIndex, studyPlan.id);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      
      if (error instanceof Error && error.message.includes('limit')) {
        setSubscriptionError(error.message);
      } else {
        // Create a fallback quiz
        const fallbackQuiz: Quiz = {
          id: `quiz-${studyPlan.id}-${dayIndex}`,
          title: `${studyPlan.schedule[dayIndex].title} Quiz`,
          questions: [
            {
              id: '1',
              question: `What is the main focus of today's study session: "${studyPlan.schedule[dayIndex].title}"?`,
              options: [
                'Understanding core concepts',
                'Memorizing facts only',
                'Skipping difficult parts',
                'Rushing through material'
              ],
              correctAnswer: 0,
              explanation: 'The main focus should be understanding core concepts to build a solid foundation.'
            },
            {
              id: '2',
              question: 'Which study technique is most effective for long-term retention?',
              options: [
                'Passive reading',
                'Active recall and spaced repetition',
                'Highlighting everything',
                'Cramming before tests'
              ],
              correctAnswer: 1,
              explanation: 'Active recall and spaced repetition are proven to be the most effective for long-term retention.'
            }
          ],
          passingScore: 70
        };
        
        onStartQuiz(fallbackQuiz, dayIndex, studyPlan.id);
      }
    } finally {
      setGeneratingQuiz(null);
    }
  };

  const shareProgress = async () => {
    const progressPercentage = studyPlan.progress.totalTasks > 0 
      ? Math.round((studyPlan.progress.completedTasks / studyPlan.progress.totalTasks) * 100)
      : 0;
    
    const shareText = `🎓 Making great progress on my "${studyPlan.title}" study plan! ${progressPercentage}% complete with a ${incentiveData.currentStreak}-day study streak. Learning with PrepBuddy AI! 🚀`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Study Progress',
          text: shareText,
          url: window.location.href
        });
      } catch (error) {
        // Handle share cancellation or permission denied gracefully
        if (error instanceof Error && error.name !== 'AbortError') {
          // If it's not a user cancellation, fall back to clipboard
          try {
            await navigator.clipboard.writeText(shareText);
            alert('Progress copied to clipboard!');
          } catch (clipboardError) {
            // Final fallback if clipboard also fails
            console.error('Share and clipboard both failed:', error, clipboardError);
            alert('Unable to share progress. Please try again.');
          }
        }
        // If it's AbortError (user cancelled), do nothing
      }
    } else {
      // Fallback for browsers without native share support
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Progress copied to clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard access failed:', clipboardError);
        alert('Unable to copy to clipboard. Please try again.');
      }
    }
  };

  const handleTaskHelp = async (task: string) => {
    try {
      // Check AI request limits before showing AI coach
      const currentPlan = getCurrentPlan();
      const usage = await getUsage();
      
      if (currentPlan.limits.aiRequests !== 'unlimited') {
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
      console.error('Failed to show AI coach:', error);
      if (error instanceof Error) {
        setSubscriptionError(error.message);
      }
    }
  };

  const selectedDayData = studyPlan.schedule.find(day => day.day === selectedDay);
  const completionRate = studyPlan.progress.totalTasks > 0 
    ? (studyPlan.progress.completedTasks / studyPlan.progress.totalTasks) * 100 
    : 0;

  // Check if day is completed
  const isDayCompleted = selectedDayData ? 
    selectedDayData.tasks.every((_, index) => completedTasks.has(`${selectedDay - 1}-${index}`)) : false;

  // Get quiz results for current day
  const quizResults = JSON.parse(localStorage.getItem(`quiz-results-${studyPlan.id}`) || '{}');
  const dayQuizResult = selectedDayData?.quiz ? quizResults[selectedDayData.quiz.id] : null;

  return (
    <div className="min-h-screen py-4 sm:py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header - Mobile Optimized */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-8 mb-6 sm:mb-8">
          {/* Title and Description */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{studyPlan.title}</h1>
            <p className="text-gray-600 text-base sm:text-lg">{studyPlan.description}</p>
          </div>

          {/* Action Buttons - Mobile Stack */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
            <button 
              onClick={() => setShowAddFile(true)}
              className="flex items-center justify-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 border border-blue-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add File
            </button>
            <button 
              onClick={shareProgress}
              className="flex items-center justify-center px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200 border border-green-200"
            >
              <Share className="h-5 w-5 mr-2" />
              Share Progress
            </button>
            <button className="flex items-center justify-center px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 border border-gray-200 rounded-lg">
              <Download className="h-5 w-5 mr-2" />
              Export
            </button>
            <button
              onClick={onStartOver}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Dashboard
            </button>
          </div>

          {/* Stats - Mobile Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-xl">
              <div className="flex items-center mb-2">
                <Calendar className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600 mr-1 sm:mr-2" />
                <span className="font-medium text-gray-900 text-sm sm:text-base">Duration</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">{studyPlan.duration}</p>
            </div>
            
            <div className="bg-green-50 p-3 sm:p-4 rounded-xl">
              <div className="flex items-center mb-2">
                <Target className="h-4 sm:h-5 w-4 sm:w-5 text-green-600 mr-1 sm:mr-2" />
                <span className="font-medium text-gray-900 text-sm sm:text-base">Progress</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{Math.round(completionRate)}%</p>
            </div>
            
            <div className="bg-purple-50 p-3 sm:p-4 rounded-xl">
              <div className="flex items-center mb-2">
                <BookOpen className="h-4 sm:h-5 w-4 sm:w-5 text-purple-600 mr-1 sm:mr-2" />
                <span className="font-medium text-gray-900 text-sm sm:text-base">Files</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">{studyPlan.files.length}</p>
            </div>
            
            <div className="bg-orange-50 p-3 sm:p-4 rounded-xl">
              <div className="flex items-center mb-2">
                <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-orange-600 mr-1 sm:mr-2" />
                <span className="font-medium text-gray-900 text-sm sm:text-base">Daily Time</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-orange-600">
                {selectedDayData?.estimatedTime || '1-hour'}
              </p>
            </div>

            <div className="bg-yellow-50 p-3 sm:p-4 rounded-xl col-span-2 sm:col-span-1">
              <div className="flex items-center mb-2">
                <Award className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-600 mr-1 sm:mr-2" />
                <span className="font-medium text-gray-900 text-sm sm:text-base">Level</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-yellow-600">{incentiveData.level}</p>
            </div>
          </div>
        </div>

        {/* Main Content - Mobile Responsive Layout */}
        <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Schedule Overview - Mobile First */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Study Schedule</h2>
              <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto">
                {studyPlan.schedule.map((day) => {
                  const dayCompleted = day.tasks.every((_, index) => 
                    completedTasks.has(`${day.day - 1}-${index}`)
                  );
                  
                  return (
                    <button
                      key={day.day}
                      onClick={() => setSelectedDay(day.day)}
                      className={`w-full text-left p-3 sm:p-4 rounded-lg transition-all duration-200 ${
                        selectedDay === day.day
                          ? 'bg-blue-50 border-2 border-blue-200'
                          : 'bg-gray-50 hover:bg-blue-50 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-1">
                            <span className="font-medium text-gray-900 text-sm sm:text-base">Day {day.day}</span>
                            {dayCompleted && (
                              <CheckCircle className="h-4 w-4 text-green-500 ml-2 flex-shrink-0" />
                            )}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 truncate pr-2">{day.title}</div>
                        </div>
                        <div className="text-xs text-gray-500 flex-shrink-0">{day.estimatedTime}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Files Section - Mobile Optimized */}
            {studyPlan.files.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Study Files</h3>
                <div className="space-y-3">
                  {studyPlan.files.map((file) => (
                    <div key={file.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          Added {file.addedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Coach Quick Access - Mobile Optimized */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Brain className="h-5 w-5 mr-2 text-blue-600" />
                AI Learning Coach
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Get instant help with any task. Click the brain icon next to any task to start learning!
              </p>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-blue-800 text-xs">
                  💡 <strong>Tip:</strong> The AI coach can explain concepts, provide examples, and guide you through difficult tasks.
                </p>
              </div>
            </div>

            {/* Social Features - Mobile Optimized */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Study Together</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <Users className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                  <span className="text-blue-700 font-medium text-sm">Find Study Buddies</span>
                </button>
                <button className="w-full flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <MessageCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-green-700 font-medium text-sm">Join Study Group</span>
                </button>
              </div>
            </div>
          </div>

          {/* Day Details - Mobile Responsive */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-8">
              {/* Day Header - Mobile Stack */}
              <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Day {selectedDay}</h2>
                  <p className="text-gray-600 text-base sm:text-lg">{selectedDayData?.title}</p>
                </div>
                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
                  <div className="text-sm text-gray-500">
                    Estimated time: {selectedDayData?.estimatedTime}
                  </div>
                  {isDayCompleted && !dayQuizResult && (
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
                          Take Quiz
                        </>
                      )}
                    </button>
                  )}
                  {dayQuizResult && (
                    <div className="flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm">
                      <Award className="h-4 w-4 mr-2" />
                      Quiz: {dayQuizResult.score}%
                    </div>
                  )}
                </div>
              </div>

              {/* Tasks Section - Mobile Optimized */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Today's Tasks</h3>
                {selectedDayData?.tasks.map((task, index) => {
                  const taskId = `${selectedDay - 1}-${index}`;
                  const isCompleted = completedTasks.has(taskId);
                  
                  return (
                    <div
                      key={taskId}
                      className={`flex items-start p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${
                        isCompleted
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200 hover:border-blue-200'
                      }`}
                    >
                      <div 
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 sm:mr-4 transition-all duration-200 cursor-pointer flex-shrink-0 mt-0.5 ${
                          isCompleted
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 hover:border-blue-400'
                        }`}
                        onClick={() => toggleTask(taskId)}
                      >
                        {isCompleted && <CheckCircle className="h-4 w-4 text-white" />}
                      </div>
                      <div 
                        className={`flex-1 cursor-pointer text-sm sm:text-base leading-relaxed ${isCompleted ? 'text-green-700 line-through' : 'text-gray-900'}`}
                        onClick={() => toggleTask(taskId)}
                      >
                        {task}
                      </div>
                      <button
                        onClick={() => handleTaskHelp(task)}
                        className="ml-3 sm:ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 flex-shrink-0"
                        title="Get AI help with this task"
                      >
                        <Brain className="h-4 sm:h-5 w-4 sm:w-5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Study Tips - Mobile Optimized */}
              <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Study Tips for Today</h4>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-2">
                  <li>• Take breaks every 25-30 minutes using the Pomodoro technique</li>
                  <li>• Create a distraction-free environment for optimal focus</li>
                  <li>• Review previous day's material briefly before starting</li>
                  <li>• Make notes of key concepts and questions for later review</li>
                  <li>• Use the AI coach (🧠 icon) for help with any confusing tasks</li>
                  <li>• Complete the quiz after finishing all tasks to test your understanding</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Topics Overview - Mobile Responsive */}
        <div className="mt-6 sm:mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Learning Topics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {studyPlan.topics.map((topic, index) => (
              <div
                key={topic}
                className="p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center">
                  <div className="bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium px-2 py-1 rounded mr-2 sm:mr-3 flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900 text-sm sm:text-base leading-tight">{topic}</span>
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
          currentTask={selectedTask}
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
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Add Study File</h3>
              <button
                onClick={() => setShowAddFile(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{uploadError}</p>
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center">
              {isUploadingFile ? (
                <div>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 text-sm">Processing file...</p>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4 text-sm">
                    <label className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                      Choose file to upload
                      <input
                        type="file"
                        className="hidden"
                        accept={FileProcessor.getAcceptString()}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                      />
                    </label>
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
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
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Subscription Limit Reached</h3>
              <button
                onClick={() => setSubscriptionError(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">{subscriptionError}</p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSubscriptionError(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
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
  );
};

export default StudyPlanDisplay;