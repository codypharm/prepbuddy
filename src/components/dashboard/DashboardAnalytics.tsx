import React from 'react';
import AnalyticsPage from '../AnalyticsPage';
import { StudyPlan } from '../../App';

interface DashboardAnalyticsProps {
  studyPlans: StudyPlan[];
}

const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  studyPlans,
}) => {
  return (
    <AnalyticsPage
      studyPlans={studyPlans}
    />
  );
};

export default DashboardAnalytics;
