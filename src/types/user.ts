export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  lastLoginAt: Date;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    studyReminders: boolean;
    weeklyReports: boolean;
  };
  profile: {
    bio?: string;
    learningGoals: string[];
    preferredStudyTime: 'morning' | 'afternoon' | 'evening' | 'night';
    timezone: string;
    studyLevel: 'beginner' | 'intermediate' | 'advanced';
  };
  stats: {
    totalStudyTime: number;
    plansCompleted: number;
    currentStreak: number;
    longestStreak: number;
    totalXP: number;
    level: number;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}