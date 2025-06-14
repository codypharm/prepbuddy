import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { StudyGroup, GroupFile } from "./types";
import GroupOverview from "./group-tabs/GroupOverview";
import GroupStudyPlan from "./group-tabs/GroupStudyPlan";
import GroupMembers from "./group-tabs/GroupMembers";
import GroupFiles from "./group-tabs/GroupFiles";
import GroupPerformance from "./group-tabs/GroupPerformance";

interface GroupDetailProps {
  group: StudyGroup;
  onCreateStudyPlan: () => void;
  onAddMember: () => void;
  onUploadFile: () => void;
  onFileDownload: (file: GroupFile) => void;
  onTaskComplete: (memberId: string, taskId: string, completed: boolean) => void;
  getTaskCompletionStatus: (memberId: string, taskId: string) => boolean;
}

const GroupDetail: React.FC<GroupDetailProps> = ({
  group,
  onCreateStudyPlan,
  onAddMember,
  onUploadFile,
  onFileDownload,
  onTaskComplete,
  getTaskCompletionStatus,
}) => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const { user } = useAuth();
  const isAdmin = group.members?.some(
    (member) => member.id === user?.id && member.role === "admin"
  ) || false;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "study-plan", label: "Study Plan" },
    { id: "members", label: "Members" },
    { id: "files", label: "Files" },
    { id: "performance", label: "Performance" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {group.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {group.topic} • {group.difficulty} • {group.members?.length || 0} members
          </p>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="py-4">
        {activeTab === "overview" && <GroupOverview group={group} />}
        
        {activeTab === "study-plan" && (
          <GroupStudyPlan
            group={group}
            isAdmin={isAdmin}
            onCreateStudyPlan={onCreateStudyPlan}
            onTaskComplete={onTaskComplete}
            getTaskCompletionStatus={getTaskCompletionStatus}
          />
        )}
        
        {activeTab === "members" && (
          <GroupMembers
            group={group}
            isAdmin={isAdmin}
            onAddMember={onAddMember}
          />
        )}
        
        {activeTab === "files" && (
          <GroupFiles
            group={group}
            isAdmin={isAdmin}
            onUploadFile={onUploadFile}
            onFileDownload={onFileDownload}
          />
        )}
        
        {activeTab === "performance" && (
          <GroupPerformance group={group} />
        )}
      </div>
    </div>
  );
};

export default GroupDetail;
