// Real AI Service using free providers
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { useUsageStore } from '../stores/useUsageStore';

export interface StudyPlanRequest {
  content: string;
  duration: string;
  studyTime: string;
  difficulty: string;
  contentType: 'file' | 'text';
  fileName?: string;
}

export interface QuizRequest {
  content: string;
  topic: string;
  difficulty: string;
  questionCount: number;
}

export interface GeneratedStudyPlan {
  title: string;
  description: string;
  topics: string[];
  schedule: Array<{
    day: number;
    title: string;
    tasks: string[];
    estimatedTime: string;
  }>;
}

export interface GeneratedQuiz {
  id: string;
  title: string;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>;
  passingScore: number;
}

export class AIService {
  // Using Groq (Free tier available)
  private static readonly GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  
  // Alternative: Using Together AI (Free tier)
  private static readonly TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions';

  // Main method to generate study plan
  static async generateStudyPlan(request: StudyPlanRequest): Promise<GeneratedStudyPlan> {
    console.log('🤖 Starting AI study plan generation...');
    
    // Check subscription limits before proceeding
    await this.checkAIRequestLimits();
    
    try {
      // Try free AI providers in order
      const providers = [
        () => this.useGroqAPI(request),
        () => this.useTogetherAPI(request),
        () => this.useOpenRouterAPI(request)
      ];

      for (const provider of providers) {
        try {
          const result = await provider();
          console.log('✅ AI generation successful!');
          
          // Track AI usage after successful generation
          await this.trackAIUsage();
          
          return result;
        } catch (error) {
          console.warn('❌ Provider failed, trying next:', error);
          continue;
        }
      }

      throw new Error('All AI providers failed');
    } catch (error) {
      console.error('🔄 All AI providers failed, using enhanced fallback');
      
      // Still track usage even when using fallback
      await this.trackAIUsage();
      
      return this.generateEnhancedFallback(request);
    }
  }

  // Main method to generate quiz
  static async generateQuiz(request: QuizRequest): Promise<GeneratedQuiz> {
    console.log('🧠 Starting AI quiz generation...');
    
    // Check subscription limits before proceeding
    await this.checkAIRequestLimits();
    
    try {
      // Try free AI providers in order
      const providers = [
        () => this.useGroqAPIForQuiz(request),
        () => this.useTogetherAPIForQuiz(request),
        () => this.useOpenRouterAPIForQuiz(request)
      ];

      for (const provider of providers) {
        try {
          const result = await provider();
          console.log('✅ Quiz generation successful!');
          
          // Track AI usage after successful generation
          await this.trackAIUsage();
          
          return result;
        } catch (error) {
          console.warn('❌ Provider failed, trying next:', error);
          continue;
        }
      }

      throw new Error('All AI providers failed');
    } catch (error) {
      console.error('🔄 All AI providers failed, using fallback quiz');
      
      // Still track usage even when using fallback
      await this.trackAIUsage();
      
      return this.generateFallbackQuiz(request);
    }
  }

  // New method for AI coaching
  static async generateCoachingResponse(request: {
    question: string;
    context: string;
    studyPlan?: StudyPlan;
    currentTask?: string;
  }): Promise<string> {
    console.log('🤖 Generating AI coaching response...');
    
    // Check subscription limits before proceeding
    await this.checkAIRequestLimits();
    
    try {
      // Try free AI providers in order
      const providers = [
        () => this.useGroqAPIForCoaching(request),
        () => this.useTogetherAPIForCoaching(request),
        () => this.useOpenRouterAPIForCoaching(request)
      ];

      for (const provider of providers) {
        try {
          const result = await provider();
          console.log('✅ AI coaching response generated!');
          
          // Track AI usage after successful generation
          await this.trackAIUsage();
          
          return result;
        } catch (error) {
          console.warn('❌ Provider failed, trying next:', error);
          continue;
        }
      }

      throw new Error('All AI providers failed');
    } catch (error) {
      console.error('🔄 All AI providers failed, using enhanced fallback');
      
      // Still track usage even when using fallback
      await this.trackAIUsage();
      
      return this.generateEnhancedCoachingFallback(request);
    }
  }

  // Check if user has reached their AI request limit
  private static async checkAIRequestLimits(): Promise<void> {
    // Get the subscription store state
    const { getCurrentPlan, isSubscribed } = useSubscriptionStore.getState();
    const { getUsage, incrementUsage } = useUsageStore.getState();
    
    const currentPlan = getCurrentPlan();
    const usage = await getUsage();
    
    // Skip check for unlimited plans
    if (currentPlan.limits.aiRequests === 'unlimited') {
      return;
    }
    
    // Check if user has reached their limit
    if (usage.aiRequests >= currentPlan.limits.aiRequests) {
      throw new Error(
        `You've reached your monthly limit of ${currentPlan.limits.aiRequests} AI requests. ` +
        `Please upgrade your plan to continue using AI features.`
      );
    }
  }

  // Track AI usage
  private static async trackAIUsage(): Promise<void> {
    try {
      const { incrementUsage } = useUsageStore.getState();
      await incrementUsage('aiRequests');
    } catch (error) {
      console.error('Failed to track AI usage:', error);
      // Don't throw - we don't want to block the user if tracking fails
    }
  }

  // Groq API for Study Plans
  private static async useGroqAPI(request: StudyPlanRequest): Promise<GeneratedStudyPlan> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Groq API key not configured');
    }

    console.log('🚀 Trying Groq API with Llama 3...');

    const prompt = this.buildDetailedPrompt(request);
    
    const response = await fetch(this.GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // Free model
        messages: [
          {
            role: 'system',
            content: `You are an expert educational consultant and curriculum designer. You create detailed, personalized study plans based on content analysis. Always respond with valid JSON only, no additional text.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 16384,
        top_p: 1,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from Groq API');
    }

    try {
      const parsed = JSON.parse(content);
      return this.validateAndFormatPlan(parsed, request);
    } catch (parseError) {
      console.error('Failed to parse Groq response:', content);
      throw new Error('Invalid JSON response from Groq');
    }
  }

  // Groq API for Quiz Generation
  private static async useGroqAPIForQuiz(request: QuizRequest): Promise<GeneratedQuiz> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Groq API key not configured');
    }

    const prompt = this.buildQuizPrompt(request);
    
    const response = await fetch(this.GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are an expert quiz creator. Generate educational quizzes in valid JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 8192,
        top_p: 1,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from Groq API');
    }

    try {
      const parsed = JSON.parse(content);
      return this.validateAndFormatQuiz(parsed, request);
    } catch (parseError) {
      throw new Error('Invalid JSON response from Groq');
    }
  }

  // Groq API for Coaching
  private static async useGroqAPIForCoaching(request: {
    question: string;
    context: string;
    studyPlan?: StudyPlan;
    currentTask?: string;
  }): Promise<string> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Groq API key not configured');
    }

    const prompt = this.buildCoachingPrompt(request);
    
    const response = await fetch(this.GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are an expert learning coach and tutor. Provide helpful, educational responses that encourage understanding and learning. Be conversational, supportive, and focus on helping the student learn effectively.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from Groq API');
    }

    return content.trim();
  }

  // Together AI (Free tier available)
  private static async useTogetherAPI(request: StudyPlanRequest): Promise<GeneratedStudyPlan> {
    const apiKey = import.meta.env.VITE_TOGETHER_API_KEY;
    if (!apiKey) {
      throw new Error('Together API key not configured');
    }

    console.log('🚀 Trying Together AI...');

    const prompt = this.buildDetailedPrompt(request);
    
    const response = await fetch(this.TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1', // Free model
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational consultant. Create detailed study plans in JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 16384,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Together API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from Together API');
    }

    try {
      const parsed = JSON.parse(content);
      return this.validateAndFormatPlan(parsed, request);
    } catch (parseError) {
      console.error('Failed to parse Together response:', content);
      throw new Error('Invalid JSON response from Together');
    }
  }

  // Together AI for Quiz
  private static async useTogetherAPIForQuiz(request: QuizRequest): Promise<GeneratedQuiz> {
    const apiKey = import.meta.env.VITE_TOGETHER_API_KEY;
    if (!apiKey) {
      throw new Error('Together API key not configured');
    }

    const prompt = this.buildQuizPrompt(request);
    
    const response = await fetch(this.TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        messages: [
          {
            role: 'system',
            content: 'You are an expert quiz creator. Generate educational quizzes in valid JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      throw new Error(`Together API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from Together API');
    }

    try {
      const parsed = JSON.parse(content);
      return this.validateAndFormatQuiz(parsed, request);
    } catch (parseError) {
      throw new Error('Invalid JSON response from Together');
    }
  }

  // Together AI for Coaching
  private static async useTogetherAPIForCoaching(request: {
    question: string;
    context: string;
    studyPlan?: StudyPlan;
    currentTask?: string;
  }): Promise<string> {
    const apiKey = import.meta.env.VITE_TOGETHER_API_KEY;
    if (!apiKey) {
      throw new Error('Together API key not configured');
    }

    const prompt = this.buildCoachingPrompt(request);
    
    const response = await fetch(this.TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        messages: [
          {
            role: 'system',
            content: 'You are an expert learning coach and tutor. Provide helpful, educational responses that encourage understanding and learning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`Together API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from Together API');
    }

    return content.trim();
  }

  // OpenRouter (Free tier with some models)
  private static async useOpenRouterAPI(request: StudyPlanRequest): Promise<GeneratedStudyPlan> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    console.log('🚀 Trying OpenRouter...');

    const prompt = this.buildDetailedPrompt(request);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'PrepBuddy AI'
      },
      body: JSON.stringify({
        model: 'microsoft/wizardlm-2-8x22b', // Free model
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational consultant. Create detailed study plans in JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 16384,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenRouter API');
    }

    try {
      const parsed = JSON.parse(content);
      return this.validateAndFormatPlan(parsed, request);
    } catch (parseError) {
      console.error('Failed to parse OpenRouter response:', content);
      throw new Error('Invalid JSON response from OpenRouter');
    }
  }

  // OpenRouter for Quiz
  private static async useOpenRouterAPIForQuiz(request: QuizRequest): Promise<GeneratedQuiz> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const prompt = this.buildQuizPrompt(request);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'PrepBuddy AI'
      },
      body: JSON.stringify({
        model: 'microsoft/wizardlm-2-8x22b',
        messages: [
          {
            role: 'system',
            content: 'You are an expert quiz creator. Generate educational quizzes in valid JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenRouter API');
    }

    try {
      const parsed = JSON.parse(content);
      return this.validateAndFormatQuiz(parsed, request);
    } catch (parseError) {
      throw new Error('Invalid JSON response from OpenRouter');
    }
  }

  // OpenRouter for Coaching
  private static async useOpenRouterAPIForCoaching(request: {
    question: string;
    context: string;
    studyPlan?: StudyPlan;
    currentTask?: string;
  }): Promise<string> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const prompt = this.buildCoachingPrompt(request);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'PrepBuddy AI Coach'
      },
      body: JSON.stringify({
        model: 'microsoft/wizardlm-2-8x22b',
        messages: [
          {
            role: 'system',
            content: 'You are an expert learning coach and tutor. Provide helpful, educational responses that encourage understanding and learning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenRouter API');
    }

    return content.trim();
  }

  // Build quiz prompt
  private static buildQuizPrompt(request: QuizRequest): string {
    const contentPreview = request.content.substring(0, 2000);
    
    return `Create a ${request.difficulty} level quiz about "${request.topic}" based on this content:

CONTENT:
"${contentPreview}${request.content.length > 2000 ? '...' : ''}"

REQUIREMENTS:
- Generate exactly ${request.questionCount} multiple choice questions
- Each question should have 4 options
- Questions should test understanding, not just memorization
- Include explanations for correct answers
- Difficulty level: ${request.difficulty}
- Focus on the topic: ${request.topic}

Respond with ONLY valid JSON in this exact format:
{
  "id": "quiz-${Date.now()}",
  "title": "${request.topic} Quiz",
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation of why this is correct"
    }
  ],
  "passingScore": 70
}`;
  }

  // Build coaching prompt
  private static buildCoachingPrompt(request: {
    question: string;
    context: string;
    studyPlan?: StudyPlan;
    currentTask?: string;
  }): string {
    return `You are an expert learning coach helping a student with their studies.

STUDY CONTEXT:
${request.context}

CURRENT TASK: ${request.currentTask || 'General study question'}

STUDENT QUESTION: "${request.question}"

Please provide a helpful, educational response that:
1. Directly addresses their question about the current task
2. Explains concepts clearly and simply
3. Provides practical learning strategies
4. Encourages deeper understanding
5. Is supportive and motivating
6. Relates to their specific study material when possible

Keep your response conversational, encouraging, and focused on helping them learn effectively. Aim for 2-3 paragraphs maximum.`;
  }

  // Build a detailed prompt for AI
  private static buildDetailedPrompt(request: StudyPlanRequest): string {
    const durationDays = this.getDurationDays(request.duration);
    const contentPreview = request.content.substring(0, 1000);
    
    return `Analyze this study content and create a personalized study plan:

CONTENT TO ANALYZE:
"${contentPreview}${request.content.length > 1000 ? '...' : ''}"

REQUIREMENTS:
- Duration: ${durationDays} days
- Daily study time: ${request.studyTime}
- Difficulty level: ${request.difficulty}
- Content type: ${request.contentType}
${request.fileName ? `- Source file: ${request.fileName}` : ''}

Create a comprehensive study plan that:
1. Analyzes the content to identify key topics and concepts
2. Structures learning in a logical progression
3. Includes specific, actionable daily tasks
4. Adapts to the specified difficulty level
5. Fits within the daily time commitment

Respond with ONLY valid JSON in this exact format:
{
  "title": "Descriptive title based on the content",
  "description": "Brief description of what the plan covers",
  "topics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "schedule": [
    {
      "day": 1,
      "title": "Specific day title based on content",
      "tasks": ["specific task 1", "specific task 2", "specific task 3", "specific task 4"],
      "estimatedTime": "${request.studyTime}"
    }
  ]
}

Make sure to:
- Extract actual topics from the provided content
- Create specific tasks related to the content
- Progress logically from basic to advanced concepts
- Include review and practice activities
- Make tasks actionable and measurable`;
  }

  // Validate and format the AI response
  private static validateAndFormatPlan(aiResponse: any, request: StudyPlanRequest): GeneratedStudyPlan {
    const durationDays = this.getDurationDays(request.duration);
    
    // Ensure we have the required structure
    const plan: GeneratedStudyPlan = {
      title: aiResponse.title || `Study Plan for ${request.fileName || 'Your Content'}`,
      description: aiResponse.description || 'AI-generated personalized study plan',
      topics: Array.isArray(aiResponse.topics) ? aiResponse.topics.slice(0, 8) : this.extractTopicsFromContent(request.content),
      schedule: []
    };

    // Validate and format schedule
    if (Array.isArray(aiResponse.schedule) && aiResponse.schedule.length > 0) {
      plan.schedule = aiResponse.schedule.slice(0, durationDays).map((day: any, index: number) => ({
        day: index + 1,
        title: day.title || `Day ${index + 1}`,
        tasks: Array.isArray(day.tasks) ? day.tasks.slice(0, 6) : [`Study session ${index + 1}`],
        estimatedTime: request.studyTime
      }));
    }

    // Fill remaining days if needed
    while (plan.schedule.length < durationDays) {
      const dayNum = plan.schedule.length + 1;
      const topicIndex = Math.floor((dayNum - 1) / Math.ceil(durationDays / plan.topics.length));
      const currentTopic = plan.topics[topicIndex] || plan.topics[0] || 'Study Material';
      
      plan.schedule.push({
        day: dayNum,
        title: `${currentTopic} - Day ${dayNum}`,
        tasks: this.generateTasksForDay(dayNum, currentTopic, 4, request.difficulty),
        estimatedTime: request.studyTime
      });
    }

    return plan;
  }

  // Validate and format quiz
  private static validateAndFormatQuiz(aiResponse: any, request: QuizRequest): GeneratedQuiz {
    const quiz: GeneratedQuiz = {
      id: aiResponse.id || `quiz-${Date.now()}`,
      title: aiResponse.title || `${request.topic} Quiz`,
      questions: [],
      passingScore: aiResponse.passingScore || 70
    };

    // Validate questions
    if (Array.isArray(aiResponse.questions)) {
      quiz.questions = aiResponse.questions.slice(0, request.questionCount).map((q: any, index: number) => ({
        id: q.id || `q${index + 1}`,
        question: q.question || `Question ${index + 1}`,
        options: Array.isArray(q.options) ? q.options.slice(0, 4) : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
        explanation: q.explanation || 'No explanation provided'
      }));
    }

    // Fill missing questions if needed
    while (quiz.questions.length < request.questionCount) {
      const index = quiz.questions.length;
      quiz.questions.push({
        id: `q${index + 1}`,
        question: `What is an important concept related to ${request.topic}?`,
        options: [
          'Understanding the fundamentals',
          'Memorizing without context',
          'Skipping difficult parts',
          'Avoiding practice'
        ],
        correctAnswer: 0,
        explanation: 'Understanding fundamentals is crucial for mastering any topic.'
      });
    }

    return quiz;
  }

  // Generate fallback quiz
  private static generateFallbackQuiz(request: QuizRequest): GeneratedQuiz {
    const topics = this.extractTopicsFromContent(request.content).slice(0, 3);
    
    return {
      id: `quiz-${Date.now()}`,
      title: `${request.topic} Quiz`,
      questions: [
        {
          id: 'q1',
          question: `What is the main focus of "${request.topic}"?`,
          options: [
            'Understanding core concepts and principles',
            'Memorizing facts without context',
            'Skipping challenging material',
            'Rushing through content'
          ],
          correctAnswer: 0,
          explanation: 'The main focus should be understanding core concepts to build a solid foundation.'
        },
        {
          id: 'q2',
          question: 'Which study approach is most effective for long-term retention?',
          options: [
            'Passive reading only',
            'Active recall and spaced repetition',
            'Highlighting everything',
            'Cramming before tests'
          ],
          correctAnswer: 1,
          explanation: 'Active recall and spaced repetition are scientifically proven to enhance long-term retention.'
        },
        {
          id: 'q3',
          question: `Based on the content, what is a key topic in ${request.topic}?`,
          options: [
            topics[0] || 'Fundamental concepts',
            'Unrelated information',
            'Random facts',
            'Irrelevant details'
          ],
          correctAnswer: 0,
          explanation: `${topics[0] || 'Fundamental concepts'} is identified as a key topic from your study material.`
        }
      ],
      passingScore: 70
    };
  }

  // Enhanced fallback for coaching
  private static generateEnhancedCoachingFallback(request: {
    question: string;
    context: string;
    studyPlan?: StudyPlan;
    currentTask?: string;
  }): string {
    const { question, currentTask } = request;
    const lowerQuestion = question.toLowerCase();
    
    // Context-aware responses based on the task
    if (currentTask) {
      if (lowerQuestion.includes('how') || lowerQuestion.includes('what')) {
        return `Great question about "${currentTask}"! Let me help you break this down step by step. This task is designed to build your understanding progressively. Start by identifying the key concepts, then connect them to what you've already learned. Try to approach it systematically - read through the material first, take notes on the main points, and then work through any examples. What specific part of this task would you like me to explain further?`;
      }
      
      if (lowerQuestion.includes('why') || lowerQuestion.includes('purpose') || lowerQuestion.includes('important')) {
        return `The purpose of "${currentTask}" is to strengthen your understanding of the core concepts in your study plan. This task is strategically placed to build on previous knowledge and prepare you for more advanced topics. It helps you develop critical thinking skills and ensures you truly understand the material rather than just memorizing it. Think of each task as a building block - mastering this one will make the next tasks much easier!`;
      }
      
      if (lowerQuestion.includes('difficult') || lowerQuestion.includes('hard') || lowerQuestion.includes('confused') || lowerQuestion.includes('stuck')) {
        return `I understand that "${currentTask}" might feel challenging right now - that's completely normal and actually a good sign that you're pushing your learning boundaries! When something feels difficult, try breaking it into smaller, manageable pieces. Review the previous concepts first, look for patterns or connections, and don't hesitate to research examples online. Remember, confusion is often the first step toward understanding. Take your time, and celebrate small wins along the way!`;
      }
      
      if (lowerQuestion.includes('example') || lowerQuestion.includes('show me') || lowerQuestion.includes('demonstrate')) {
        return `For "${currentTask}", examples are a great way to solidify your understanding! Try looking for real-world applications of the concepts you're studying. Create your own examples based on the material, or search for case studies related to your topic. Practice explaining the concept using different examples - this active approach will significantly deepen your understanding and help you remember the material better.`;
      }
      
      if (lowerQuestion.includes('remember') || lowerQuestion.includes('memorize') || lowerQuestion.includes('forget')) {
        return `For better retention of "${currentTask}" concepts, try these proven techniques: Use active recall by testing yourself frequently, create mental associations or mnemonics, practice spaced repetition, and most importantly, try to understand the 'why' behind the concepts rather than just memorizing facts. Teaching the concept to someone else (or even explaining it out loud to yourself) is one of the most effective ways to cement your understanding!`;
      }
    }
    
    // General learning support responses
    if (lowerQuestion.includes('study') || lowerQuestion.includes('learn') || lowerQuestion.includes('method')) {
      return `Here are some effective strategies for your current study session: 1) Use active recall - test yourself frequently instead of just re-reading, 2) Make connections between new concepts and what you already know, 3) Take regular breaks using the Pomodoro technique (25 minutes focused study, 5-minute break), 4) Summarize what you've learned in your own words. The key is active engagement rather than passive consumption of information!`;
    }
    
    if (lowerQuestion.includes('time') || lowerQuestion.includes('schedule') || lowerQuestion.includes('manage')) {
      return `Time management is crucial for effective learning! Based on your study plan, try to stick to the estimated time for each task, but don't rush through the material. Quality understanding is more important than speed. If you need more time on a particular concept, that's perfectly fine - it shows you're being thorough. Consider using techniques like time-blocking and the Pomodoro method to maintain focus and avoid burnout.`;
    }
    
    if (lowerQuestion.includes('motivation') || lowerQuestion.includes('motivated') || lowerQuestion.includes('give up')) {
      return `I can see you're working hard on your studies, and that's commendable! Remember that learning is a journey with ups and downs - every expert was once a beginner who felt overwhelmed at times. Focus on progress, not perfection. Celebrate small wins, like completing each task or understanding a new concept. Your dedication to asking questions and seeking help shows you're on the right track. Keep going - you've got this! 🌟`;
    }
    
    // Default encouraging and helpful response
    return `That's an excellent question! Your curiosity and willingness to ask questions is exactly what makes a great learner. Based on your current study progress, you're doing really well. Learning is all about building understanding step by step, and every question you ask brings you closer to mastery. Keep exploring, stay curious, and remember that the best way to learn is through active engagement with the material. What specific aspect would you like to dive deeper into?`;
  }

  // Enhanced fallback with better content analysis
  private static generateEnhancedFallback(request: StudyPlanRequest): GeneratedStudyPlan {
    console.log('🧠 Using enhanced intelligent fallback...');
    
    const durationDays = this.getDurationDays(request.duration);
    const topics = this.extractTopicsFromContent(request.content);
    const keyPoints = this.extractKeyPoints(request.content);
    const complexity = this.analyzeComplexity(request.content, request.difficulty);
    
    return {
      title: request.contentType === 'file' 
        ? `PrepBuddy Study Plan: ${request.fileName}` 
        : 'PrepBuddy AI-Generated Study Plan',
      description: `Comprehensive ${durationDays}-day study plan analyzing your content with ${topics.length} key topics, tailored for ${request.difficulty} level learning.`,
      topics: topics,
      schedule: this.generateIntelligentSchedule(durationDays, topics, keyPoints, request.studyTime, complexity, request.content)
    };
  }

  // More intelligent schedule generation
  private static generateIntelligentSchedule(
    days: number, 
    topics: string[], 
    keyPoints: string[], 
    studyTime: string, 
    complexity: string,
    content: string
  ) {
    const schedule = [];
    const tasksPerDay = studyTime.includes('30') ? 3 : studyTime.includes('1') ? 4 : 5;
    const contentSections = this.divideContentIntoSections(content, days);
    
    for (let day = 1; day <= days; day++) {
      const progress = (day - 1) / (days - 1);
      const phase = progress < 0.3 ? 'Foundation' : progress < 0.7 ? 'Development' : 'Mastery';
      const topicIndex = Math.floor((day - 1) / Math.ceil(days / topics.length));
      const currentTopic = topics[topicIndex] || topics[0];
      const section = contentSections[day - 1];
      
      schedule.push({
        day,
        title: `${phase}: ${currentTopic}`,
        tasks: this.generateContextualTasks(day, currentTopic, section, tasksPerDay, complexity, phase),
        estimatedTime: studyTime
      });
    }
    
    return schedule;
  }

  // Generate tasks based on actual content context
  private static generateContextualTasks(
    day: number, 
    topic: string, 
    contentSection: string, 
    taskCount: number, 
    complexity: string, 
    phase: string
  ): string[] {
    const tasks = [];
    
    // Phase-specific base tasks
    if (phase === 'Foundation') {
      tasks.push(`Read and understand: ${topic}`);
      tasks.push(`Identify key concepts in ${topic}`);
      tasks.push(`Create vocabulary list for ${topic}`);
    } else if (phase === 'Development') {
      tasks.push(`Deep dive into ${topic} applications`);
      tasks.push(`Practice problems related to ${topic}`);
      tasks.push(`Connect ${topic} to previous concepts`);
    } else {
      tasks.push(`Master advanced aspects of ${topic}`);
      tasks.push(`Teach ${topic} concepts to someone else`);
      tasks.push(`Create comprehensive summary of ${topic}`);
    }

    // Content-specific tasks
    if (contentSection) {
      const sentences = contentSection.split(/[.!?]+/).filter(s => s.trim().length > 10);
      if (sentences.length > 0) {
        tasks.push(`Analyze: "${sentences[0].trim().substring(0, 50)}..."`);
      }
    }

    // Complexity-specific tasks
    const complexityTasks = {
      beginner: [`Watch introductory videos on ${topic}`, `Create simple flashcards`],
      intermediate: [`Solve practice problems`, `Write explanatory paragraphs`],
      advanced: [`Analyze case studies`, `Research current developments in ${topic}`]
    };

    tasks.push(...complexityTasks[complexity as keyof typeof complexityTasks]);

    // Review tasks
    if (day % 3 === 0) tasks.push('Review and consolidate previous concepts');
    if (day % 7 === 0) tasks.push('Weekly comprehensive assessment');

    return tasks.slice(0, taskCount);
  }

  // Divide content into daily sections
  private static divideContentIntoSections(content: string, days: number): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const sectionsPerDay = Math.ceil(sentences.length / days);
    const sections = [];
    
    for (let i = 0; i < days; i++) {
      const start = i * sectionsPerDay;
      const end = Math.min(start + sectionsPerDay, sentences.length);
      sections.push(sentences.slice(start, end).join('. '));
    }
    
    return sections;
  }

  // Content analysis methods (enhanced)
  static async analyzeContent(content: string): Promise<{
    topics: string[];
    complexity: string;
    estimatedReadingTime: string;
    keyPoints: string[];
    contentType: string;
    wordCount: number;
  }> {
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    
    return {
      topics: this.extractTopicsFromContent(content).slice(0, 5),
      complexity: this.analyzeComplexity(content, 'intermediate'),
      estimatedReadingTime: `${readingTime} minutes`,
      keyPoints: this.extractKeyPoints(content),
      contentType: this.detectContentType(content),
      wordCount
    };
  }

  private static detectContentType(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('chapter') || lowerContent.includes('section')) return 'Textbook/Manual';
    if (lowerContent.includes('abstract') || lowerContent.includes('methodology')) return 'Academic Paper';
    if (lowerContent.includes('tutorial') || lowerContent.includes('step')) return 'Tutorial/Guide';
    if (lowerContent.includes('definition') || lowerContent.includes('concept')) return 'Reference Material';
    
    return 'General Content';
  }

  private static extractTopicsFromContent(content: string): string[] {
    const words = content.toLowerCase().split(/\W+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'they', 'them', 'their', 'there', 'then', 'than', 'when', 'where', 'why', 'how', 'what', 'who', 'which', 'from', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'under', 'over']);
    
    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      if (word.length > 3 && !stopWords.has(word) && /^[a-z]+$/.test(word)) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    });

    // Get top words as topics
    const topWords = Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => this.capitalizeWord(word));

    // Look for multi-word phrases
    const phrases = this.extractPhrases(content);
    
    // Combine and deduplicate
    const allTopics = [...phrases, ...topWords];
    const uniqueTopics = Array.from(new Set(allTopics));
    
    return uniqueTopics.slice(0, 8);
  }

  private static extractPhrases(content: string): string[] {
    const sentences = content.split(/[.!?]+/);
    const phrases = [];
    
    // Look for capitalized phrases (likely important terms)
    const capitalizedPhrases = content.match(/[A-Z][a-z]+ [A-Z][a-z]+/g) || [];
    phrases.push(...capitalizedPhrases.slice(0, 3));
    
    // Look for quoted terms
    const quotedTerms = content.match(/"([^"]+)"/g) || [];
    phrases.push(...quotedTerms.map(q => q.replace(/"/g, '')).slice(0, 2));
    
    return phrases.map(p => p.trim()).filter(p => p.length > 3);
  }

  private static extractKeyPoints(content: string): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keyIndicators = ['important', 'key', 'main', 'primary', 'essential', 'crucial', 'fundamental', 'significant', 'critical', 'vital', 'major', 'central', 'core'];
    
    const keyPoints = sentences
      .filter(sentence => 
        keyIndicators.some(indicator => 
          sentence.toLowerCase().includes(indicator)
        )
      )
      .slice(0, 5)
      .map(point => point.trim().substring(0, 100) + (point.length > 100 ? '...' : ''));

    // If no key indicators found, use first few sentences
    if (keyPoints.length === 0) {
      return sentences.slice(0, 4).map(s => s.trim().substring(0, 100) + (s.length > 100 ? '...' : ''));
    }

    return keyPoints;
  }

  private static analyzeComplexity(content: string, userDifficulty: string): string {
    const sentences = content.split(/[.!?]+/);
    const words = content.split(/\s+/);
    const avgWordsPerSentence = words.length / sentences.length;
    
    // Count complex words (8+ characters)
    const complexWords = words.filter(word => word.length >= 8).length;
    const complexityRatio = complexWords / words.length;
    
    // Count technical terms (words with specific patterns)
    const technicalTerms = words.filter(word => 
      /tion$|sion$|ment$|ness$|ity$|ism$|ology$/.test(word.toLowerCase())
    ).length;
    const technicalRatio = technicalTerms / words.length;
    
    // Determine complexity
    let detectedComplexity = 'beginner';
    
    if (complexityRatio > 0.25 || avgWordsPerSentence > 20 || technicalRatio > 0.15) {
      detectedComplexity = 'advanced';
    } else if (complexityRatio > 0.15 || avgWordsPerSentence > 15 || technicalRatio > 0.08) {
      detectedComplexity = 'intermediate';
    }
    
    // Respect user preference but adjust if content is clearly different
    if (userDifficulty === 'advanced' || detectedComplexity === 'advanced') {
      return 'advanced';
    } else if (userDifficulty === 'intermediate' || detectedComplexity === 'intermediate') {
      return 'intermediate';
    }
    
    return 'beginner';
  }

  private static generateTasksForDay(day: number, topic: string, taskCount: number, complexity: string): string[] {
    const baseTasks = [
      `Study core concepts of ${topic}`,
      `Take detailed notes on ${topic}`,
      `Review and summarize ${topic}`,
      `Practice exercises for ${topic}`,
    ];

    return baseTasks.slice(0, taskCount);
  }

  private static getDurationDays(duration: string): number {
    switch (duration) {
      case '1-week': return 7;
      case '2-weeks': return 14;
      case '1-month': return 30;
      default: return 14;
    }
  }

  private static capitalizeWord(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
}