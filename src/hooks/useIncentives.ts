import { useState, useEffect, useMemo, useCallback } from 'react';
import { StudyPlan } from '../App';
import { useAuth } from './useAuth';
import { useTaskCompletionStore } from '../stores/useTaskCompletionStore';
import { useAuthStore } from '../stores/useAuthStore';

interface IncentiveData {
  currentStreak: number;
  longestStreak: number;
  hasStudiedToday: boolean;
  totalXP: number;
  level: number;
  achievements: string[];
  lastStudyDate: Date | null;
}

export const useIncentives = (studyPlans: StudyPlan[]) => {
  const { user, updateUserStats } = useAuth();
  const { profile } = useAuthStore();
  const { completions } = useTaskCompletionStore();

  // Memoize the calculation of incentive data to prevent unnecessary re-renders
  const calculatedIncentiveData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allCompletedDates = completions.map(c => new Date(c.completedAt));
    allCompletedDates.sort((a, b) => b.getTime() - a.getTime());

    let currentStreak = 0;
    const checkDate = new Date(today);
    
    while (checkDate >= new Date('2024-01-01')) {
      const hasTaskOnDate = allCompletedDates.some(date => {
        const taskDate = new Date(date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === checkDate.getTime();
      });

      if (hasTaskOnDate) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const hasStudiedToday = allCompletedDates.some(date => {
      const taskDate = new Date(date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });

    const longestStreak = Math.max(
      currentStreak,
      profile?.stats?.longestStreak || 0
    );

    const completedPlans = studyPlans.filter(plan => plan.progress.completedDays === plan.progress.totalDays).length;
    const totalCompletedTasks = completions.length;
    const totalXP = (totalCompletedTasks * 10) + (currentStreak * 5) + (completedPlans * 25);
    const level = Math.floor(totalXP / 100) + 1;

    const achievements = JSON.parse(localStorage.getItem('unlocked-achievements') || '[]');
    const lastStudyDate = allCompletedDates.length > 0 ? allCompletedDates[0] : null;

    return {
      currentStreak,
      longestStreak,
      hasStudiedToday,
      totalXP,
      level,
      achievements,
      lastStudyDate
    };
  }, [studyPlans, completions, profile]);

  const [incentiveData, setIncentiveData] = useState<IncentiveData>(calculatedIncentiveData);
  
  const [showCelebration, setShowCelebration] = useState<{
    show: boolean;
    type: 'task' | 'day' | 'plan' | 'streak' | 'achievement';
    title: string;
    message: string;
  } | null>(null);

  // Effect to sync local state with memoized data when it changes
  useEffect(() => {
    setIncentiveData(calculatedIncentiveData);
  }, [calculatedIncentiveData]);

  // Effect to update user stats in the backend when local data changes
  // This effect is now decoupled from the calculation logic to prevent loops
  useEffect(() => {
    if (user && updateUserStats && (
      incentiveData.totalXP !== profile?.stats?.totalXP ||
      incentiveData.level !== profile?.stats?.level ||
      incentiveData.currentStreak !== profile?.stats?.currentStreak ||
      incentiveData.longestStreak !== profile?.stats?.longestStreak
    )) {
      updateUserStats({
        currentStreak: incentiveData.currentStreak,
        longestStreak: incentiveData.longestStreak,
        totalXP: incentiveData.totalXP,
        level: incentiveData.level,
        plansCompleted: studyPlans.filter(plan => plan.progress.completedDays === plan.progress.totalDays).length,
        totalStudyTime: Math.floor(completions.length * 0.5)
      });
    }
  }, [incentiveData, user, updateUserStats, profile, studyPlans, completions]);

  const triggerCelebration = useCallback((type: 'task' | 'day' | 'plan' | 'streak' | 'achievement', title: string, message: string) => {
    setShowCelebration({ show: true, type, title, message });
  }, []);

  const awardXP = useCallback((amount: number, reason: string) => {
    setIncentiveData(prevData => {
      const newXP = prevData.totalXP + amount;
      const newLevel = Math.floor(newXP / 100) + 1;
      
      if (newLevel > prevData.level) {
        triggerCelebration('achievement', 'Level Up!', `You've reached level ${newLevel}! Keep up the great work!`);
      }

      return {
        ...prevData,
        totalXP: newXP,
        level: newLevel
      };
    });
  }, [triggerCelebration]);

  const checkAchievements = useCallback(() => {
    const unlockedAchievements = JSON.parse(localStorage.getItem('unlocked-achievements') || '[]');
    const newAchievements = [];

    if (incentiveData.currentStreak >= 3 && !unlockedAchievements.includes('streak-3')) {
      newAchievements.push('streak-3');
      triggerCelebration('achievement', 'Getting Warmed Up!', 'You\'ve maintained a 3-day study streak!');
    }
    
    if (incentiveData.currentStreak >= 7 && !unlockedAchievements.includes('streak-7')) {
      newAchievements.push('streak-7');
      triggerCelebration('achievement', 'Week Warrior!', 'Amazing! You\'ve studied for 7 consecutive days!');
    }

    const completedPlans = studyPlans.filter(plan => plan.progress.completedDays === plan.progress.totalDays).length;
    if (completedPlans >= 1 && !unlockedAchievements.includes('first-completion')) {
      newAchievements.push('first-completion');
      triggerCelebration('achievement', 'Goal Achiever!', 'You\'ve completed your first study plan!');
    }

    if (newAchievements.length > 0) {
      const updatedAchievements = [...unlockedAchievements, ...newAchievements];
      localStorage.setItem('unlocked-achievements', JSON.stringify(updatedAchievements));
      
      setIncentiveData(prev => ({
        ...prev,
        achievements: updatedAchievements
      }));
    }
  }, [incentiveData.currentStreak, studyPlans, triggerCelebration]);

  const handleTaskCompletion = useCallback((planId: string, dayIndex: number, taskIndex: number) => {
    awardXP(10, 'Task completed');
    triggerCelebration('task', 'Task Complete!', 'Great job! You\'re making progress!');
    
    const plan = studyPlans.find(p => p.id === planId);
    if (plan) {
      const dayTasks = plan.schedule[dayIndex]?.tasks.length || 0;
      const dayCompletedTasks = completions.filter(
        c => c.studyPlanId === planId && c.dayIndex === dayIndex
      ).length;
      
      if (dayCompletedTasks === dayTasks) {
        awardXP(25, 'Day completed');
        triggerCelebration('day', 'Day Complete!', 'Excellent! You\'ve finished all tasks for today!');
      }
    }
    
    checkAchievements();
  }, [awardXP, triggerCelebration, studyPlans, completions, checkAchievements]);

  const handlePlanCompletion = useCallback((planId: string) => {
    awardXP(100, 'Plan completed');
    triggerCelebration('plan', 'Plan Complete!', 'Outstanding! You\'ve completed an entire study plan!');
    checkAchievements();
  }, [awardXP, triggerCelebration, checkAchievements]);

  return {
    incentiveData,
    showCelebration,
    setShowCelebration,
    triggerCelebration,
    awardXP,
    handleTaskCompletion,
    handlePlanCompletion,
    checkAchievements
  };
};