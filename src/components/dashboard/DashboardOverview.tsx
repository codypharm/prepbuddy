import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Award, Activity } from 'lucide-react';
import { StudyPlan } from '../../App';
import StreakTracker from '../StreakTracker';
import AchievementSystem from '../AchievementSystem';

interface DashboardOverviewProps {
  studyPlans: StudyPlan[];
  onViewPlan: (plan: StudyPlan) => void;
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

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  studyPlans,
  onViewPlan,
  incentiveData,
}) => {
  const navigate = useNavigate();

  // Calculate overall statistics from real data
  const totalPlans = studyPlans.length;
  const activePlans = studyPlans.filter(
    (plan) => plan.progress.completedDays < plan.progress.totalDays
  ).length;
  const completedPlans = studyPlans.filter(
    (plan) => plan.progress.completedDays === plan.progress.totalDays
  ).length;

  // Calculate study progress metrics
  const totalTasks = studyPlans.reduce(
    (sum, plan) => sum + plan.progress.totalTasks,
    0
  );
  const completedTasks = studyPlans.reduce(
    (sum, plan) => sum + plan.progress.completedTasks,
    0
  );
  const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleCreateNewClick = () => {
    navigate('/dashboard/create');
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 sm:p-8 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Welcome back to PrepBuddy! 👋
        </h1>
        <p className="text-blue-100 text-sm sm:text-base">
          Ready to continue your learning journey? Let's make today count!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Plans
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {totalPlans}
              </p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Active Plans
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {activePlans}
              </p>
            </div>
            <Activity className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Completed
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {completedPlans}
              </p>
            </div>
            <Award className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Progress
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {Math.round(overallProgress)}%
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Streak Tracker */}
      <StreakTracker
        currentStreak={incentiveData.currentStreak}
        longestStreak={incentiveData.longestStreak}
        studyGoal={7}
        completedToday={incentiveData.hasStudiedToday}
      />

      {/* Achievement System */}
      <AchievementSystem
        studyPlans={studyPlans}
        completedTasks={completedTasks}
        currentStreak={incentiveData.currentStreak}
        longestStreak={incentiveData.longestStreak}
      />

      {/* Recent Study Plans */}
      {totalPlans > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="p-6 sm:p-8 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Recent Study Plans
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  Continue where you left off
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard/plans')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm sm:text-base transition-colors"
              >
                View All Plans →
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-4">
            {studyPlans.slice(0, 3).map((plan) => {
              const progressPercentage = plan.progress.totalTasks > 0 
                ? (plan.progress.completedTasks / plan.progress.totalTasks) * 100 
                : 0;

              return (
                <div
                  key={plan.id}
                  onClick={() => onViewPlan(plan)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors group"
                >
                  <div className="flex-1 mb-3 sm:mb-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {plan.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {plan.description ? plan.description.substring(0, 60) + (plan.description.length > 60 ? '...' : '') : ''}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex-1 max-w-[180px]">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400">
                          Progress
                        </span>
                        <span className="dark:text-gray-300">
                          {Math.round(progressPercentage)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="hidden sm:block text-right">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          plan.progress.completedTasks === plan.progress.totalTasks && plan.progress.totalTasks > 0
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                            : plan.progress.completedTasks > 0
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {plan.progress.completedTasks === plan.progress.totalTasks && plan.progress.totalTasks > 0 
                          ? "Completed" 
                          : plan.progress.completedTasks > 0 
                          ? "In Progress" 
                          : "Not Started"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalPlans === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center transition-colors duration-200">
          <BookOpen className="h-12 sm:h-16 w-12 sm:w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to PrepBuddy!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">
            Create your first AI-powered study plan to get started on your learning journey.
          </p>
          <button
            onClick={handleCreateNewClick}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg px-6 py-3 text-sm sm:text-base font-medium transition-colors"
          >
            Create Your First Study Plan
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
