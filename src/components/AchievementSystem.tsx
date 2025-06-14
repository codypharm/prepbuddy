import React, { useState } from 'react';
import { Award, Star, Target, BookOpen, Flame, Brain, Clock, TrendingUp, X } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'streak' | 'completion' | 'speed' | 'consistency';
  requirement: number;
  current: number;
  unlocked: boolean;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementSystemProps {
  studyPlans: any[];
  completedTasks: number;
  currentStreak: number;
  longestStreak: number;
}

const AchievementSystem: React.FC<AchievementSystemProps> = ({ 
  studyPlans, 
  completedTasks, 
  currentStreak, 
  longestStreak 
}) => {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const completedPlans = studyPlans.filter(plan => plan.progress.completedDays === plan.progress.totalDays).length;
  const totalPlans = studyPlans.length;

  const achievements: Achievement[] = [
    // Streak Achievements
    {
      id: 'first-steps',
      title: 'First Steps',
      description: 'Complete your first study task',
      icon: <Target className="h-6 w-6" />,
      category: 'streak',
      requirement: 1,
      current: Math.max(completedTasks, 0),
      unlocked: completedTasks >= 1,
      rarity: 'common'
    },
    {
      id: 'streak-3',
      title: 'Getting Warmed Up',
      description: 'Maintain a 3-day study streak',
      icon: <Flame className="h-6 w-6" />,
      category: 'streak',
      requirement: 3,
      current: currentStreak,
      unlocked: longestStreak >= 3,
      rarity: 'common'
    },
    {
      id: 'streak-7',
      title: 'Week Warrior',
      description: 'Study for 7 consecutive days',
      icon: <Award className="h-6 w-6" />,
      category: 'streak',
      requirement: 7,
      current: currentStreak,
      unlocked: longestStreak >= 7,
      rarity: 'rare'
    },
    {
      id: 'streak-14',
      title: 'Fortnight Champion',
      description: 'Achieve a 14-day study streak',
      icon: <Star className="h-6 w-6" />,
      category: 'streak',
      requirement: 14,
      current: currentStreak,
      unlocked: longestStreak >= 14,
      rarity: 'epic'
    },
    {
      id: 'streak-30',
      title: 'Legendary Learner',
      description: 'Master the art with a 30-day streak',
      icon: <TrendingUp className="h-6 w-6" />,
      category: 'streak',
      requirement: 30,
      current: currentStreak,
      unlocked: longestStreak >= 30,
      rarity: 'legendary'
    },

    // Completion Achievements
    {
      id: 'first-plan',
      title: 'Plan Creator',
      description: 'Create your first study plan',
      icon: <BookOpen className="h-6 w-6" />,
      category: 'completion',
      requirement: 1,
      current: totalPlans,
      unlocked: totalPlans >= 1,
      rarity: 'common'
    },
    {
      id: 'plan-completer',
      title: 'Goal Achiever',
      description: 'Complete your first study plan',
      icon: <Award className="h-6 w-6" />,
      category: 'completion',
      requirement: 1,
      current: completedPlans,
      unlocked: completedPlans >= 1,
      rarity: 'rare'
    },
    {
      id: 'multi-planner',
      title: 'Multi-Tasker',
      description: 'Create 5 different study plans',
      icon: <Brain className="h-6 w-6" />,
      category: 'completion',
      requirement: 5,
      current: totalPlans,
      unlocked: totalPlans >= 5,
      rarity: 'epic'
    },
    {
      id: 'task-master',
      title: 'Task Master',
      description: 'Complete 50 study tasks',
      icon: <Target className="h-6 w-6" />,
      category: 'completion',
      requirement: 50,
      current: completedTasks,
      unlocked: completedTasks >= 50,
      rarity: 'epic'
    },

    // Speed Achievements
    {
      id: 'quick-learner',
      title: 'Quick Learner',
      description: 'Complete a study plan in under 5 days',
      icon: <Clock className="h-6 w-6" />,
      category: 'speed',
      requirement: 1,
      current: studyPlans.filter(plan => {
        const daysSinceCreated = Math.floor((Date.now() - new Date(plan.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return plan.progress.completedDays === plan.progress.totalDays && daysSinceCreated <= 5;
      }).length,
      unlocked: studyPlans.some(plan => {
        const daysSinceCreated = Math.floor((Date.now() - new Date(plan.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return plan.progress.completedDays === plan.progress.totalDays && daysSinceCreated <= 5;
      }),
      rarity: 'rare'
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-orange-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 dark:border-gray-600';
      case 'rare': return 'border-blue-300 dark:border-blue-600';
      case 'epic': return 'border-purple-300 dark:border-purple-600';
      case 'legendary': return 'border-yellow-300 dark:border-yellow-600';
      default: return 'border-gray-300 dark:border-gray-600';
    }
  };

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <Award className="h-5 w-5 mr-2 text-yellow-500" />
          Achievements
        </h3>
        <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">
          {unlockedAchievements.length}/{achievements.length}
        </div>
      </div>

      {/* Achievement Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">Progress</span>
          <span className="font-medium text-gray-900 dark:text-white">{Math.round((unlockedAchievements.length / achievements.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${(unlockedAchievements.length / achievements.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Recent Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recent Unlocks</h4>
          <div className="space-y-2">
            {unlockedAchievements.slice(-3).reverse().map((achievement) => (
              <div 
                key={achievement.id}
                className={`flex items-center p-3 rounded-lg border-2 ${getRarityBorder(achievement.rarity)} bg-gradient-to-r ${getRarityColor(achievement.rarity)} bg-opacity-10 dark:bg-opacity-20 cursor-pointer hover:bg-opacity-20 dark:hover:bg-opacity-30 transition-all duration-200`}
                onClick={() => setSelectedAchievement(achievement)}
              >
                <div className={`p-2 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white mr-3`}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">{achievement.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</div>
                </div>
                <div className="text-green-500">
                  ✓
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Achievements */}
      {lockedAchievements.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Next Goals</h4>
          <div className="space-y-2">
            {lockedAchievements.slice(0, 3).map((achievement) => {
              const progress = Math.min((achievement.current / achievement.requirement) * 100, 100);
              
              return (
                <div 
                  key={achievement.id}
                  className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
                  onClick={() => setSelectedAchievement(achievement)}
                >
                  <div className="p-2 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 mr-3">
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{achievement.title}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{achievement.description}</div>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mr-2">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {achievement.current}/{achievement.requirement}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-4 rounded-full bg-gradient-to-r ${getRarityColor(selectedAchievement.rarity)} text-white`}>
                {selectedAchievement.icon}
              </div>
              <button
                onClick={() => setSelectedAchievement(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{selectedAchievement.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{selectedAchievement.description}</p>
              
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 bg-gradient-to-r ${getRarityColor(selectedAchievement.rarity)} text-white`}>
                {selectedAchievement.rarity.charAt(0).toUpperCase() + selectedAchievement.rarity.slice(1)}
              </div>
              
              {selectedAchievement.unlocked ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <div className="text-green-800 dark:text-green-400 font-medium mb-1">🎉 Achievement Unlocked!</div>
                  <div className="text-green-600 dark:text-green-400 text-sm">
                    Congratulations on reaching this milestone!
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <div className="text-blue-800 dark:text-blue-400 font-medium mb-2">Progress</div>
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((selectedAchievement.current / selectedAchievement.requirement) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {selectedAchievement.current}/{selectedAchievement.requirement}
                    </span>
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 text-sm">
                    {selectedAchievement.requirement - selectedAchievement.current} more to unlock!
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementSystem;