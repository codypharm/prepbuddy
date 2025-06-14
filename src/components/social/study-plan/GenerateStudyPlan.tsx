import React, { useState } from "react";
import { ArrowLeft, Sparkles, FileText } from "lucide-react";
import { StudyGroup, StudyPlan } from "../types";

interface GenerateStudyPlanProps {
  group: StudyGroup;
  onBack: () => void;
  onPlanGenerated: (plan: StudyPlan) => void;
}

const GenerateStudyPlan: React.FC<GenerateStudyPlanProps> = ({
  group,
  onBack,
  onPlanGenerated,
}) => {
  const [formData, setFormData] = useState({
    topic: group.topic || "",
    difficulty: group.difficulty || "intermediate",
    duration: "4 weeks",
    additionalInfo: "",
    isGenerating: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormData((prev) => ({ ...prev, isGenerating: true }));

    // Simulate AI generation with a timeout
    setTimeout(() => {
      const generatedPlan: StudyPlan = {
        id: `plan-${Date.now()}`,
        title: `${formData.topic} Study Plan`,
        description: `A comprehensive study plan for ${formData.topic} at ${formData.difficulty} level, designed to be completed in ${formData.duration}.`,
        difficulty: formData.difficulty as any,
        duration: formData.duration,
        topics: [formData.topic],
        createdAt: new Date(),
        files: [],
        schedule: generateSampleSchedule(formData.duration, formData.topic),
        progress: {
          completedTasks: 0,
          totalTasks: 0, // Will be calculated below
          completedDays: 0,
          totalDays: 0 // Will be calculated below
        }
      };

      // Update progress with calculated values
      generatedPlan.progress.totalTasks = generatedPlan.schedule.reduce((sum, day) => sum + day.tasks.length, 0);
      generatedPlan.progress.totalDays = generatedPlan.schedule.length;
      
      setFormData((prev) => ({ ...prev, isGenerating: false }));
      onPlanGenerated(generatedPlan);
    }, 2000);
  };

  const generateSampleSchedule = (duration: string, topic: string) => {
    const weeks = parseInt(duration.split(" ")[0]) || 4;
    const days = weeks * 3; // 3 study days per week
    
    const schedule = Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      title: `${topic} - Day ${i + 1}`,
      estimatedTime: "1 hour",
      tasks: [
        `Read chapter ${Math.floor(i / 3) + 1} materials`,
        `Complete practice exercises for section ${(i % 3) + 1}`,
        `Review key concepts and take notes`,
      ],
      completed: false
    }));
    
    // Return the schedule
    
    return schedule;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Group
        </button>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl mb-6 border border-blue-100 dark:border-blue-900/30">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
          Generate Study Plan
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Let AI create a personalized study plan for your group based on your topic,
          difficulty level, and available study files.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Study Topic
          </label>
          <input
            type="text"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            placeholder="e.g. Machine Learning, Organic Chemistry, World History"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Difficulty Level
            </label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            >
              <option value="1 week">1 week</option>
              <option value="2 weeks">2 weeks</option>
              <option value="4 weeks">4 weeks</option>
              <option value="8 weeks">8 weeks</option>
              <option value="12 weeks">12 weeks</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Additional Information
          </label>
          <textarea
            name="additionalInfo"
            value={formData.additionalInfo}
            onChange={handleChange}
            placeholder="Any specific areas to focus on, learning goals, or other details that will help generate a better plan"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        {group.files && group.files.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Available Study Files
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
              {group.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <FileText className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {file.name}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              The AI will analyze these files to create a relevant study plan
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={formData.isGenerating || !formData.topic.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {formData.isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white dark:border-white mr-3"></div>
              Generating Study Plan...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Generate Study Plan
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default GenerateStudyPlan;
