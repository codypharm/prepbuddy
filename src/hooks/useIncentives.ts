import { useState, useEffect } from 'react';
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
  
  const [incentiveData, setIncentiveData] = useState<IncentiveData>({
    currentStreak: profile?.stats?.currentStreak || 0,
    longestStreak: profile?.stats?.longestStreak || 0,
    hasStudiedToday: false,
    totalXP: profile?.stats?.totalXP || 0,
    level: profile?.stats?.level || 1,
    achievements: [],
    lastStudyDate: null
  });

  const [showCelebration, setShowCelebration] = useState<{
    show: boolean;
    type: 'task' | 'day' | 'plan' | 'streak' | 'achievement';
    title: string;
    message: string;
  } | null>(null);

  // Calculate streak and other metrics from Supabase data
  useEffect(() => {
    const calculateIncentives = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Use completions from Supabase instead of localStorage
      const allCompletedDates = completions.map(c => new Date(c.completedAt));
      allCompletedDates.sort((a, b) => b.getTime() - a.getTime());

      // Calculate current streak
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

      // Check if studied today
      const hasStudiedToday = allCompletedDates.some(date => {
        const taskDate = new Date(date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      });

      // Calculate longest streak (use profile data if available)
      const longestStreak = Math.max(
        currentStreak, 
        profile?.stats?.longestStreak || 0,
        parseInt(localStorage.getItem('longest-streak') || '0')
      );
      
      if (currentStreak > longestStreak) {
        localStorage.setItem('longest-streak', currentStreak.toString());
      }

      // Calculate XP and level (use profile data if available)
      const completedPlans = studyPlans.filter(plan => plan.progress.completedDays === plan.progress.totalDays).length;
      const totalCompletedTasks = completions.length;
      const totalXP = profile?.stats?.totalXP || 
        (totalCompletedTasks * 10) + (currentStreak * 5) + (completedPlans * 25);
      const level = profile?.stats?.level || Math.floor(totalXP / 100) + 1;

      // Get achievements
      const achievements = JSON.parse(localStorage.getItem('unlocked-achievements') || '[]');

      // Get last study date
      const lastStudyDate = allCompletedDates.length > 0 ? allCompletedDates[0] : null;

      const newIncentiveData = {
        currentStreak,
        longestStreak,
        hasStudiedToday,
        totalXP,
        level,
        achievements,
        lastStudyDate
      };

      setIncentiveData(newIncentiveData);
    };

    calculateIncentives();
  }, [studyPlans, completions, profile]);
  
  // Update user stats in a separate effect to prevent infinite loop
  useEffect(() => {
    // This will only run when incentiveData changes
    if (user && updateUserStats) {
      updateUserStats({
        currentStreak: incentiveData.currentStreak,
        longestStreak: incentiveData.longestStreak,
        totalXP: incentiveData.totalXP,
        level: incentiveData.level,
        plansCompleted: studyPlans.filter(plan => plan.progress.completedDays === plan.progress.totalDays).length,
        totalStudyTime: Math.floor(completions.length * 0.5) // Estimate 30 min per task
      });
    }
  }, [incentiveData, user, updateUserStats, studyPlans, completions]);

  // Trigger celebrations for milestones
  const triggerCelebration = (type: 'task' | 'day' | 'plan' | 'streak' | 'achievement', title: string, message: string) => {
    setShowCelebration({ show: true, type, title, message });
  };

  // Award XP for actions
  const awardXP = (amount: number, reason: string) => {
    const newXP = incentiveData.totalXP + amount;
    const newLevel = Math.floor(newXP / 100) + 1;
    
    if (newLevel > incentiveData.level) {
      triggerCelebration('achievement', 'Level Up!', `You've reached level ${newLevel}! Keep up the great work!`);
    }

    const updatedData = {
      ...incentiveData,
      totalXP: newXP,
      level: newLevel
    };

    setIncentiveData(updatedData);

    // Update user stats in auth system
    if (user && updateUserStats) {
      updateUserStats({
        totalXP: newXP,
        level: newLevel,
        currentStreak: updatedData.currentStreak,
        longestStreak: updatedData.longestStreak,
        plansCompleted: studyPlans.filter(plan => plan.progress.completedDays === plan.progress.totalDays).length,
        totalStudyTime: user.stats.totalStudyTime
      });
    }
  };

  // Check for new achievements
  const checkAchievements = () => {
    const unlockedAchievements = JSON.parse(localStorage.getItem('unlocked-achievements') || '[]');
    const newAchievements = [];

    // Check streak achievements
    if (incentiveData.currentStreak >= 3 && !unlockedAchievements.includes('streak-3')) {
      newAchievements.push('streak-3');
      triggerCelebration('achievement', 'Getting Warmed Up!', 'You\'ve maintained a 3-day study streak!');
    }
    
    if (incentiveData.currentStreak >= 7 && !unlockedAchievements.includes('streak-7')) {
      newAchievements.push('streak-7');
      triggerCelebration('achievement', 'Week Warrior!', 'Amazing! You\'ve studied for 7 consecutive days!');
    }

    // Check completion achievements
    const completedPlans = studyPlans.filter(plan => plan.progress.completedDays === plan.progress.totalDays).length;
    if (completedPlans >= 1 && !unlockedAchievements.includes('first-completion')) {
      newAchievements.push('first-completion');
      triggerCelebration('achievement', 'Goal Achiever!', 'You\'ve completed your first study plan!');
    }

    // Save new achievements
    if (newAchievements.length > 0) {
      const updatedAchievements = [...unlockedAchievements, ...newAchievements];
      localStorage.setItem('unlocked-achievements', JSON.stringify(updatedAchievements));
      
      setIncentiveData(prev => ({
        ...prev,
        achievements: updatedAchievements
      }));
    }
  };

  // Handle task completion
  const handleTaskCompletion = (planId: string, dayIndex: number, taskIndex: number) => {
    awardXP(10, 'Task completed');
    triggerCelebration('task', 'Task Complete!', 'Great job! You\'re making progress!');
    
    // Check if day is now complete
    const plan = studyPlans.find(p => p.id === planId);
    if (plan) {
      // Use completions from Supabase instead of localStorage
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
  };

  // Handle plan completion
  const handlePlanCompletion = (planId: string) => {
    awardXP(100, 'Plan completed');
    triggerCelebration('plan', 'Plan Complete!', 'Outstanding! You\'ve completed an entire study plan!');
    checkAchievements();
  };

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