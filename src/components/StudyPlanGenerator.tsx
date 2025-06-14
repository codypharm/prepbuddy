import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Calendar, Clock, Target, Sparkles, AlertCircle, Zap, Brain, CheckCircle, ExternalLink } from 'lucide-react';
import { StudyPlan } from '../App';
import { AIService } from '../services/aiService';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { useUsageStore } from '../stores/useUsageStore';
import LimitReachedModal from './LimitReachedModal';

interface StudyPlanGeneratorProps {
  inputData: {
    content: string;
    fileName?: string;
    hasFile: boolean;
  };
  onPlanGenerated: (plan: StudyPlan) => void;
  onBack: () => void;
}

const StudyPlanGenerator: React.FC<StudyPlanGeneratorProps> = ({
  inputData,
  onPlanGenerated,
  onBack,
}) => {
  const [preferences, setPreferences] = useState({
    duration: '2-weeks',
    studyTime: '1-hour',
    difficulty: 'intermediate',
    focusAreas: [] as string[],
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [contentAnalysis, setContentAnalysis] = useState<any>(null);
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');

  // Get subscription and usage data
  const { getCurrentPlan } = useSubscriptionStore();
  const { getUsage, incrementUsage } = useUsageStore();

  const steps = [
    'Analyzing content structure...',
    'Identifying key learning objectives...',
    'Creating personalized curriculum...',
    'Optimizing study schedule...',
    'Finalizing your AI-powered learning path...',
  ];

  useEffect(() => {
    // Analyze content when component mounts
    analyzeContent();
  }, []);

  const analyzeContent = async () => {
    try {
      const analysis = await AIService.analyzeContent(inputData.content);
      setContentAnalysis(analysis);
    } catch (error) {
      console.error('Content analysis failed:', error);
      // Continue without analysis - the app still works
    }
  };

  const generatePlan = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Check AI request limits before generating plan
      const currentPlan = getCurrentPlan();
      const usage = await getUsage();
      
      if (currentPlan.limits.aiRequests !== 'unlimited') {
        if (usage.aiRequests >= currentPlan.limits.aiRequests) {
          setLimitMessage(
            `You've reached your limit of ${currentPlan.limits.aiRequests} AI requests per month. ` +
            `Please upgrade your plan to generate more study plans.`
          );
          setShowLimitModal(true);
          setIsGenerating(false);
          return;
        }
      }
      
      // Simulate step-by-step progress with realistic timing
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      }

      // Generate study plan using real AI
      console.log('🤖 Calling AI service...');
      const aiPlan = await AIService.generateStudyPlan({
        content: inputData.content,
        duration: preferences.duration,
        studyTime: preferences.studyTime,
        difficulty: preferences.difficulty,
        contentType: inputData.hasFile ? 'file' : 'text',
        fileName: inputData.fileName,
      });

      // Convert AI response to our StudyPlan format
      const plan: StudyPlan = {
        id: Date.now().toString(),
        title: aiPlan.title,
        description: aiPlan.description,
        duration: preferences.duration,
        difficulty: preferences.difficulty,
        topics: aiPlan.topics,
        schedule: aiPlan.schedule,
        createdAt: new Date(),
      };

      // Track AI usage after successful generation
      await incrementUsage('aiRequests');
      
      console.log('✅ Study plan generated successfully!', plan);
      setIsGenerating(false);
      onPlanGenerated(plan);
    } catch (error) {
      console.error('❌ Study plan generation failed:', error);
      setIsGenerating(false);
      
      if (error instanceof Error && error.message.includes('limit')) {
        setLimitMessage(error.message);
        setShowLimitModal(true);
      } else {
        setError(error instanceof Error ? error.message : 'Failed to generate study plan');
      }
    }
  };

  const retryGeneration = () => {
    setError(null);
    generatePlan();
  };

  const hasApiKeys = () => {
    return !!(
      import.meta.env.VITE_GROQ_API_KEY ||
      import.meta.env.VITE_TOGETHER_API_KEY ||
      import.meta.env.VITE_OPENROUTER_API_KEY
    );
  };

  if (error) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to input
          </button>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Generation Issue</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            
            {!hasApiKeys() && (
              <div className="bg-blue-50 p-6 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Get Better Results with Free AI</h3>
                <p className="text-blue-700 text-sm mb-4">
                  For the best AI-generated study plans, add a free API key from Groq, Together AI, or OpenRouter.
                </p>
                <button
                  onClick={() => setShowApiSetup(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center justify-center"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Setup Free AI (2 minutes)
                </button>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <button
                onClick={retryGeneration}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Try Again
              </button>
              <button
                onClick={onBack}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showApiSetup) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setShowApiSetup(false)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Setup Free AI (2 minutes)</h2>
              <p className="text-gray-600">
                Get much better AI-generated study plans with these free services
              </p>
            </div>

            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium mr-3">
                      RECOMMENDED
                    </div>
                    <h3 className="font-semibold text-gray-900">Groq API</h3>
                  </div>
                  <span className="text-green-600 font-medium">100 requests/day FREE</span>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Fast Llama 3 model, perfect for study plans. Best performance.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Steps:</p>
                  <ol className="text-sm text-gray-600 space-y-1">
                    <li>1. Visit <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">console.groq.com</a></li>
                    <li>2. Sign up for free</li>
                    <li>3. Go to API Keys section</li>
                    <li>4. Create new API key</li>
                    <li>5. Add to your .env file: VITE_GROQ_API_KEY=your_key</li>
                  </ol>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Together AI</h3>
                  <span className="text-blue-600 font-medium">Free tier available</span>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Access to Mixtral and other powerful models.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Steps:</p>
                  <ol className="text-sm text-gray-600 space-y-1">
                    <li>1. Visit <a href="https://api.together.xyz/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">api.together.xyz</a></li>
                    <li>2. Sign up for free</li>
                    <li>3. Get your API key</li>
                    <li>4. Add to .env: VITE_TOGETHER_API_KEY=your_key</li>
                  </ol>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">OpenRouter</h3>
                  <span className="text-purple-600 font-medium">Multiple free models</span>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Access to various free AI models in one place.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Steps:</p>
                  <ol className="text-sm text-gray-600 space-y-1">
                    <li>1. Visit <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">openrouter.ai</a></li>
                    <li>2. Sign up for free</li>
                    <li>3. Get your API key</li>
                    <li>4. Add to .env: VITE_OPENROUTER_API_KEY=your_key</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                Why use real AI?
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Analyzes your actual content, not generic templates</li>
                <li>• Creates specific tasks based on your material</li>
                <li>• Adapts to your learning style and difficulty level</li>
                <li>• Provides much more personalized study plans</li>
              </ul>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowApiSetup(false)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                I'll Set This Up Later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to input
        </button>

        {!isGenerating ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Customize Your PrepBuddy Plan</h2>
              <p className="text-gray-600">
                Configure your preferences for the most personalized study experience
              </p>
              <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
                {hasApiKeys() ? (
                  <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Real AI Enabled
                  </div>
                ) : (
                  <button
                    onClick={() => setShowApiSetup(true)}
                    className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    Setup Free AI
                  </button>
                )}
                <div className="flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                  <Brain className="h-4 w-4 mr-1" />
                  Smart Fallbacks
                </div>
              </div>
            </div>

            {contentAnalysis && (
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-blue-600" />
                  Content Analysis
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Content Type: </span>
                    <span className="text-blue-600">{contentAnalysis.contentType}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Word Count: </span>
                    <span className="text-blue-600">{contentAnalysis.wordCount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Complexity: </span>
                    <span className="capitalize text-blue-600">{contentAnalysis.complexity}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Reading Time: </span>
                    <span className="text-blue-600">{contentAnalysis.estimatedReadingTime}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="font-medium text-gray-700">Key Topics: </span>
                  <span className="text-gray-600">{contentAnalysis.topics.join(', ')}</span>
                </div>
                {inputData.fileName && (
                  <div className="mt-2">
                    <span className="font-medium text-gray-700">Source: </span>
                    <span className="text-gray-600">{inputData.fileName}</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-8">
              <div>
                <label className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Study Duration
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: '1-week', label: '1 Week', desc: 'Intensive' },
                    { value: '2-weeks', label: '2 Weeks', desc: 'Balanced' },
                    { value: '1-month', label: '1 Month', desc: 'Comprehensive' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPreferences(prev => ({ ...prev, duration: option.value }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        preferences.duration === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                  <Clock className="h-5 w-5 mr-2 text-green-600" />
                  Daily Study Time
                </label>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { value: '30-min', label: '30 min' },
                    { value: '1-hour', label: '1 hour' },
                    { value: '2-hours', label: '2 hours' },
                    { value: '3-hours', label: '3+ hours' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPreferences(prev => ({ ...prev, studyTime: option.value }))}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                        preferences.studyTime === option.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                  <Target className="h-5 w-5 mr-2 text-purple-600" />
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'beginner', label: 'Beginner', desc: 'New to topic' },
                    { value: 'intermediate', label: 'Intermediate', desc: 'Some experience' },
                    { value: 'advanced', label: 'Advanced', desc: 'Experienced' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPreferences(prev => ({ ...prev, difficulty: option.value }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        preferences.difficulty === option.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={generatePlan}
              className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              <Sparkles className="h-6 w-6 mr-2" />
              {hasApiKeys() ? 'Generate AI Study Plan' : 'Generate Smart Study Plan'}
            </button>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              {hasApiKeys() 
                ? '🤖 Using real AI for personalized content analysis'
                : '🧠 Using intelligent algorithms with smart fallbacks'
              }
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="mb-8">
              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {hasApiKeys() ? 'PrepBuddy AI is Creating Your Study Plan' : 'PrepBuddy is Creating Your Smart Study Plan'}
              </h2>
              <p className="text-gray-600 text-lg mb-8">
                {hasApiKeys() 
                  ? 'Our AI is analyzing your content and generating a personalized learning path'
                  : 'Our intelligent system is analyzing your content and creating an optimized study plan'
                }
              </p>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className={`flex items-center justify-center p-4 rounded-lg transition-all duration-300 ${
                    index <= currentStep
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                    index < currentStep
                      ? 'bg-green-500 text-white'
                      : index === currentStep
                      ? 'bg-blue-500 text-white animate-pulse'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  <span className="font-medium">{step}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {hasApiKeys() 
                  ? '🤖 Real AI is analyzing your content for maximum personalization'
                  : '🧠 Advanced algorithms are creating your optimized learning path'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Limit Modal */}
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        message={limitMessage}
        featureName="AI Requests"
        currentPlan={getCurrentPlan().name}
      />
    </div>
  );
};

export default StudyPlanGenerator;