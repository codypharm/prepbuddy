import React from "react";
import { Users, Plus, CheckCircle, Crown } from "lucide-react";
import { StudyGroup } from "./types";
import { useAuth } from "../../hooks/useAuth";

interface GroupListProps {
  groups: StudyGroup[];
  onSelectGroup: (group: StudyGroup) => void;
  onCreateGroup: () => void;
}

const GroupList: React.FC<GroupListProps> = ({
  groups,
  onSelectGroup,
  onCreateGroup,
}) => {
  const { user } = useAuth();

  const isUserAdmin = (group: StudyGroup) => {
    return user && group.adminId === user.id;
  };

  const getUserGroups = () => {
    return groups.filter((group) =>
      (group.members || []).some((member) => member.id === user?.id)
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Study Groups
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Collaborate and learn together with your study groups
        </p>
      </div>

      {/* Create Group Button */}
      <div className="mb-8">
        <button
          onClick={onCreateGroup}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Study Group
        </button>
      </div>

      {/* Groups List */}
      <div className="space-y-6">
        {getUserGroups().length > 0 ? (
          getUserGroups().map((group) => (
            <div
              key={group.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => onSelectGroup(group)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mr-3">
                      {group.name}
                    </h3>
                    {isUserAdmin(group) && (
                      <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                        <Crown className="h-3 w-3 mr-1" />
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    {group.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                      {group.topic}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        group.difficulty === "beginner"
                          ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                          : group.difficulty === "intermediate"
                          ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                          : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                      }`}
                    >
                      {group.difficulty}
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-sm">
                      {(group.files || []).length} files
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {(group.members || []).length} members
                  </div>
                  {group.studyPlan ? (
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Study plan active
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      No study plan yet
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {(group.members || []).slice(0, 4).map((member) => (
                    <img
                      key={member.id}
                      src={
                        member.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                          member.name
                        )}`
                      }
                      alt={member.name}
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                    />
                  ))}
                  {(group.members || []).length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                      +{(group.members || []).length - 4}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Last active {group.lastActivity.toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Study Groups Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Create or join a study group to collaborate with other learners.
            </p>
            <button
              onClick={onCreateGroup}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center mx-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Group
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupList;
