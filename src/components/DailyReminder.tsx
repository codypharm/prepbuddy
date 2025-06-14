import React, { useState, useEffect } from 'react';
import { Bell, X, Clock, Target, Flame } from 'lucide-react';

interface DailyReminderProps {
  hasStudiedToday: boolean;
  currentStreak: number;
  onDismiss: () => void;
}

const DailyReminder: React.FC<DailyReminderProps> = ({ 
  hasStudiedToday, 
  currentStreak, 
  onDismiss 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Show reminder if user hasn't studied today and it's after 6 PM
    const hour = currentTime.getHours();
    if (!hasStudiedToday && hour >= 18 && hour < 23) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [hasStudiedToday, currentTime]);

  const getMotivationalMessage = () => {
    const hour = currentTime.getHours();
    
    if (currentStreak === 0) {
      return "Start your learning journey today! Every expert was once a beginner.";
    } else if (currentStreak >= 7) {
      return `Amazing ${currentStreak}-day streak! Don't break the chain now.`;
    } else if (hour >= 20) {
      return "The day is almost over! A quick 15-minute session can keep your streak alive.";
    } else {
      return `You're ${currentStreak} days strong! Keep the momentum going.`;
    }
  };

  const getUrgencyLevel = () => {
    const hour = currentTime.getHours();
    if (hour >= 22) return 'urgent';
    if (hour >= 20) return 'warning';
    return 'normal';
  };

  const urgency = getUrgencyLevel();

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className={`bg-white rounded-xl shadow-2xl border-2 p-6 transform transition-all duration-300 hover:scale-105 ${
        urgency === 'urgent' ? 'border-red-300 animate-pulse' :
        urgency === 'warning' ? 'border-yellow-300' :
        'border-blue-300'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2 rounded-full ${
            urgency === 'urgent' ? 'bg-red-100' :
            urgency === 'warning' ? 'bg-yellow-100' :
            'bg-blue-100'
          }`}>
            <Bell className={`h-5 w-5 ${
              urgency === 'urgent' ? 'text-red-600' :
              urgency === 'warning' ? 'text-yellow-600' :
              'text-blue-600'
            }`} />
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center">
            <Flame className="h-4 w-4 mr-2 text-orange-500" />
            Study Reminder
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {getMotivationalMessage()}
          </p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Target className="h-4 w-4 mr-1" />
            {currentStreak} day streak
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={onDismiss}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Later
          </button>
          <button
            onClick={() => {
              // Navigate to study plans or create new one
              onDismiss();
            }}
            className={`flex-1 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              urgency === 'urgent' ? 'bg-red-500 hover:bg-red-600' :
              urgency === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' :
              'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            Study Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyReminder;