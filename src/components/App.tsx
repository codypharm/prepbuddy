import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import Hero from './components/Hero';
import UnifiedInput from './components/UnifiedInput';
import StudyPlanGenerator from './components/StudyPlanGenerator';
import StudyPlanDisplay from './components/StudyPlanDisplay';
import Dashboard from './components/Dashboard';
import QuizComponent from './components/QuizComponent';
import ProgressCelebration from './components/ProgressCelebration';
import DailyReminder from './components/DailyReminder';
import AuthModal from './components/AuthModal';
import AuthErrorHandler from './components/AuthErrorHandler';
import PricingPage from './components/billing/PricingPage';
import BillingPage from './components/billing/BillingPage';
import PaymentSuccessPage from './components/billing/PaymentSuccessPage';
import { StoreProvider } from './components/providers/StoreProvider';
import { AuthProvider } from './components/AuthProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuthStore } from './stores/useAuthStore';
import { useStudyPlanStore } from './stores/useStudyPlanStore';
import { useTaskCompletionStore } from './stores/useTaskCompletionStore';
import { useQuizStore } from './stores/useQuizStore';
import { useIncentives } from './hooks/useIncentives';

export interface StudyPlan {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  topics: string[];
  schedule: Array<{
    day: number;
    title: string;
    tasks: string[];
    estimatedTime: string;
    completed?: boolean;
    quiz?: Quiz;
  }>;
  createdAt: Date;
  files: Array<{
    id: string;
    name: string;
    content: string;
    addedAt: Date;
  }>;
  progress: {
    completedTasks: number;
    totalTasks: number;
    completedDays: number;
    totalDays: number;
  };
}

export interface Quiz {
  id: string;
  title: string;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>;
  passingScore: number;
}

export interface QuizResult {
  quizId: string;
  score: number;
  answers: number[];
  completedAt: Date;
  passed: boolean;
}

function AppContent() {
  const { isAuthenticated, isLoading, profile, initialize } = useAuthStore();
  const { studyPlans, createStudyPlan, updateStudyPlan, deleteStudyPlan, addStudyPlanLocally, fetchStudyPlans } = useStudyPlanStore();
  const { markTaskComplete, markTaskIncomplete, isTaskCompleted, fetchCompletions, completions } = useTaskCompletionStore();
  const { saveQuizResult, fetchQuizResults } = useQuizStore();
  
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'study' | 'quiz' | 'pricing' | 'billing' | 'billing-success'>('landing');
  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<{ quiz: Quiz; dayIndex: number; planId: string } | null>(null);
  const [showDailyReminder, setShowDailyReminder] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Initialize incentive system
  const {
    incentiveData,
    showCelebration,
    setShowCelebration,
    triggerCelebration,
    awardXP,
    handleTaskCompletion,
    handlePlanCompletion,
    checkAchievements
  } = useIncentives(studyPlans);

  // Ensure auth state is initialized
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchStudyPlans();
      fetchCompletions();
      fetchQuizResults();
    }
  }, [isAuthenticated, fetchStudyPlans, fetchCompletions, fetchQuizResults]);

  // Handle URL routing
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/pricing') {
      setCurrentView('pricing');
    } else if (path === '/billing') {
      setCurrentView('billing');
    } else if (path === '/billing/success') {
      setCurrentView('billing-success');
    } else if (isAuthenticated && currentView === 'landing') {
      setCurrentView('dashboard');
    }
  }, [isAuthenticated, currentView]);

  // Check for daily reminder
  useEffect(() => {
    const checkDailyReminder = () => {
      const lastReminderDate = localStorage.getItem('last-reminder-date');
      const today = new Date().toDateString();
      
      if (lastReminderDate !== today && !incentiveData.hasStudiedToday) {
        const hour = new Date().getHours();
        if (hour >= 18 && hour < 23) {
          setShowDailyReminder(true);
        }
      }
    };

    const timer = setTimeout(checkDailyReminder, 2000);
    return () => clearTimeout(timer);
  }, [incentiveData.hasStudiedToday]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setCurrentView('dashboard');
    } else {
      setShowAuthModal(true);
    }
  };

  const handleNavigate = (view: 'dashboard' | 'create' | 'generate' | 'study' | 'quiz' | 'pricing' | 'billing') => {
    if (!isAuthenticated && view !== 'landing' && view !== 'pricing') {
      setShowAuthModal(true);
      return;
    }
    
    setCurrentView(view);
    
    // Update URL without page reload
    const urls = {
      dashboard: '/',
      pricing: '/pricing',
      billing: '/billing',
    };
    
    if (urls[view as keyof typeof urls]) {
      window.history.pushState({}, '', urls[view as keyof typeof urls]);
    }
  };

  const handlePlanGenerated = async (plan: StudyPlan) => {
    const newPlan = {
      ...plan,
      progress: {
        completedTasks: 0,
        totalTasks: plan.schedule.reduce((total, day) => total + day.tasks.length, 0),
        completedDays: 0,
        totalDays: plan.schedule.length
      }
    };
    
    try {
      if (isAuthenticated) {
        await createStudyPlan(newPlan);
      } else {
        addStudyPlanLocally(newPlan);
      }
      
      setCurrentPlan(newPlan);
      setCurrentView('study');
      
      // Award XP for creating a plan
      awardXP(25, 'Plan created');
      triggerCelebration('plan', 'Plan Created!', 'Your AI-powered study plan is ready! Time to start learning!');
    } catch (error) {
      console.error('Failed to save study plan:', error);
      // Still show the plan even if save failed
      setCurrentPlan(newPlan);
      setCurrentView('study');
    }
  };

  const handleViewPlan = (plan: StudyPlan) => {
    setCurrentPlan(plan);
    setCurrentView('study');
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await deleteStudyPlan(planId);
      
      if (currentPlan?.id === planId) {
        setCurrentPlan(null);
        setCurrentView('dashboard');
      }
    } catch (error) {
      console.error('Failed to delete study plan:', error);
    }
  };

  const handleAddFileToPlan = async (planId: string, file: File, content: string) => {
    const newFile = {
      id: Date.now().toString(),
      name: file.name,
      content,
      addedAt: new Date()
    };

    const plan = studyPlans.find(p => p.id === planId);
    if (!plan) return;

    const updatedPlan = {
      ...plan,
      files: [...plan.files, newFile]
    };

    try {
      await updateStudyPlan(planId, { files: updatedPlan.files });
      
      if (currentPlan?.id === planId) {
        setCurrentPlan(updatedPlan);
      }
    } catch (error) {
      console.error('Failed to add file to plan:', error);
    }
  };

  const handleTaskComplete = async (planId: string, dayIndex: number, taskIndex: number, completed: boolean) => {
    try {
      if (completed) {
        await markTaskComplete(planId, dayIndex, taskIndex);
        handleTaskCompletion(planId, dayIndex, taskIndex);
      } else {
        await markTaskIncomplete(planId, dayIndex, taskIndex);
      }

      // Update local plan progress
      const plan = studyPlans.find(p => p.id === planId);
      if (plan) {
        // Count completed tasks using the completions from Supabase
        const completedTasks = completions.filter(c => c.studyPlanId === planId).length;

        const updatedProgress = {
          ...plan.progress,
          completedTasks,
        };

        await updateStudyPlan(planId, { progress: updatedProgress });

        if (currentPlan?.id === planId) {
          setCurrentPlan({ ...plan, progress: updatedProgress });
        }
      }
    } catch (error) {
      console.error('Failed to update task completion:', error);
    }
  };

  const handleStartQuiz = (quiz: Quiz, dayIndex: number, planId: string) => {
    setCurrentQuiz({ quiz, dayIndex, planId });
    setCurrentView('quiz');
  };

  const handleQuizComplete = async (result: QuizResult) => {
    try {
      if (currentQuiz) {
        await saveQuizResult(result, currentQuiz.planId);
      }

      // Award XP for quiz completion
      const xpAmount = result.passed ? 50 : 25;
      awardXP(xpAmount, result.passed ? 'Quiz passed' : 'Quiz attempted');
      
      if (result.passed) {
        triggerCelebration('achievement', 'Quiz Passed!', `Great job! You scored ${result.score}%!`);
      }

      // Return to study view
      setCurrentQuiz(null);
      setCurrentView('study');
    } catch (error) {
      console.error('Failed to save quiz result:', error);
      // Still continue with the flow
      setCurrentQuiz(null);
      setCurrentView('study');
    }
  };

  const handleStartOver = () => {
    setCurrentView('dashboard');
    setCurrentPlan(null);
  };

  const handleDismissReminder = () => {
    setShowDailyReminder(false);
    localStorage.setItem('last-reminder-date', new Date().toDateString());
  };

  const handleSelectPlan = (planId: string) => {
    // If user is not authenticated, show auth modal first
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    
    // For now, just redirect to billing page
    // In a real implementation, this would handle the plan selection
    setCurrentView('billing');
  };

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading PrepBuddy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      {/* Show header only when authenticated or on protected views */}
      {(isAuthenticated || currentView !== 'landing') && (
        <Header 
          onNavigate={handleNavigate} 
          currentView={currentView}
        />
      )}
      
      {/* Landing page - only show when not authenticated */}
      {!isAuthenticated && currentView === 'landing' && (
        <LandingPage onGetStarted={handleGetStarted} />
      )}

      {/* Pricing page - accessible to everyone */}
      {currentView === 'pricing' && (
        <PricingPage onSelectPlan={handleSelectPlan} />
      )}

      {/* Billing pages - require authentication */}
      {isAuthenticated && currentView === 'billing' && (
        <BillingPage />
      )}

      {isAuthenticated && currentView === 'billing-success' && (
        <PaymentSuccessPage />
      )}

      {/* Protected routes - only show when authenticated */}
      {isAuthenticated && (
        <>
          {currentView === 'dashboard' && (
            <Dashboard
              studyPlans={studyPlans}
              onCreateNew={() => {}}
              onViewPlan={handleViewPlan}
              onDeletePlan={handleDeletePlan}
              onPlanGenerated={handlePlanGenerated}
              incentiveData={incentiveData}
            />
          )}

          {currentView === 'study' && currentPlan && (
            <StudyPlanDisplay
              studyPlan={currentPlan}
              onStartOver={handleStartOver}
              onAddFile={handleAddFileToPlan}
              onTaskComplete={handleTaskComplete}
              onStartQuiz={handleStartQuiz}
              incentiveData={incentiveData}
            />
          )}

          {currentView === 'quiz' && currentQuiz && (
            <QuizComponent
              quiz={currentQuiz.quiz}
              onComplete={handleQuizComplete}
              onBack={() => {
                setCurrentQuiz(null);
                setCurrentView('study');
              }}
            />
          )}
        </>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signin"
      />

      {/* Progress Celebration Modal */}
      {showCelebration?.show && (
        <ProgressCelebration
          type={showCelebration.type}
          title={showCelebration.title}
          message={showCelebration.message}
          onClose={() => setShowCelebration(null)}
        />
      )}

      {/* Daily Reminder */}
      {showDailyReminder && (
        <DailyReminder
          hasStudiedToday={incentiveData.hasStudiedToday}
          currentStreak={incentiveData.currentStreak}
          onDismiss={handleDismissReminder}
        />
      )}

      {/* Auth Error Handler */}
      <AuthErrorHandler />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StoreProvider>
          <AppContent />
        </StoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;