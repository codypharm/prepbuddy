import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  StudyGroup,
  StudyPlan,
  GroupFile,
  NewGroupData,
  synchronizeGroupFiles,
} from "./types";
import { StudyGroupProvider, useStudyGroups } from "./StudyGroupContext";
import GroupList from "./GroupList";
import GroupDetail from "./GroupDetail";
import CreateStudyPlan from "./study-plan/CreateStudyPlan";
import GenerateStudyPlan from "./study-plan/GenerateStudyPlan";
import CreateGroupModal from "./modals/CreateGroupModal";
import AddMemberModal from "./modals/AddMemberModal";
import UploadFileModal from "./modals/UploadFileModal";
import { FileProcessor } from "../../services/fileProcessor";
import { useSubscriptionStore } from "../../stores/useSubscriptionStore";
import { useUsageStore } from "../../stores/useUsageStore";

interface SocialFeaturesProps {}

const SocialFeaturesContent: React.FC = () => {
  const { user } = useAuth();
  const { studyGroups, selectedGroup, setStudyGroups, setSelectedGroup } = useStudyGroups();
  const { getCurrentPlan, isSubscribed } = useSubscriptionStore();
  const { getUsage, incrementUsage } = useUsageStore();

  // UI state
  const [activeView, setActiveView] = useState<string>("groups-list");
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState<boolean>(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState<boolean>(false);
  const [isUploadFileModalOpen, setIsUploadFileModalOpen] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  // Form data
  const [newGroupData, setNewGroupData] = useState<NewGroupData>({
    name: "",
    description: "",
    topic: "",
    difficulty: "intermediate",
  });
  const [newMemberEmail, setNewMemberEmail] = useState<string>("");

  // Create a new group
  const createGroup = async () => {
    if (!user) return;

    try {
      // Check subscription limits
      const currentPlan = getCurrentPlan();
      const usage = await getUsage();
      
      if (currentPlan.limits.studyGroups !== 'unlimited') {
        if (studyGroups.length >= currentPlan.limits.studyGroups) {
          setSubscriptionError(
            `You've reached your limit of ${currentPlan.limits.studyGroups} study groups. ` +
            `Please upgrade your plan to create more groups.`
          );
          return;
        }
      }

      const newGroup: StudyGroup = {
        id: Date.now().toString(),
        name: newGroupData.name,
        description: newGroupData.description,
        topic: newGroupData.topic,
        difficulty: newGroupData.difficulty,
        adminId: user.id,
        adminName: user.name || user.email.split("@")[0],
        isPublic: newGroupData.isPublic || false,
        createdAt: new Date(),
        lastActivity: new Date(),
        members: [
          {
            id: user.id,
            name: user.name || user.email.split("@")[0],
            email: user.email,
            role: "admin",
            avatar: user.avatar || "",
            joinedAt: new Date(),
            isActive: true,
          },
        ],
        files: [],
        memberProgress: {},
      };

      setStudyGroups([...studyGroups, newGroup]);
      setSelectedGroup(newGroup);
      setNewGroupData({
        name: "",
        description: "",
        topic: "",
        difficulty: "intermediate",
      });
      setIsCreateGroupModalOpen(false);
      setActiveView("group-detail");
      
      // Track usage
      await incrementUsage('studyGroupsCreated');
    } catch (error) {
      console.error('Failed to create group:', error);
      setSubscriptionError(error instanceof Error ? error.message : 'Failed to create group');
    }
  };

  // Add a member to the selected group
  const addMember = () => {
    if (!selectedGroup || !newMemberEmail.trim()) return;

    const updatedGroup = { ...selectedGroup };
    const newMember = {
      id: `member-${Date.now()}`,
      name: newMemberEmail.split("@")[0],
      email: newMemberEmail,
      role: "member" as const,
      avatar: "",
      joinedAt: new Date(),
      isActive: true,
    };

    updatedGroup.members = [...(updatedGroup.members || []), newMember];

    // Initialize member progress if study plan exists
    if (updatedGroup.studyPlan) {
      const totalTasks =
        updatedGroup.studyPlan.schedule?.reduce(
          (sum, day) => sum + (day.tasks?.length || 0),
          0
        ) || 0;

      updatedGroup.memberProgress = {
        ...(updatedGroup.memberProgress || {}),
        [newMember.id]: {
          completedTasks: 0,
          totalTasks,
          lastActive: new Date(),
        },
      };
    }

    const updatedGroups = studyGroups.map((g) =>
      g.id === selectedGroup.id ? updatedGroup : g
    );

    setStudyGroups(updatedGroups);
    setSelectedGroup(updatedGroup);
    setNewMemberEmail("");
    setIsAddMemberModalOpen(false);
  };

  // Handle file upload for the selected group
  const handleFileUpload = async (file: File) => {
    if (!selectedGroup || !user) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Check subscription limits for file uploads
      const currentPlan = getCurrentPlan();
      const usage = await getUsage();
      
      if (currentPlan.limits.fileUploads !== 'unlimited') {
        if (usage.fileUploads >= currentPlan.limits.fileUploads) {
          throw new Error(
            `You've reached your limit of ${currentPlan.limits.fileUploads} file uploads per month. ` +
            `Please upgrade your plan to upload more files.`
          );
        }
      }
      
      // Check storage limits
      const storageLimit = currentPlan.limits.storage;
      const currentStorage = usage.storageUsed;
      const fileSizeBytes = file.size;
      
      // Convert storage limit to bytes
      let storageLimitBytes: number;
      if (storageLimit === 'unlimited') {
        storageLimitBytes = Number.MAX_SAFE_INTEGER;
      } else {
        const match = storageLimit.match(/(\d+)(MB|GB)/);
        if (!match) throw new Error('Invalid storage limit format');
        
        const amount = parseInt(match[1]);
        const unit = match[2];
        
        if (unit === 'MB') {
          storageLimitBytes = amount * 1024 * 1024;
        } else if (unit === 'GB') {
          storageLimitBytes = amount * 1024 * 1024 * 1024;
        } else {
          throw new Error('Invalid storage unit');
        }
      }
      
      if (currentStorage + fileSizeBytes > storageLimitBytes) {
        throw new Error(
          `You've reached your storage limit of ${storageLimit}. ` +
          `Please upgrade your plan or delete some files to free up space.`
        );
      }

      // Validate file size
      const isValidSize = FileProcessor.validateFileSize(file);

      if (!isValidSize) {
        setUploadError("File size exceeds the maximum allowed limit (25MB)");
        setIsUploading(false);
        return;
      }

      // Check if file type is supported
      const supportedTypes = FileProcessor.getSupportedFileTypes();
      const fileExtension = file.name.substring(file.name.lastIndexOf("."));
      const isValidType =
        supportedTypes.includes(fileExtension.toLowerCase()) ||
        file.type.includes("pdf") ||
        file.type.includes("docx") ||
        file.type.includes("text");

      if (!isValidType) {
        setUploadError(
          "File format not supported. Please upload PDF, DOCX, TXT, MD, RTF, TEX, or BIB files."
        );
        setIsUploading(false);
        return;
      }

      const content = await FileProcessor.extractTextFromFile(file);
      const newFile: GroupFile = {
        id: `file-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        uploadedBy: user.name || user.email.split("@")[0],
        content,
      };

      const updatedGroup = { ...selectedGroup };
      updatedGroup.files = [...(updatedGroup.files || []), newFile];

      // Synchronize files with study plan if it exists
      if (updatedGroup.studyPlan) {
        synchronizeGroupFiles(updatedGroup);
      }

      const updatedGroups = studyGroups.map((g) =>
        g.id === selectedGroup.id ? updatedGroup : g
      );

      setStudyGroups(updatedGroups);
      setSelectedGroup(updatedGroup);
      
      // Track file upload usage
      await incrementUsage('fileUploads');
      await incrementUsage('storageUsed', file.size);
      
      setIsUploading(false);
      setIsUploadFileModalOpen(false);
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadError(error instanceof Error ? error.message : "Failed to process file");
      setIsUploading(false);
    }
  };

  // Handle form submission for creating a study plan
  const handleFormSubmit = (plan: StudyPlan) => {
    if (!selectedGroup || !user) return;

    const updatedGroup = { ...selectedGroup };
    updatedGroup.studyPlan = plan;

    // Initialize progress tracking for all members
    const totalTasks =
      plan.schedule?.reduce((sum, day) => sum + (day.tasks?.length || 0), 0) ||
      0;

    updatedGroup.memberProgress = {};
    updatedGroup.members?.forEach((member) => {
      updatedGroup.memberProgress![member.id] = {
        completedTasks: 0,
        totalTasks,
        lastActive: new Date(),
      };
    });

    // Synchronize with files
    synchronizeGroupFiles(updatedGroup);

    const updatedGroups = studyGroups.map((g) =>
      g.id === selectedGroup.id ? updatedGroup : g
    );

    setStudyGroups(updatedGroups);
    setSelectedGroup(updatedGroup);
    setActiveView("group-detail");
  };

  // Handle generated plan from AI
  const handlePlanGenerated = (plan: StudyPlan) => {
    handleFormSubmit(plan);
  };

  // Handle task completion
  const handleTaskComplete = (
    memberId: string,
    taskId: string,
    completed: boolean
  ) => {
    if (!selectedGroup || !selectedGroup.studyPlan) return;

    const updatedGroup = { ...selectedGroup };
    const memberProgress = updatedGroup.memberProgress?.[memberId];

    if (!memberProgress) return;

    // Track completed tasks in a local variable since it's not in the interface
    const completedTaskIds = new Set<string>([]);

    if (completed) {
      completedTaskIds.add(taskId);
    } else {
      completedTaskIds.delete(taskId);
    }

    updatedGroup.memberProgress = {
      ...(updatedGroup.memberProgress || {}),
      [memberId]: {
        ...memberProgress,
        completedTasks: completed
          ? memberProgress.completedTasks + 1
          : Math.max(0, memberProgress.completedTasks - 1),
        lastActive: new Date(),
      },
    };

    const updatedGroups = studyGroups.map((g) =>
      g.id === selectedGroup.id ? updatedGroup : g
    );

    setStudyGroups(updatedGroups);
    setSelectedGroup(updatedGroup);
  };

  // Check if a task is completed
  // Since we don't have completedTaskIds in the interface, we'll need to track this separately
  // This is a simplified implementation that doesn't actually track individual task IDs
  const getTaskCompletionStatus = (
    memberId: string,
    _taskId: string
  ): boolean => {
    if (!selectedGroup || !selectedGroup.memberProgress) return false;

    const memberProgress = selectedGroup.memberProgress[memberId];
    if (!memberProgress) return false;

    // For now, we'll just return false as we need to implement a proper tracking mechanism
    // In a real implementation, we would check if _taskId is in the completed tasks list
    return false;
  };

  // Handle file download
  const handleFileDownload = (file: GroupFile) => {
    const blob = new Blob([file.content], { type: file.type || "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Check if user is admin of selected group
  const isAdmin =
    selectedGroup?.members?.some(
      (member) => member.id === user?.id && member.role === "admin"
    ) || false;

  // Render the appropriate view
  const renderView = () => {
    if (!selectedGroup) {
      return (
        <GroupList
          groups={studyGroups}
          onSelectGroup={setSelectedGroup}
          onCreateGroup={() => setIsCreateGroupModalOpen(true)}
        />
      );
    }

    switch (activeView) {
      case "create-plan":
        return (
          <CreateStudyPlan
            group={selectedGroup}
            onBack={() => setActiveView("group-detail")}
            onSave={handleFormSubmit}
            onGeneratePlan={() => setActiveView("generate-plan")}
          />
        );
      case "generate-plan":
        return (
          <GenerateStudyPlan
            group={selectedGroup}
            onBack={() => setActiveView("group-detail")}
            onPlanGenerated={handlePlanGenerated}
          />
        );
      case "group-detail":
      default:
        return (
          <GroupDetail
            group={selectedGroup}
            onCreateStudyPlan={() => setActiveView("create-plan")}
            onAddMember={() => setIsAddMemberModalOpen(true)}
            onUploadFile={() => setIsUploadFileModalOpen(true)}
            onFileDownload={handleFileDownload}
            onTaskComplete={handleTaskComplete}
            getTaskCompletionStatus={getTaskCompletionStatus}
          />
        );
    }
  };

  // Subscription error message
  const renderSubscriptionError = () => {
    if (!subscriptionError) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Subscription Limit Reached
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {subscriptionError}
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setSubscriptionError(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Close
            </button>
            <a
              href="/pricing"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-md"
            >
              Upgrade Plan
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {renderView()}

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        newGroupData={newGroupData}
        setNewGroupData={setNewGroupData}
        onCreateGroup={createGroup}
      />

      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        newMemberEmail={newMemberEmail}
        setNewMemberEmail={setNewMemberEmail}
        onAddMember={addMember}
      />

      <UploadFileModal
        isOpen={isUploadFileModalOpen}
        onClose={() => setIsUploadFileModalOpen(false)}
        isUploading={isUploading}
        uploadError={uploadError}
        onFileUpload={handleFileUpload}
      />
      
      {/* Subscription Error Modal */}
      {renderSubscriptionError()}
    </div>
  );
};

// Wrapper component that provides the StudyGroupContext
const SocialFeatures: React.FC<SocialFeaturesProps> = () => {
  return (
    <StudyGroupProvider>
      <SocialFeaturesContent />
    </StudyGroupProvider>
  );
};

export default SocialFeatures;