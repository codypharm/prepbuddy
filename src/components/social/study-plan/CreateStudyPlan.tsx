import React, { useState } from "react";
import { ArrowLeft, Save, Clock, BookOpen } from "lucide-react";
import { StudyGroup, StudyPlan } from "../types";

interface CreateStudyPlanProps {
  group: StudyGroup;
  onBack: () => void;
  onSave: (plan: StudyPlan) => void;
  onGeneratePlan: () => void;
}

const CreateStudyPlan: React.FC<CreateStudyPlanProps> = ({
  group,
  onBack,
  onSave,
  onGeneratePlan,
}) => {
  const [plan, setPlan] = useState<StudyPlan>({
    id: `plan-${Date.now()}`,
    topics: [group.topic || ""],
    createdAt: new Date(),
    title: "",
    description: "",
    difficulty: group.difficulty || "intermediate",
    duration: "4 weeks",
    schedule: [
      {
        day: 1,
        title: "Introduction",
        estimatedTime: "1 hour",
        tasks: ["Read introduction materials", "Set personal goals"],
        completed: false,
      },
    ],
    files: [],
    progress: {
      completedTasks: 0,
      totalTasks: 2,
      completedDays: 0,
      totalDays: 1,
    },
  } as StudyPlan);

  const handleAddDay = () => {
    setPlan((prev: StudyPlan) => ({
      ...prev,
      schedule: [
        ...(prev.schedule || []),
        {
          day: (prev.schedule?.length || 0) + 1,
          title: "",
          estimatedTime: "1 hour",
          tasks: [""],
          completed: false,
        },
      ],
    }));
  };

  const handleDayChange = (index: number, field: string, value: any) => {
    setPlan((prev: StudyPlan) => {
      const newSchedule = [...(prev.schedule || [])];
      newSchedule[index] = {
        ...newSchedule[index],
        [field]: value,
      };
      return { ...prev, schedule: newSchedule };
    });
  };

  const handleTaskChange = (
    dayIndex: number,
    taskIndex: number,
    value: string
  ) => {
    setPlan((prev: StudyPlan) => {
      const newSchedule = [...(prev.schedule || [])];
      const newTasks = [...(newSchedule[dayIndex].tasks || [])];
      newTasks[taskIndex] = value;
      newSchedule[dayIndex] = {
        ...newSchedule[dayIndex],
        tasks: newTasks,
      };
      return { ...prev, schedule: newSchedule };
    });
  };

  const handleAddTask = (dayIndex: number) => {
    setPlan((prev: StudyPlan) => {
      const newSchedule = [...(prev.schedule || [])];
      newSchedule[dayIndex] = {
        ...newSchedule[dayIndex],
        tasks: [...(newSchedule[dayIndex].tasks || []), ""],
      };
      return { ...prev, schedule: newSchedule };
    });
  };

  const handleRemoveTask = (dayIndex: number, taskIndex: number) => {
    setPlan((prev: StudyPlan) => {
      const newSchedule = [...(prev.schedule || [])];
      const newTasks = [...(newSchedule[dayIndex].tasks || [])];
      newTasks.splice(taskIndex, 1);
      newSchedule[dayIndex] = {
        ...newSchedule[dayIndex],
        tasks: newTasks,
      };
      return { ...prev, schedule: newSchedule };
    });
  };

  const handleRemoveDay = (dayIndex: number) => {
    setPlan((prev: StudyPlan) => {
      const newSchedule = [...(prev.schedule || [])].filter(
        (_, i) => i !== dayIndex
      );
      // Renumber days
      newSchedule.forEach((day, i) => {
        day.day = i + 1;
      });
      return { ...prev, schedule: newSchedule };
    });
  };

  const isValid = () => {
    return (
      plan.title.trim() !== "" &&
      plan.description.trim() !== "" &&
      plan.schedule &&
      plan.schedule.length > 0 &&
      plan.schedule.every(
        (day) =>
          day.title.trim() !== "" &&
          day.tasks &&
          day.tasks.length > 0 &&
          day.tasks.every((task) => task.trim() !== "")
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Group
        </button>
        <div className="flex space-x-3">
          <button
            onClick={onGeneratePlan}
            className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Generate Plan
          </button>
          <button
            onClick={() => isValid() && onSave(plan)}
            disabled={!isValid()}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors flex items-center disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Plan
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Plan Title
          </label>
          <input
            type="text"
            value={plan.title}
            onChange={(e) => setPlan({ ...plan, title: e.target.value })}
            placeholder="Enter study plan title"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={plan.description}
            onChange={(e) => setPlan({ ...plan, description: e.target.value })}
            placeholder="Describe the study plan goals and objectives"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Difficulty
            </label>
            <select
              value={plan.difficulty}
              onChange={(e) =>
                setPlan({ ...plan, difficulty: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration
            </label>
            <select
              value={plan.duration}
              onChange={(e) => setPlan({ ...plan, duration: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="1 week">1 week</option>
              <option value="2 weeks">2 weeks</option>
              <option value="4 weeks">4 weeks</option>
              <option value="8 weeks">8 weeks</option>
              <option value="12 weeks">12 weeks</option>
            </select>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            Study Schedule
          </h3>

          {plan.schedule?.map((day: any, dayIndex: number) => (
            <div
              key={dayIndex}
              className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Day {day.day}
                </h4>
                <button
                  onClick={() => handleRemoveDay(dayIndex)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                  disabled={plan.schedule?.length === 1}
                >
                  Remove Day
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Day Title
                  </label>
                  <input
                    type="text"
                    value={day.title}
                    onChange={(e) =>
                      handleDayChange(dayIndex, "title", e.target.value)
                    }
                    placeholder="Day title"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estimated Time
                  </label>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                    <input
                      type="text"
                      value={day.estimatedTime}
                      onChange={(e) =>
                        handleDayChange(
                          dayIndex,
                          "estimatedTime",
                          e.target.value
                        )
                      }
                      placeholder="e.g. 1 hour"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tasks
                </label>
                {day.tasks?.map((task: string, taskIndex: number) => (
                  <div key={taskIndex} className="flex items-center mb-2">
                    <input
                      type="text"
                      value={task}
                      onChange={(e) =>
                        handleTaskChange(dayIndex, taskIndex, e.target.value)
                      }
                      placeholder="Task description"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    />
                    <button
                      onClick={() => handleRemoveTask(dayIndex, taskIndex)}
                      className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      disabled={day.tasks?.length === 1}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleAddTask(dayIndex)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm mt-2"
                >
                  + Add Task
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={handleAddDay}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            + Add Day
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStudyPlan;
