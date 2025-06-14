import React, { useState, useEffect } from 'react';
import { Brain, MessageCircle, Send, BookOpen, Target, Lightbulb, HelpCircle, Sparkles, X, ArrowLeft } from 'lucide-react';
import { StudyPlan } from '../App';
import { AIService } from '../services/aiService';

interface AICoachingProps {
  studyPlans: StudyPlan[];
  currentPlan?: StudyPlan | null;
  currentDay?: number;
  currentTask?: string;
  onClose?: () => void;
  mode?: 'standalone' | 'contextual';
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  context?: {
    plan?: string;
    day?: number;
    task?: string;
  };
}

const AICoaching: React.FC<AICoachingProps> = ({ 
  studyPlans, 
  currentPlan, 
  currentDay, 
  currentTask, 
  onClose,
  mode = 'standalone'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatContext, setChatContext] = useState<string>('');

  // Initialize chat context when props change
  useEffect(() => {
    if (currentPlan && currentDay !== undefined && currentTask) {
      const dayData = currentPlan.schedule[currentDay - 1];
      const context = `
Study Plan: ${currentPlan.title}
Description: ${currentPlan.description}
Current Day: ${currentDay} - ${dayData?.title}
Current Task: ${currentTask}
Difficulty Level: ${currentPlan.difficulty}
Study Duration: ${currentPlan.duration}
Plan Topics: ${currentPlan.topics.join(', ')}
Study Material: ${currentPlan.files.map(f => f.content).join('\n').substring(0, 1500)}
      `;
      setChatContext(context);
      
      // Add welcome message for contextual mode
      if (mode === 'contextual' && messages.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          sender: 'ai',
          content: `Hi! I'm your AI learning coach. I can see you're working on "${currentTask}" from Day ${currentDay} of your ${currentPlan.title} study plan. I have access to your study materials and can help you understand this task better. What would you like to know?`,
          timestamp: new Date(),
          context: {
            plan: currentPlan.title,
            day: currentDay,
            task: currentTask
          }
        };
        setMessages([welcomeMessage]);
      }
    }
  }, [currentPlan, currentDay, currentTask, mode]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: newMessage,
      timestamp: new Date(),
      context: currentPlan && currentDay && currentTask ? {
        plan: currentPlan.title,
        day: currentDay,
        task: currentTask
      } : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    try {
      // Generate AI response using the real AI service
      const aiResponse = await AIService.generateCoachingResponse({
        question: newMessage,
        context: chatContext,
        studyPlan: currentPlan || undefined,
        currentTask: currentTask
      });
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: aiResponse,
        timestamp: new Date(),
        context: userMessage.context
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI coaching error:', error);
      
      // Enhanced fallback response
      const fallbackResponse = generateEnhancedFallbackResponse(newMessage, currentTask, currentPlan);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: fallbackResponse,
        timestamp: new Date(),
        context: userMessage.context
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateEnhancedFallbackResponse = (question: string, task?: string, plan?: StudyPlan | null): string => {
    const lowerQuestion = question.toLowerCase();
    
    // Context-aware responses based on the task and plan
    if (task && plan) {
      if (lowerQuestion.includes('how') || lowerQuestion.includes('what')) {
        return `Great question about "${task}"! Based on your ${plan.title} study plan, this task is designed to help you understand the key concepts step by step. Since you're studying at a ${plan.difficulty} level, I recommend breaking this down into smaller parts. Start by reviewing the main concepts from your study materials, then work through the task systematically. What specific aspect of this task would you like me to explain further?`;
      }
      
      if (lowerQuestion.includes('why') || lowerQuestion.includes('purpose') || lowerQuestion.includes('important')) {
        return `The purpose of "${task}" in your ${plan.title} study plan is to build your understanding progressively. This task connects to your overall learning goals by reinforcing the key topics: ${plan.topics.slice(0, 3).join(', ')}. It's strategically placed to prepare you for more advanced concepts later in your ${plan.duration} study journey. Each task builds on the previous ones to create a solid foundation of knowledge.`;
      }
      
      if (lowerQuestion.includes('difficult') || lowerQuestion.includes('hard') || lowerQuestion.includes('confused') || lowerQuestion.includes('stuck')) {
        return `I understand that "${task}" might feel challenging right now - that's completely normal for ${plan.difficulty} level material! When you're stuck, try these strategies: 1) Review the previous day's concepts first, 2) Break the task into smaller, manageable steps, 3) Look for examples in your study materials, 4) Connect this to the main topics you're learning: ${plan.topics.slice(0, 2).join(' and ')}. Remember, feeling challenged means you're growing! Take your time and don't hesitate to ask more specific questions.`;
      }
      
      if (lowerQuestion.includes('example') || lowerQuestion.includes('show me') || lowerQuestion.includes('demonstrate')) {
        return `For "${task}", examples are crucial for understanding! Based on your study materials in ${plan.title}, try to find real-world applications of the concepts you're learning. Look for patterns in your study content, create your own examples using the topics ${plan.topics.slice(0, 2).join(' and ')}, or try explaining the concept using analogies. Practice with different scenarios to deepen your understanding.`;
      }
      
      if (lowerQuestion.includes('remember') || lowerQuestion.includes('memorize') || lowerQuestion.includes('forget')) {
        return `For better retention of "${task}" concepts from your ${plan.title} study plan, try these proven techniques: 1) Use active recall by testing yourself on the key topics (${plan.topics.slice(0, 3).join(', ')}), 2) Create connections between new concepts and what you already know, 3) Use spaced repetition - review this material again tomorrow and next week, 4) Try teaching the concept to someone else. Understanding the 'why' behind concepts is more powerful than just memorizing facts!`;
      }
      
      if (lowerQuestion.includes('next') || lowerQuestion.includes('after') || lowerQuestion.includes('continue')) {
        return `After completing "${task}", you'll be ready to move forward in your ${plan.title} study plan! The next tasks will build on what you're learning now, so make sure you understand the core concepts before moving on. Your ${plan.duration} plan is designed to progress logically, so each completed task prepares you for the next challenge. Take time to review and consolidate your understanding before continuing.`;
      }
    }
    
    // General learning support responses
    if (lowerQuestion.includes('study') || lowerQuestion.includes('learn') || lowerQuestion.includes('method')) {
      return `Here are some effective strategies for your current study session: 1) Use active recall - test yourself frequently instead of just re-reading, 2) Make connections between new concepts and what you already know, 3) Take regular breaks using the Pomodoro technique (25 minutes focused study, 5-minute break), 4) Summarize what you've learned in your own words, 5) Ask yourself questions about the material. The key is active engagement rather than passive consumption!`;
    }
    
    if (lowerQuestion.includes('time') || lowerQuestion.includes('schedule') || lowerQuestion.includes('manage')) {
      return `Time management is crucial for effective learning! Based on your study plan, try to stick to the estimated time for each task, but prioritize understanding over speed. If you need more time on a particular concept, that's perfectly fine - it shows you're being thorough. Consider using the Pomodoro technique: 25 minutes of focused study, then a 5-minute break. This helps maintain concentration and prevents burnout.`;
    }
    
    if (lowerQuestion.includes('motivation') || lowerQuestion.includes('motivated') || lowerQuestion.includes('give up')) {
      return `I can see you're working hard on your studies, and that's truly commendable! Remember that learning is a journey with ups and downs - every expert was once a beginner who felt overwhelmed at times. Focus on progress, not perfection. Celebrate small wins, like completing each task or understanding a new concept. Your dedication to asking questions and seeking help shows you're on the right track. You've got this! 🌟`;
    }
    
    // Default encouraging and helpful response
    return `That's an excellent question! Your curiosity and willingness to ask questions is exactly what makes a great learner. Based on your current study progress, you're doing really well. Learning is all about building understanding step by step, and every question you ask brings you closer to mastery. Keep exploring, stay curious, and remember that the best way to learn is through active engagement with the material. What specific aspect would you like to dive deeper into?`;
  };

  const getSuggestedQuestions = () => {
    if (!currentTask) return [];
    
    return [
      `How do I approach "${currentTask}"?`,
      `What's the main concept in this task?`,
      `Can you give me an example for this?`,
      `Why is this task important?`,
      `What should I focus on here?`
    ];
  };

  const handleSuggestedQuestion = (question: string) => {
    setNewMessage(question);
  };

  if (mode === 'contextual') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white mr-3">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">AI Learning Coach</h3>
                <p className="text-sm text-gray-600">
                  {currentPlan && currentDay && `Day ${currentDay}: ${currentPlan.schedule[currentDay - 1]?.title}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Current Task Context */}
          {currentTask && (
            <div className="p-4 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center text-sm">
                <Target className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium">Current Task: </span>
                <span className="text-blue-700">{currentTask}</span>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map(message => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  message.sender === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {message.sender === 'ai' && (
                    <div className="flex items-center mb-2">
                      <Brain className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-xs font-medium text-gray-600">AI Coach</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg">
                  <div className="flex items-center">
                    <Brain className="h-4 w-4 mr-2 text-blue-600" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div className="px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-3">Quick questions to get started:</p>
              <div className="flex flex-wrap gap-2">
                {getSuggestedQuestions().map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me anything about this task..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isTyping}
              />
              <button 
                onClick={sendMessage}
                disabled={isTyping || !newMessage.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standalone mode (original dashboard view)
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Learning Coach</h1>
        <p className="text-gray-600">Get personalized help with your studies</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Contextual AI Coach</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Your AI coach is available when you're working on specific study tasks. 
            Open a study plan and click the help button next to any task to get personalized assistance!
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 text-sm">
              💡 <strong>Tip:</strong> The AI coach works best when you're actively studying. 
              It can help explain concepts, provide examples, and guide you through difficult tasks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICoaching;