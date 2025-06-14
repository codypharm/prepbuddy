import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StudyGroup, synchronizeGroupFiles } from './types';

interface StudyGroupContextType {
  studyGroups: StudyGroup[];
  setStudyGroups: React.Dispatch<React.SetStateAction<StudyGroup[]>>;
  selectedGroup: StudyGroup | null;
  setSelectedGroup: React.Dispatch<React.SetStateAction<StudyGroup | null>>;
}

const StudyGroupContext = createContext<StudyGroupContextType | undefined>(undefined);

export const StudyGroupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);

  // Load groups from localStorage
  useEffect(() => {
    const savedGroups = localStorage.getItem("prepbuddy-study-groups");
    if (savedGroups) {
      try {
        const groupsJson = savedGroups;
        // Parse the groups and convert string dates back to Date objects
        const groups = JSON.parse(groupsJson).map((group: any) => {
          const parsedGroup = {
            ...group,
            createdAt: new Date(group.createdAt),
            lastActivity: new Date(group.lastActivity),
            members: group.members.map((member: any) => ({
              ...member,
              joinedAt: new Date(member.joinedAt),
            })),
            files: group.files
              ? group.files.map((file: any) => ({
                  ...file,
                  uploadedAt: new Date(file.uploadedAt),
                }))
              : [],
            studyPlan: group.studyPlan
              ? {
                  ...group.studyPlan,
                  createdAt: new Date(group.studyPlan.createdAt),
                  files: Array.isArray(group.studyPlan.files)
                    ? group.studyPlan.files.map((file: any) => ({
                        ...file,
                        addedAt: new Date(file.addedAt),
                      }))
                    : [],
                }
              : undefined,
            memberProgress: group.memberProgress || {},
          };
          // Ensure files are synced between group and study plan
          return synchronizeGroupFiles(parsedGroup);
        });
        setStudyGroups(groups);
      } catch (error) {
        console.error("Failed to load study groups:", error);
      }
    }
  }, []);

  // Save groups to localStorage
  useEffect(() => {
    if (studyGroups.length > 0) {
      // Synchronize files between groups and their study plans
      const groupsToSave = studyGroups.map((group) =>
        synchronizeGroupFiles(group)
      );

      localStorage.setItem(
        "prepbuddy-study-groups",
        JSON.stringify(groupsToSave)
      );
    }
  }, [studyGroups]);

  return (
    <StudyGroupContext.Provider value={{ studyGroups, setStudyGroups, selectedGroup, setSelectedGroup }}>
      {children}
    </StudyGroupContext.Provider>
  );
};

export const useStudyGroups = () => {
  const context = useContext(StudyGroupContext);
  if (context === undefined) {
    throw new Error('useStudyGroups must be used within a StudyGroupProvider');
  }
  return context;
};
