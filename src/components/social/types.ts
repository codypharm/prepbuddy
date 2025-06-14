// Import StudyPlan from App or define our own version
import { StudyPlan as AppStudyPlan } from "../../App";

// Re-export the StudyPlan type for use in our components
export type StudyPlan = AppStudyPlan;

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  adminId: string;
  adminName: string;
  members: GroupMember[];
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  isPublic: boolean;
  createdAt: Date;
  lastActivity: Date;
  studyPlan?: StudyPlan;
  files: GroupFile[];
  memberProgress: Record<
    string,
    {
      completedTasks: number;
      totalTasks: number;
      lastActive: Date;
    }
  >;
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "admin" | "member";
  joinedAt: Date;
  isActive: boolean;
}

export interface GroupFile {
  id: string;
  name: string;
  content: string;
  uploadedBy: string;
  uploadedAt: Date;
  size: number;
  type: string;
}

export interface NewGroupData {
  name: string;
  description: string;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  isPublic?: boolean;
}

export interface InputData {
  content: string;
  fileName?: string;
  hasFile: boolean;
}

// Utility function to ensure files are synced between group and study plan
export const synchronizeGroupFiles = (group: StudyGroup): StudyGroup => {
  if (group.studyPlan && group.files && group.files.length > 0) {
    // Ensure study plan files array is initialized
    if (!group.studyPlan.files) {
      group.studyPlan.files = [];
    }

    // Map file IDs for quick lookup
    const studyPlanFileIds = new Set(
      group.studyPlan.files.map((file: any) => file.id)
    );

    // Add any missing files from group.files to studyPlan.files
    group.files.forEach((file: GroupFile) => {
      if (!studyPlanFileIds.has(file.id) && group.studyPlan?.files) {
        group.studyPlan.files.push({
          id: file.id,
          name: file.name,
          content: file.content,
          addedAt: file.uploadedAt,
        });
      }
    });
  }
  return group;
};
