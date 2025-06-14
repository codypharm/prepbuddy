import React, { useState } from 'react';
import { Plus, Calendar, Clock, Target, BookOpen, Trash2, Eye, Search, Filter, CheckCircle, Brain } from 'lucide-react';
import { StudyPlan } from '../App';

interface PlansPageProps {
  studyPlans: StudyPlan[];
  onCreateNew: () => void;
  onViewPlan: (plan: StudyPlan) => void;
  onDeletePlan: (planId: string) => void;
}

const PlansPage: React.FC<PlansPageProps> = ({ studyPlans, onCreateNew, onViewPlan, onDeletePlan }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'progress' | 'name'>('recent');

  // Filter and sort plans
  const filteredPlans = studyPlans
    .filter(plan => {
      const matchesSearch = plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           plan.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty = filterDifficulty === 'all' || plan.difficulty === filterDifficulty;
      return matchesSearch && matchesDifficulty;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'progress':
          const aProgress = a.progress.completedTasks / a.progress.totalTasks;
          const bProgress = b.progress.completedTasks / b.progress.totalTasks;
          return bProgress - aProgress;
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const getProgressColor = (progress: number) => {
    if (progress >= 0.8) return 'bg-green-500';
    if (progress >= 0.5) return 'bg-blue-500';
    if (progress >= 0.2) return 'bg-yellow-500';
    return 'bg-gray-300 dark:bg-gray-600';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
      case 'intermediate': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
      case 'advanced': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Study Plans</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and track all your AI-powered study plans</p>
        </div>
        <button
          onClick={onCreateNew}
          className="mt-4 lg:mt-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create New Plan
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-colors duration-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search study plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'progress' | 'name')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="recent">Most Recent</option>
              <option value="progress">By Progress</option>
              <option value="name">By Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Study Plans Grid */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center transition-colors duration-200">
          <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {studyPlans.length === 0 ? 'No Study Plans Yet' : 'No Plans Match Your Search'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {studyPlans.length === 0 
              ? 'Create your first AI-powered study plan to get started on your learning journey.'
              : 'Try adjusting your search terms or filters to find what you\'re looking for.'
            }
          </p>
          {studyPlans.length === 0 && (
            <button
              onClick={onCreateNew}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center mx-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Plan
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            const progressPercentage = plan.progress.totalTasks > 0 
              ? (plan.progress.completedTasks / plan.progress.totalTasks) * 100 
              : 0;

            return (
              <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">{plan.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{plan.description}</p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => onViewPlan(plan)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="View Plan"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeletePlan(plan.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete Plan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(plan.difficulty)}`}>
                        {plan.difficulty}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">{plan.duration}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-medium text-gray-900 dark:text-white">{Math.round(progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progressPercentage / 100)}`}
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Days</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{plan.progress.completedDays}/{plan.progress.totalDays}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Target className="h-4 w-4 text-gray-400 mr-1" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Tasks</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{plan.progress.completedTasks}/{plan.progress.totalTasks}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <BookOpen className="h-4 w-4 text-gray-400 mr-1" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Topics</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{plan.topics.length}</p>
                      </div>
                    </div>

                    {plan.files.length > 0 && (
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{plan.files.length} file(s) attached</p>
                        <div className="flex flex-wrap gap-1">
                          {plan.files.slice(0, 2).map((file) => (
                            <span key={file.id} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                              {file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}
                            </span>
                          ))}
                          {plan.files.length > 2 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">+{plan.files.length - 2} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onViewPlan(plan)}
                    className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium text-sm"
                  >
                    Continue Studying
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlansPage;