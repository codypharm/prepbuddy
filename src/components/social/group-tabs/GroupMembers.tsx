import React from "react";
import { UserPlus, Crown } from "lucide-react";
import { StudyGroup } from "../types";

interface GroupMembersProps {
  group: StudyGroup;
  isAdmin: boolean;
  onAddMember: () => void;
}

const GroupMembers: React.FC<GroupMembersProps> = ({
  group,
  isAdmin,
  onAddMember,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Group Members ({(group.members || []).length})
        </h3>
        {isAdmin && (
          <button
            onClick={onAddMember}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(group.members || []).map((member) => {
          const progress = group.memberProgress?.[member.id];
          const progressPercentage = progress
            ? (progress.completedTasks / progress.totalTasks) * 100
            : 0;

          return (
            <div
              key={member.id}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
            >
              <div className="flex items-center mb-3">
                <img
                  src={
                    member.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                      member.name
                    )}`
                  }
                  alt={member.name}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {member.name}
                    </h4>
                    {member.role === "admin" && (
                      <Crown className="h-4 w-4 text-yellow-500 ml-2" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {member.email}
                  </p>
                </div>
              </div>

              {progress && group.studyPlan && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-300">Progress</span>
                    <span className="font-medium dark:text-gray-200">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {progress.completedTasks}/{progress.totalTasks}{" "}
                    tasks completed
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupMembers;
