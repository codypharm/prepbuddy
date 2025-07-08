import React from 'react';
import PlansPage from '../PlansPage';
import { StudyPlan } from '../../App';

interface DashboardPlansProps {
  studyPlans: StudyPlan[];
  onCreateNew: () => void;
  onViewPlan: (plan: StudyPlan) => void;
  onDeletePlan: (planId: string) => void;
}

const DashboardPlans: React.FC<DashboardPlansProps> = ({
  studyPlans,
  onCreateNew,
  onViewPlan,
  onDeletePlan,
}) => {
  return (
    <PlansPage
      studyPlans={studyPlans}
      onCreateNew={onCreateNew}
      onViewPlan={onViewPlan}
      onDeletePlan={onDeletePlan}
    />
  );
};

export default DashboardPlans;
