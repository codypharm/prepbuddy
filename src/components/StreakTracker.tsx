import React from 'react';
import { Flame, Calendar, Target, Award } from 'lucide-react';

interface StreakTrackerProps {
  currentStreak: number;
  longestStreak: number;
  studyGoal: number;
  completedToday: boolean;
}

const StreakTracker: React.FC<StreakTrackerProps> = ({ 
  currentStreak, 
  longestStreak, 
  studyGoal, 
  completedToday 
}) => {
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'from-purple-500 to-pink-500';
    if (streak >= 14) return 'from-orange-500 to-red-500';
    if (streak >= 7) return 'from-yellow-500 to-orange-500';
    if (streak >= 3) return 'from-blue-500 to-indigo-500';
    return 'from-gray-400 to-gray-500';
  };

  const getStreakTitle = (streak: number) => {
    if (streak >= 30) return 'Legendary Learner! 🏆';
    if (streak >= 14) return 'Study Champion! 🥇';
    if (streak >= 7) return 'Week Warrior! ⚡';
    if (streak >= 3) return 'Getting Hot! 🔥';
    return 'Just Started! 🌱';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <Flame className="h-5 w-5 mr-2 text-orange-500" />
          Study Streak
        </h3>
        {completedToday && (
          <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
            ✓ Today Complete
          </div>
        )}
      </div>

      {/* Main Streak Display */}
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r ${getStreakColor(currentStreak)} shadow-lg mb-4`}>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{currentStreak}</div>
            <div className="text-xs text-white opacity-90">days</div>
          </div>
        </div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{getStreakTitle(currentStreak)}</h4>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {currentStreak === 0 
            ? 'Start your learning journey today!' 
            : `You're on fire! Keep the momentum going.`
          }
        </p>
      </div>

      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{currentStreak}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Current</div>
        </div>
        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{longestStreak}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Best</div>
        </div>
      </div>

      {/* Progress to Next Milestone */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">Next Milestone</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {currentStreak >= 30 ? 'Legendary!' : 
             currentStreak >= 14 ? `${30 - currentStreak} days to Legendary` :
             currentStreak >= 7 ? `${14 - currentStreak} days to Champion` :
             currentStreak >= 3 ? `${7 - currentStreak} days to Week Warrior` :
             `${3 - currentStreak} days to Getting Hot`
            }
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full bg-gradient-to-r ${getStreakColor(currentStreak)} transition-all duration-300`}
            style={{ 
              width: `${currentStreak >= 30 ? 100 : 
                      currentStreak >= 14 ? ((currentStreak - 14) / 16) * 100 :
                      currentStreak >= 7 ? ((currentStreak - 7) / 7) * 100 :
                      currentStreak >= 3 ? ((currentStreak - 3) / 4) * 100 :
                      (currentStreak / 3) * 100}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Motivational Message */}
      <div className="text-center">
        {!completedToday ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
            <p className="text-yellow-800 dark:text-yellow-400 text-sm font-medium">
              🎯 Complete a study task today to maintain your streak!
            </p>
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
            <p className="text-green-800 dark:text-green-400 text-sm font-medium">
              🎉 Great job! Your streak is safe for today.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreakTracker;