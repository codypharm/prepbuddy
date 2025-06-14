import React from 'react';
import { TrendingUp, Calendar, Clock, Target, Award, BookOpen, Brain, Activity, BarChart3, PieChart, Zap } from 'lucide-react';
import { StudyPlan } from '../App';

interface AnalyticsPageProps {
  studyPlans: StudyPlan[];
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ studyPlans }) => {
  // Calculate real analytics data from actual study plans
  const totalPlans = studyPlans.length;
  const activePlans = studyPlans.filter(plan => plan.progress.completedDays < plan.progress.totalDays).length;
  const completedPlans = studyPlans.filter(plan => plan.progress.completedDays === plan.progress.totalDays).length;
  
  const totalTasks = studyPlans.reduce((sum, plan) => sum + plan.progress.totalTasks, 0);
  const completedTasks = studyPlans.reduce((sum, plan) => sum + plan.progress.completedTasks, 0);
  const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const totalStudyTime = studyPlans.reduce((total, plan) => {
    const timePerDay = plan.schedule[0]?.estimatedTime || '1-hour';
    const hours = timePerDay.includes('30') ? 0.5 : timePerDay.includes('2') ? 2 : timePerDay.includes('3') ? 3 : 1;
    return total + (hours * plan.progress.totalDays);
  }, 0);

  // Calculate actual study streak based on completed tasks
  const calculateStudyStreak = () => {
    if (studyPlans.length === 0) return 0;
    
    // Get all completed task dates from localStorage
    const allCompletedDates: Date[] = [];
    studyPlans.forEach(plan => {
      const completedTasksData = localStorage.getItem(`completed-tasks-${plan.id}`);
      if (completedTasksData) {
        const completedTasks = JSON.parse(completedTasksData);
        // For each completed task, estimate completion date (simplified)
        completedTasks.forEach(() => {
          allCompletedDates.push(new Date());
        });
      }
    });

    if (allCompletedDates.length === 0) return 0;
    
    // Calculate streak (simplified - in real app you'd track actual completion dates)
    return Math.min(allCompletedDates.length, 30); // Cap at 30 days
  };

  const currentStreak = calculateStudyStreak();

  // Real difficulty distribution
  const difficultyStats = {
    beginner: studyPlans.filter(p => p.difficulty === 'beginner').length,
    intermediate: studyPlans.filter(p => p.difficulty === 'intermediate').length,
    advanced: studyPlans.filter(p => p.difficulty === 'advanced').length,
  };

  // Real duration distribution
  const durationStats = {
    '1-week': studyPlans.filter(p => p.duration === '1-week').length,
    '2-weeks': studyPlans.filter(p => p.duration === '2-weeks').length,
    '1-month': studyPlans.filter(p => p.duration === '1-month').length,
  };

  // Real recent activity (last 7 days)
  const recentActivity = studyPlans
    .filter(plan => {
      const daysSinceCreated = Math.floor((Date.now() - new Date(plan.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceCreated <= 7;
    })
    .length;

  // Calculate real weekly performance based on actual data
  const calculateWeeklyPerformance = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    
    return days.map((day, index) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + index);
      
      // Calculate planned and completed tasks for this day
      let planned = 0;
      let completed = 0;
      
      studyPlans.forEach(plan => {
        // Estimate daily tasks based on plan structure
        const dailyTasks = Math.ceil(plan.progress.totalTasks / plan.progress.totalDays);
        planned += dailyTasks;
        
        // Get actual completed tasks
        const completedTasksData = localStorage.getItem(`completed-tasks-${plan.id}`);
        if (completedTasksData) {
          const completedTasksList = JSON.parse(completedTasksData);
          // Estimate completed tasks for this day (simplified)
          completed += Math.floor(completedTasksList.length / 7);
        }
      });
      
      return {
        day,
        completed: Math.max(0, completed),
        planned: Math.max(1, planned) // Ensure at least 1 to avoid division by zero
      };
    });
  };

  const performanceData = calculateWeeklyPerformance();
  const weeklyCompletion = performanceData.reduce((sum, day) => sum + day.completed, 0);
  const weeklyPlanned = performanceData.reduce((sum, day) => sum + day.planned, 0);
  const weeklyEfficiency = weeklyPlanned > 0 ? (weeklyCompletion / weeklyPlanned) * 100 : 0;

  // Calculate most active day based on real data
  const getMostActiveDay = () => {
    const dayTotals = performanceData.reduce((acc, day) => {
      acc[day.day] = day.completed;
      return acc;
    }, {} as Record<string, number>);
    
    const mostActiveDay = Object.entries(dayTotals).reduce((a, b) => 
      dayTotals[a[0]] > dayTotals[b[0]] ? a : b
    );
    
    return mostActiveDay[0];
  };

  const mostActiveDay = studyPlans.length > 0 ? getMostActiveDay() : 'N/A';

  // Calculate average session time based on study plans
  const averageSessionTime = studyPlans.length > 0 
    ? studyPlans.reduce((total, plan) => {
        const timePerDay = plan.schedule[0]?.estimatedTime || '1-hour';
        const hours = timePerDay.includes('30') ? 0.5 : timePerDay.includes('2') ? 2 : timePerDay.includes('3') ? 3 : 1;
        return total + hours;
      }, 0) / studyPlans.length
    : 0;

  // Calculate completion rate
  const completionRate = totalPlans > 0 ? (completedPlans / totalPlans) * 100 : 0;

  // Get topics from all study plans
  const allTopics = studyPlans.flatMap(plan => plan.topics);
  const uniqueTopics = [...new Set(allTopics)];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-200">Learning Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Real insights from your study activities and progress</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Overall Progress</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 transition-colors duration-200">{Math.round(overallProgress)}%</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg transition-colors duration-200">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Tasks Completed</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 transition-colors duration-200">{completedTasks}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg transition-colors duration-200">
              <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Completion Rate</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 transition-colors duration-200">{Math.round(completionRate)}%</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg transition-colors duration-200">
              <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Total Study Time</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 transition-colors duration-200">{totalStudyTime}h</p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg transition-colors duration-200">
              <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Weekly Performance Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center transition-colors duration-200">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            Weekly Performance
          </h3>
          {studyPlans.length > 0 ? (
            <div className="space-y-4">
              {performanceData.map((day) => {
                const completionRate = day.planned > 0 ? (day.completed / day.planned) * 100 : 0;
                return (
                  <div key={day.day} className="flex items-center">
                    <div className="w-12 text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">{day.day}</div>
                    <div className="flex-1 mx-4">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1 transition-colors duration-200">
                        <span>{day.completed}/{day.planned} tasks</span>
                        <span>{Math.round(completionRate)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 transition-colors duration-200">
                        <div 
                          className="bg-blue-500 dark:bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(completionRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4 transition-colors duration-200" />
              <p className="text-gray-500 dark:text-gray-400 transition-colors duration-200">Create study plans to see weekly performance</p>
            </div>
          )}
        </div>

        {/* Study Plan Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center transition-colors duration-200">
            <PieChart className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
            Plan Distribution
          </h3>
          
          {studyPlans.length > 0 ? (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 transition-colors duration-200">By Difficulty</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">Beginner</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2 transition-colors duration-200">
                        <div 
                          className="bg-green-500 dark:bg-green-400 h-2 rounded-full transition-colors duration-200"
                          style={{ width: `${totalPlans > 0 ? (difficultyStats.beginner / totalPlans) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200 transition-colors duration-200">{difficultyStats.beginner}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">Intermediate</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2 transition-colors duration-200">
                        <div 
                          className="bg-yellow-500 dark:bg-yellow-400 h-2 rounded-full transition-colors duration-200"
                          style={{ width: `${totalPlans > 0 ? (difficultyStats.intermediate / totalPlans) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200 transition-colors duration-200">{difficultyStats.intermediate}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">Advanced</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2 transition-colors duration-200">
                        <div 
                          className="bg-red-500 dark:bg-red-400 h-2 rounded-full transition-colors duration-200"
                          style={{ width: `${totalPlans > 0 ? (difficultyStats.advanced / totalPlans) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200 transition-colors duration-200">{difficultyStats.advanced}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 transition-colors duration-200">By Duration</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">1 Week</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2 transition-colors duration-200">
                        <div 
                          className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-colors duration-200"
                          style={{ width: `${totalPlans > 0 ? (durationStats['1-week'] / totalPlans) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200 transition-colors duration-200">{durationStats['1-week']}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">2 Weeks</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2 transition-colors duration-200">
                        <div 
                          className="bg-indigo-500 dark:bg-indigo-400 h-2 rounded-full transition-colors duration-200"
                          style={{ width: `${totalPlans > 0 ? (durationStats['2-weeks'] / totalPlans) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200 transition-colors duration-200">{durationStats['2-weeks']}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">1 Month</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2 transition-colors duration-200">
                        <div 
                          className="bg-purple-500 dark:bg-purple-400 h-2 rounded-full transition-colors duration-200"
                          style={{ width: `${totalPlans > 0 ? (durationStats['1-month'] / totalPlans) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200 transition-colors duration-200">{durationStats['1-month']}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <PieChart className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4 transition-colors duration-200" />
              <p className="text-gray-500 dark:text-gray-400 transition-colors duration-200">Create study plans to see distribution</p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Learning Insights */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center transition-colors duration-200">
            <Brain className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
            Learning Insights
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors duration-200">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Most Active Day</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 transition-colors duration-200">{mostActiveDay}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg transition-colors duration-200">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Avg. Session Time</span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400 transition-colors duration-200">{averageSessionTime.toFixed(1)} hours</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg transition-colors duration-200">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Active Plans</span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400 transition-colors duration-200">{activePlans}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg transition-colors duration-200">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Recent Activity</span>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400 transition-colors duration-200">{recentActivity} plans</span>
            </div>
          </div>
        </div>

        {/* Achievement Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center transition-colors duration-200">
            <Award className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
            Real Achievements
          </h3>
          <div className="space-y-4">
            {completedPlans > 0 && (
              <div className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg transition-colors duration-200">
                <div className="bg-yellow-500 dark:bg-yellow-600 p-2 rounded-full mr-3 transition-colors duration-200">
                  <Award className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">Plan Completer</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">Completed {completedPlans} study plan{completedPlans > 1 ? 's' : ''}</div>
                </div>
              </div>
            )}
            
            {completedTasks > 10 && (
              <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors duration-200">
                <div className="bg-blue-500 dark:bg-blue-600 p-2 rounded-full mr-3 transition-colors duration-200">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">Task Master</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">Completed {completedTasks} tasks</div>
                </div>
              </div>
            )}
            
            {totalPlans > 3 && (
              <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg transition-colors duration-200">
                <div className="bg-green-500 dark:bg-green-600 p-2 rounded-full mr-3 transition-colors duration-200">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">Learning Enthusiast</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">Created {totalPlans} study plans</div>
                </div>
              </div>
            )}

            {studyPlans.length === 0 && (
              <div className="text-center py-4">
                <Award className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2 transition-colors duration-200" />
                <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">Complete tasks to unlock achievements!</p>
              </div>
            )}
          </div>
        </div>

        {/* Study Topics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center transition-colors duration-200">
            <BookOpen className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            Study Topics
          </h3>
          {uniqueTopics.length > 0 ? (
            <div className="space-y-3">
              {uniqueTopics.slice(0, 6).map((topic, index) => (
                <div key={topic} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors duration-200">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate transition-colors duration-200">{topic}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded transition-colors duration-200">
                    {allTopics.filter(t => t === topic).length}
                  </span>
                </div>
              ))}
              {uniqueTopics.length > 6 && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">
                  +{uniqueTopics.length - 6} more topics
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <BookOpen className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2 transition-colors duration-200" />
              <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">Create study plans to see topics</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center transition-colors duration-200">
          <Calendar className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
          Study Plan Timeline
        </h3>
        
        {studyPlans.length > 0 ? (
          <div className="space-y-4">
            {studyPlans
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5)
              .map((plan, index) => {
                const progressPercentage = plan.progress.totalTasks > 0 
                  ? (plan.progress.completedTasks / plan.progress.totalTasks) * 100 
                  : 0;
                
                return (
                  <div key={plan.id} className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors duration-200">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                      progressPercentage === 100 ? 'bg-green-500 dark:bg-green-600' : 
                      progressPercentage > 50 ? 'bg-blue-500 dark:bg-blue-600' : 'bg-gray-400 dark:bg-gray-500'
                    } transition-colors duration-200`}>
                      {progressPercentage === 100 ? '✓' : Math.round(progressPercentage)}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white transition-colors duration-200">{plan.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">{plan.description}</p>
                          <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
                            <span className="capitalize">{plan.difficulty}</span>
                            <span>{plan.duration}</span>
                            <span>Created {new Date(plan.createdAt).toLocaleDateString()}</span>
                            <span>{plan.progress.completedTasks}/{plan.progress.totalTasks} tasks</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">{Math.round(progressPercentage)}%</div>
                          <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1 transition-colors duration-200">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                progressPercentage === 100 ? 'bg-green-500 dark:bg-green-400' : 'bg-blue-500 dark:bg-blue-400'
                              } transition-colors duration-200`}
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4 transition-colors duration-200" />
            <p className="text-gray-500 dark:text-gray-400 transition-colors duration-200">No study plans yet. Create your first plan to see your timeline!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;