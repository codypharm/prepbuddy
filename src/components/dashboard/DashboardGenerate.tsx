import React from 'react';
import StudyPlanGenerator from '../StudyPlanGenerator';
import { StudyPlan } from '../../App';

interface DashboardGenerateProps {
  inputData: {
    content: string;
    fileName?: string;
    hasFile: boolean;
  } | null;
  onPlanGenerated: (plan: StudyPlan) => void;
  onBack: () => void;
}

const DashboardGenerate: React.FC<DashboardGenerateProps> = ({
  inputData,
  onPlanGenerated,
  onBack,
}) => {
  if (!inputData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">
          No input data available. Please go back to create a study plan.
        </p>
        <button
          onClick={onBack}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Back to Create
        </button>
      </div>
    );
  }

  return (
    <StudyPlanGenerator
      inputData={inputData}
      onPlanGenerated={onPlanGenerated}
      onBack={onBack}
    />
  );
};

export default DashboardGenerate;
