import React from "react";
import { Trophy, TrendingUp } from "lucide-react";
import { StudyGroup } from "../types";

interface GroupPerformanceProps {
  group: StudyGroup;
}

const GroupPerformance: React.FC<GroupPerformanceProps> = ({ group }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
        Group Performance
      </h3>

      {group.studyPlan ? (
        <div className="space-y-6">
          {/* Leaderboard */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-xl">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
              Group Leaderboard
            </h4>
            <div className="space-y-3">
              {(group.members || [])
                .map((member) => ({
                  ...member,
                  progress: group.memberProgress?.[
                    member.id
                  ] || { completedTasks: 0, totalTasks: 1 },
                }))
                .sort(
                  (a, b) =>
                    b.progress.completedTasks /
                      b.progress.totalTasks -
                    a.progress.completedTasks / a.progress.totalTasks
                )
                .map((member, index) => {
                  const progressPercentage =
                    (member.progress.completedTasks /
                      member.progress.totalTasks) *
                    100;

                  return (
                    <div
                      key={member.id}
                      className={`flex items-center p-3 rounded-lg ${
                        index === 0
                          ? "bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/30"
                          : index === 1
                          ? "bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/30"
                          : index === 2
                          ? "bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700/30"
                          : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/30"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3 ${
                          index === 0
                            ? "bg-yellow-500 text-white"
                            : index === 1
                            ? "bg-gray-400 text-white"
                            : index === 2
                            ? "bg-orange-500 text-white"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-200"
                        }`}
                      >
                        {index + 1}
                      </div>

                      <img
                        src={
                          member.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                            member.name
                          )}`
                        }
                        alt={member.name}
                        className="w-8 h-8 rounded-full mr-3"
                      />

                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {member.name}
                          </span>
                          {member.role === "admin" && (
                            <Trophy className="h-4 w-4 text-yellow-500 dark:text-yellow-400 ml-2" />
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {member.progress.completedTasks}/
                          {member.progress.totalTasks} tasks
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-gray-900 dark:text-gray-100">
                          {Math.round(progressPercentage)}%
                        </div>
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              index === 0
                                ? "bg-yellow-500 dark:bg-yellow-400"
                                : index === 1
                                ? "bg-gray-400 dark:bg-gray-300"
                                : index === 2
                                ? "bg-orange-500 dark:bg-orange-400"
                                : "bg-blue-500 dark:bg-blue-400"
                            }`}
                            style={{
                              width: `${progressPercentage}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Group Statistics */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-900/20 dark:bg-blue-800/20 border border-blue-800/30 dark:border-blue-700/30 p-6 rounded-xl text-center">
              <div className="text-2xl font-bold text-blue-400 dark:text-blue-300 mb-2">
                {Math.round(
                  (Object.values(
                    group.memberProgress || {}
                  ).reduce(
                    (sum, progress) =>
                      sum +
                      progress.completedTasks / progress.totalTasks,
                    0
                  ) /
                    ((group.members || []).length || 1)) *
                    100
                ) || 0}
                %
              </div>
              <div className="text-sm text-gray-400">
                Average Progress
              </div>
            </div>

            <div className="bg-green-900/20 dark:bg-green-800/20 border border-green-800/30 dark:border-green-700/30 p-6 rounded-xl text-center">
              <div className="text-2xl font-bold text-green-400 dark:text-green-300 mb-2">
                {Object.values(
                  group.memberProgress || {}
                ).reduce(
                  (sum, progress) => sum + progress.completedTasks,
                  0
                )}
              </div>
              <div className="text-sm text-gray-400">
                Total Tasks Completed
              </div>
            </div>

            <div className="bg-purple-900/20 dark:bg-purple-800/20 border border-purple-800/30 dark:border-purple-700/30 p-6 rounded-xl text-center">
              <div className="text-2xl font-bold text-purple-400 dark:text-purple-300 mb-2">
                {
                  (group.members || []).filter(
                    (m) => m.isActive
                  ).length
                }
              </div>
              <div className="text-sm text-gray-400">
                Active Members
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-500 dark:text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Performance Data
          </h3>
          <p className="text-gray-400 dark:text-gray-500">
            Create a study plan to track group performance.
          </p>
        </div>
      )}
    </div>
  );
};

export default GroupPerformance;
