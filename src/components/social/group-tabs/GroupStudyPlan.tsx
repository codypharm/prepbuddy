import React from "react";
import { BookOpen, Plus, CheckCircle } from "lucide-react";
import { StudyGroup } from "../types";
import { useAuth } from "../../../hooks/useAuth";

interface GroupStudyPlanProps {
  group: StudyGroup;
  isAdmin: boolean;
  onCreateStudyPlan: () => void;
  onTaskComplete: (
    memberId: string,
    taskId: string,
    completed: boolean
  ) => void;
  getTaskCompletionStatus: (memberId: string, taskId: string) => boolean;
}

const GroupStudyPlan: React.FC<GroupStudyPlanProps> = ({
  group,
  isAdmin,
  onCreateStudyPlan,
  onTaskComplete,
  getTaskCompletionStatus,
}) => {
  const { user } = useAuth();

  return (
    <div>
      {group.studyPlan ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {group.studyPlan.title}
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {group.studyPlan.duration} • {group.studyPlan.difficulty}
            </span>
          </div>

          <p className="text-gray-600 dark:text-gray-300">
            {group.studyPlan.description}
          </p>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              Study Schedule
            </h4>
            {(group.studyPlan.schedule || []).map((day, dayIndex) => (
              <div
                key={day.day}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
              >
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-medium text-gray-900 dark:text-gray-100">
                    Day {day.day}: {day.title}
                  </h5>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {day.estimatedTime}
                  </span>
                </div>

                <div className="space-y-2">
                  {(day.tasks || []).map((task, taskIndex) => {
                    const taskId = `${dayIndex}-${taskIndex}`;
                    const isCompleted = user
                      ? getTaskCompletionStatus(user.id, taskId)
                      : false;

                    return (
                      <div
                        key={taskIndex}
                        className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <button
                          onClick={() =>
                            user &&
                            onTaskComplete(user.id, taskId, !isCompleted)
                          }
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${
                            isCompleted
                              ? "bg-green-500 border-green-500"
                              : "border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-400"
                          }`}
                        >
                          {isCompleted && (
                            <CheckCircle className="h-3 w-3 text-white" />
                          )}
                        </button>
                        <span
                          className={`flex-1 ${
                            isCompleted
                              ? "line-through text-gray-500 dark:text-gray-400"
                              : "text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          {task}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Study Plan Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {isAdmin
              ? "Create a study plan for your group members to follow."
              : "The group admin will create a study plan soon."}
          </p>
          {isAdmin && (
            <button
              onClick={onCreateStudyPlan}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-6 py-3 rounded-lg transition-colors flex items-center mx-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Study Plan
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupStudyPlan;
