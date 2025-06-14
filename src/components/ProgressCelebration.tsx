import React, { useEffect, useState } from 'react';
import { Award, Star, Sparkles, Target, TrendingUp } from 'lucide-react';

interface CelebrationProps {
  type: 'task' | 'day' | 'plan' | 'streak' | 'achievement';
  title: string;
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const ProgressCelebration: React.FC<CelebrationProps> = ({ 
  type, 
  title, 
  message, 
  onClose, 
  autoClose = true, 
  duration = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 100);

    if (autoClose) {
      const timer = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(onClose, 500);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'task': return <Target className="h-8 w-8" />;
      case 'day': return <Award className="h-8 w-8" />;
      case 'plan': return <Star className="h-8 w-8" />;
      case 'streak': return <TrendingUp className="h-8 w-8" />;
      case 'achievement': return <Sparkles className="h-8 w-8" />;
      default: return <Award className="h-8 w-8" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'task': return 'from-green-400 to-green-600';
      case 'day': return 'from-blue-400 to-blue-600';
      case 'plan': return 'from-purple-400 to-purple-600';
      case 'streak': return 'from-orange-400 to-red-500';
      case 'achievement': return 'from-yellow-400 to-orange-500';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  const getEmoji = () => {
    switch (type) {
      case 'task': return '✅';
      case 'day': return '🎯';
      case 'plan': return '🏆';
      case 'streak': return '🔥';
      case 'achievement': return '🎉';
      default: return '🎉';
    }
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-all duration-500 ${
      isVisible && !isLeaving ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Confetti Animation */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-gradient-to-r ${getColors()} rounded-full animate-bounce`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center transform transition-all duration-500 ${
        isVisible && !isLeaving ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        {/* Icon */}
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r ${getColors()} text-white mb-6 shadow-lg animate-pulse`}>
          {getIcon()}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {getEmoji()} {title}
        </h2>

        {/* Message */}
        <p className="text-gray-600 text-lg mb-6">{message}</p>

        {/* Sparkle Effects */}
        <div className="flex justify-center space-x-2 mb-6">
          {[...Array(5)].map((_, i) => (
            <Sparkles 
              key={i}
              className={`h-4 w-4 text-yellow-400 animate-pulse`}
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            setIsLeaving(true);
            setTimeout(onClose, 500);
          }}
          className={`bg-gradient-to-r ${getColors()} text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105`}
        >
          Awesome! 🚀
        </button>
      </div>
    </div>
  );
};

export default ProgressCelebration;