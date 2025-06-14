import React from "react";
import { Target, Users, FileText } from "lucide-react";
import { StudyGroup } from "../types";
import { useAuth } from "../../../hooks/useAuth";

interface GroupOverviewProps {
  group: StudyGroup;
}

const GroupOverview: React.FC<GroupOverviewProps> = ({ group }) => {
  const { user } = useAuth();
  const currentUserProgress = group.memberProgress?.[user?.id || ""];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Group Progress
            </h3>
            <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          {group.studyPlan ? (
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
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
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Average completion
              </div>
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400">No study plan yet</div>
          )}
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Active Members
            </h3>
            <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
            {
              (group.members || []).filter((m) => m.isActive)
                .length
            }
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            of {(group.members || []).length} total
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Study Files
            </h3>
            <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            {(group.files || []).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">uploaded files</div>
        </div>
      </div>

      {currentUserProgress && group.studyPlan && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Your Progress
          </h3>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600 dark:text-gray-300">Tasks Completed</span>
            <span className="font-medium dark:text-gray-200">
              {currentUserProgress.completedTasks}/
              {currentUserProgress.totalTasks}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-blue-500 dark:bg-blue-400 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${
                  (currentUserProgress.completedTasks /
                    currentUserProgress.totalTasks) *
                  100
                }%`,
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupOverview;
