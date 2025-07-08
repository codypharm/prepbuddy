import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Header from "./components/Header";
import LandingPage from "./components/LandingPage";
import StudyPlanDisplay from "./components/StudyPlanDisplay";
import Dashboard from "./components/Dashboard";
import QuizComponent from "./components/QuizComponent";
import ProgressCelebration from "./components/ProgressCelebration";
import DailyReminder from "./components/DailyReminder";
import AuthModal from "./components/AuthModal";
import AuthErrorHandler from "./components/AuthErrorHandler";
import PricingPage from "./components/billing/PricingPage";
import BillingPage from "./components/billing/BillingPage";
import PaymentSuccessPage from "./components/billing/PaymentSuccessPage";
import DashboardOverview from "./components/dashboard/DashboardOverview";
import DashboardPlans from "./components/dashboard/DashboardPlans";
import DashboardCreate from "./components/dashboard/DashboardCreate";
import DashboardGenerate from "./components/dashboard/DashboardGenerate";
import DashboardAnalytics from "./components/dashboard/DashboardAnalytics";
import DashboardSocial from "./components/dashboard/DashboardSocial";
import { StoreProvider } from "./components/providers/StoreProvider";
import { AuthProvider } from "./components/AuthProvider";
import { useAuthStore } from "./stores/useAuthStore";
import { useStudyPlanStore } from "./stores/useStudyPlanStore";
import { useTaskCompletionStore } from "./stores/useTaskCompletionStore";
import { useQuizStore } from "./stores/useQuizStore";
import { useIncentives } from "./hooks/useIncentives";

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

// Interface for storing quiz state including the day number
interface CurrentQuizInfo {
  quiz: Quiz;
  dayIndex: number;
  planId: string;
  dayNumber: number; // The actual day number (1-based) for returning after quiz
}

function AppContent() {
  const { isAuthenticated, isLoading, profile, initialize } = useAuthStore();
  const {
    studyPlans,
    createStudyPlan,
    updateStudyPlan,
    deleteStudyPlan,
    addStudyPlanLocally,
    fetchStudyPlans,
  } = useStudyPlanStore();
  const {
    markTaskComplete,
    markTaskIncomplete,
    isTaskCompleted,
    fetchCompletions,
    completions,
  } = useTaskCompletionStore();
  const { saveQuizResult, fetchQuizResults } = useQuizStore();

  const navigate = useNavigate();
  const location = useLocation();

  // No longer using currentPlan state as we now use URL parameters
  const [currentQuiz, setCurrentQuiz] = useState<CurrentQuizInfo | null>(null);
  const [showDailyReminder, setShowDailyReminder] = useState(false);
  const [inputData, setInputData] = useState<{
    content: string;
    fileName?: string;
    hasFile: boolean;
  } | null>(null);
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
    checkAchievements,
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

      // Attempt to restore last viewed study plan - only on root/login page
      const currentPath = window.location.pathname;
      const isOnRootOrLoginPage =
        currentPath === "/" || currentPath === "/login";

      if (isOnRootOrLoginPage) {
        const lastStudyPlanId = localStorage.getItem("lastStudyPlanId");
        if (lastStudyPlanId) {
          const foundPlan = studyPlans.find(
            (plan) => plan.id === lastStudyPlanId
          );
          if (foundPlan) {
            // Navigate to the study plan using its ID, but only if we're on the root page
            setTimeout(() => {
              navigate(`/study/${lastStudyPlanId}`);
            }, 0);
          } else {
            // If plan not found (e.g., deleted), clear from local storage
            localStorage.removeItem("lastStudyPlanId");
          }
        }
      }
    }
  }, [
    isAuthenticated,
    fetchStudyPlans,
    fetchCompletions,
    fetchQuizResults,
    studyPlans,
    navigate,
  ]);

  // Redirect to dashboard if authenticated and on landing
  useEffect(() => {
    if (isAuthenticated && location.pathname === "/") {
      navigate("/dashboard");
    }
  }, [isAuthenticated, location.pathname, navigate]);

  // Check for daily reminder
  useEffect(() => {
    const checkDailyReminder = () => {
      const lastReminderDate = localStorage.getItem("last-reminder-date");
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
      navigate("/dashboard");
    } else {
      setShowAuthModal(true);
    }
  };

  const handleNavigate = (path: string) => {
    // For landing and pricing pages, no authentication is needed
    if (path === "/" || path === "/pricing") {
      // Navigate directly without authentication check
    } else if (!isAuthenticated) {
      // For other pages, require authentication
      setShowAuthModal(true);
      return;
    }

    navigate(path);
  };

  const handlePlanGenerated = async (plan: StudyPlan) => {
    const newPlan = {
      ...plan,
      progress: {
        completedTasks: 0,
        totalTasks: plan.schedule.reduce(
          (total, day) => total + day.tasks.length,
          0
        ),
        completedDays: 0,
        totalDays: plan.schedule.length,
      },
    };

    try {
      if (isAuthenticated) {
        await createStudyPlan(newPlan);
      } else {
        addStudyPlanLocally(newPlan);
      }

      // Navigate to the newly created study plan
      navigate(`/study/${newPlan.id}`);

      // Award XP for creating a plan
      awardXP(25, "Plan created");
      triggerCelebration(
        "plan",
        "Plan Created!",
        "Your AI-powered study plan is ready! Time to start learning!"
      );
    } catch (error) {
      console.error("Failed to save study plan:", error);
      // Still show the plan even if save failed
      // Navigate to the newly created study plan
      navigate(`/study/${newPlan.id}`);
    }
  };

  const handleViewPlan = (plan: StudyPlan) => {
    console.log("handleViewPlan called with plan:", plan);
    localStorage.setItem("lastStudyPlanId", plan.id); // Persist plan ID
    navigate(`/study/${plan.id}`);
    console.log("Navigating to study plan:", plan.id);
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await deleteStudyPlan(planId);

      // Navigation will happen automatically through route changes if needed
    } catch (error) {
      console.error("Failed to delete study plan:", error);
    }
  };

  const handleAddFileToPlan = async (
    planId: string,
    filesData: { file: File; content: string }[]
  ) => {
    const plan = studyPlans.find((p) => p.id === planId);
    if (!plan) return;

    const newFiles = filesData.map((data) => {
      const newId = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 15)}`;
      console.log("Generated file ID:", newId);
      return {
        id: newId,
        name: data.file.name,
        content: data.content,
        addedAt: new Date(),
      };
    });

    const updatedPlan = {
      ...plan,
      files: [...plan.files, ...newFiles],
    };

    try {
      await updateStudyPlan(planId, { files: updatedPlan.files });

      // No need to update currentPlan as we're using URL parameters now
    } catch (error) {
      console.error("Failed to add file(s) to plan:", error);
    }
  };

  const handleTaskComplete = async (
    planId: string,
    dayIndex: number,
    taskIndex: number,
    completed: boolean
  ) => {
    try {
      if (completed) {
        await markTaskComplete(planId, dayIndex, taskIndex);
        handleTaskCompletion(planId, dayIndex, taskIndex);
      } else {
        await markTaskIncomplete(planId, dayIndex, taskIndex);
      }

      // Update local plan progress
      const plan = studyPlans.find((p) => p.id === planId);
      if (plan) {
        // Recalculate completed tasks and days from the ground up
        const completedTasksCount = completions.filter(
          (c) => c.studyPlanId === planId
        ).length;

        const completedDaysCount = plan.schedule.reduce((count, day, index) => {
          const dayTasks = day.tasks.length;
          const completedDayTasks = completions.filter(
            (c) => c.studyPlanId === planId && c.dayIndex === index
          ).length;

          if (dayTasks > 0 && completedDayTasks === dayTasks) {
            return count + 1;
          }
          return count;
        }, 0);

        const updatedProgress = {
          ...plan.progress,
          completedTasks: completedTasksCount,
          completedDays: completedDaysCount,
        };

        await updateStudyPlan(planId, { progress: updatedProgress });
      }
    } catch (error) {
      console.error("Failed to update task completion:", error);
    }
  };

  const handleStartQuiz = (quiz: Quiz, dayIndex: number, planId: string) => {
    // Store day number (1-based) along with other quiz info
    // dayIndex is 0-based but we're storing the day number which is 1-based for user display
    const dayNumber = dayIndex + 1;
    setCurrentQuiz({ quiz, dayIndex, planId, dayNumber });
    navigate(`/quiz/${planId}`);
  };

  const handleQuizComplete = async (result: QuizResult) => {
    try {
      if (currentQuiz) {
        await saveQuizResult(result, currentQuiz.planId);

        // Award XP for quiz completion
        const xpAmount = result.passed ? 50 : 25;
        awardXP(xpAmount, result.passed ? "Quiz passed" : "Quiz attempted");

        // Check if this quiz has been passed before
        await fetchQuizResults(currentQuiz.planId);
        
        // Get the quiz results from the store after fetching
        const quizResults = useQuizStore.getState().quizResults;
        
        // Get previous attempts for this specific quiz (excluding the current result)
        // We need to carefully check the quiz ID and ensure we're getting attempts from the same quiz
        const currentQuizId = currentQuiz.quiz.id;
        console.log(`Checking previous attempts for quiz ID: ${currentQuizId}`);
        
        const previousAttempts = quizResults.filter(
          (q: QuizResult) => q.quizId === currentQuizId && q.completedAt < result.completedAt
        );
        
        console.log(`Found ${previousAttempts.length} previous attempts`);
        
        // Check if any previous attempt was a pass
        const hasPreviouslyPassed = previousAttempts.some((attempt: QuizResult) => {
          console.log(`Previous attempt: score=${attempt.score}, passed=${attempt.passed}`);
          return attempt.passed;
        });
        
        console.log(`Has previously passed: ${hasPreviouslyPassed}`);
        
        // Only show celebration if it's first time passing OR previously failed and now passing
        if (result.passed) {
          console.log(`Current attempt passed with score: ${result.score}`);
          if (!hasPreviouslyPassed) {
            console.log('Showing celebration popup!');
            triggerCelebration(
              "achievement",
              "Quiz Passed!",
              `Great job! You scored ${result.score}%!`
            );
          } else {
            console.log('Not showing celebration - already passed before');
          }
        }

        // Ensure we have the latest quiz results before navigating
        await fetchQuizResults(currentQuiz.planId);

        // Store the info needed for manual navigation
        const planId = currentQuiz.planId;
        const dayNumber = currentQuiz.dayNumber;

        // Store the day number in session storage so StudyPlanDisplay can retrieve it
        // Use a timestamp to make sure it persists even through rapid navigation
        const timestamp = new Date().getTime();
        sessionStorage.setItem(`lastSelectedDay-${planId}`, String(dayNumber));
        console.log(`Set lastSelectedDay for ${planId} to ${dayNumber} at ${timestamp}`);
        
        // Also force-set a persistent flag that we're returning from a quiz
        sessionStorage.setItem('returnFromQuiz', 'true');

        // Mark that this quiz was just completed - used to ensure UI updates correctly
        sessionStorage.setItem(
          `justCompletedQuiz-${planId}-${dayNumber}`,
          "true"
        );
        sessionStorage.setItem(`quizJustCompleted`, "true");

        // Do not call navigate() here - will add return button in Quiz component
      }
    } catch (error) {
      console.error("Failed to save quiz result:", error);
      if (currentQuiz) {
        // Try to fetch quiz results even in error case
        try {
          await fetchQuizResults(currentQuiz.planId);
        } catch (fetchError) {
          console.error(
            "Failed to fetch quiz results after error:",
            fetchError
          );
        }

        const planId = currentQuiz.planId;
        const dayNumber = currentQuiz.dayNumber;

        // Store the day number even in error case
        sessionStorage.setItem(`lastSelectedDay-${planId}`, String(dayNumber));
        sessionStorage.setItem(
          `justCompletedQuiz-${planId}-${dayNumber}`,
          "true"
        );
        sessionStorage.setItem(`quizJustCompleted`, "true");
      } else {
        // Fallback if we somehow don't have a current quiz
        setCurrentQuiz(null);
        navigate("/dashboard");
      }
    }
  };

  const handleStartOver = () => {
    // No longer need to reset currentPlan state
    navigate("/dashboard");
  };

  const handleDismissReminder = () => {
    setShowDailyReminder(false);
    localStorage.setItem("last-reminder-date", new Date().toDateString());
  };

  const handleFormSubmit = (data: {
    content: string;
    fileName?: string;
    hasFile: boolean;
  }) => {
    setInputData(data);
    navigate("/dashboard/generate");
  };

  const handleSelectPlan = (planId: string) => {
    // If user is not authenticated, show auth modal first
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // For now, just redirect to billing page
    // In a real implementation, this would handle the plan selection
    navigate("/billing");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      {/* Always show the header */}
      <Header onNavigate={handleNavigate} />

      {/* Use React Router for routing */}
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            !isAuthenticated ? (
              <LandingPage onGetStarted={handleGetStarted} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        <Route
          path="/pricing"
          element={<PricingPage onSelectPlan={handleSelectPlan} />}
        />

        {/* Protected routes */}
        <Route
          path="dashboard/*"
          element={
            isAuthenticated ? (
              <Dashboard
                studyPlans={studyPlans}
                onViewPlan={handleViewPlan}
                incentiveData={incentiveData}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        >
          <Route
            index
            element={<Navigate to="/dashboard/overview" replace />}
          />
          <Route
            path="overview"
            element={
              <DashboardOverview
                studyPlans={studyPlans}
                onViewPlan={handleViewPlan}
                incentiveData={incentiveData}
              />
            }
          />
          <Route
            path="plans"
            element={
              <DashboardPlans
                studyPlans={studyPlans}
                onCreateNew={() => navigate("/dashboard/create")}
                onViewPlan={handleViewPlan}
                onDeletePlan={handleDeletePlan}
              />
            }
          />
          <Route
            path="create"
            element={<DashboardCreate onSubmit={handleFormSubmit} />}
          />
          <Route
            path="generate"
            element={
              <DashboardGenerate
                inputData={inputData}
                onPlanGenerated={handlePlanGenerated}
                onBack={() => navigate("/dashboard/create")}
              />
            }
          />
          <Route
            path="analytics"
            element={<DashboardAnalytics studyPlans={studyPlans} />}
          />
          <Route path="social" element={<DashboardSocial />} />
        </Route>

        <Route
          path="/study/:id"
          element={
            isAuthenticated ? (
              <StudyPlanDisplay
                studyPlans={studyPlans}
                onStartOver={handleStartOver}
                onAddFile={handleAddFileToPlan}
                onTaskComplete={handleTaskComplete}
                onStartQuiz={handleStartQuiz}
                incentiveData={incentiveData}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        <Route
          path="/quiz/:planId"
          element={
            isAuthenticated && currentQuiz ? (
              <QuizComponent
                quiz={currentQuiz.quiz}
                onComplete={handleQuizComplete}
                onBack={() => {
                  const planId = currentQuiz.planId;
                  setCurrentQuiz(null);
                  navigate(`/study/${planId}`);
                }}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        <Route
          path="/billing"
          element={
            isAuthenticated ? <BillingPage /> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/billing/success"
          element={
            isAuthenticated ? (
              <PaymentSuccessPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

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
    <StoreProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </StoreProvider>
  );
}

export default App;
