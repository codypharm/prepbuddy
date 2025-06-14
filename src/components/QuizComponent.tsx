import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Award, RotateCcw, Brain, Clock } from 'lucide-react';
import { Quiz, QuizResult } from '../App';

interface QuizComponentProps {
  quiz: Quiz;
  onComplete: (result: QuizResult) => void;
  onBack: () => void;
}

const QuizComponent: React.FC<QuizComponentProps> = ({ quiz, onComplete, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(new Array(quiz.questions.length).fill(-1));
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [quizStarted, setQuizStarted] = useState(false);

  // Timer effect
  useEffect(() => {
    if (!quizStarted || showResults) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, showResults]);

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitQuiz = () => {
    const correctAnswers = selectedAnswers.reduce((count, answer, index) => {
      return answer === quiz.questions[index].correctAnswer ? count + 1 : count;
    }, 0);

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    const result: QuizResult = {
      quizId: quiz.id,
      score,
      answers: selectedAnswers,
      completedAt: new Date(),
      passed
    };

    setShowResults(true);
    setTimeout(() => onComplete(result), 3000); // Auto-close after 3 seconds
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
    setShowResults(false);
    setTimeLeft(300);
    setQuizStarted(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-blue-50 border-blue-200';
    if (score >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  if (showResults) {
    const correctAnswers = selectedAnswers.reduce((count, answer, index) => {
      return answer === quiz.questions[index].correctAnswer ? count + 1 : count;
    }, 0);
    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {passed ? (
                <Award className="h-10 w-10 text-green-600" />
              ) : (
                <XCircle className="h-10 w-10 text-red-600" />
              )}
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">Quiz Complete!</h2>
            
            <div className={`inline-block p-6 rounded-xl border-2 mb-6 ${getScoreBgColor(score)}`}>
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(score)}`}>
                {score}%
              </div>
              <div className="text-gray-600">
                {correctAnswers} out of {quiz.questions.length} correct
              </div>
            </div>

            <div className="mb-6">
              {passed ? (
                <div className="text-green-600 font-semibold text-lg">
                  🎉 Congratulations! You passed the quiz!
                </div>
              ) : (
                <div className="text-red-600 font-semibold text-lg">
                  You need {quiz.passingScore}% to pass. Keep studying!
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{quiz.questions.length}</div>
                <div className="text-gray-600">Total Questions</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{formatTime(300 - timeLeft)}</div>
                <div className="text-gray-600">Time Taken</div>
              </div>
            </div>

            <div className="space-y-4">
              {quiz.questions.map((question, index) => {
                const userAnswer = selectedAnswers[index];
                const isCorrect = userAnswer === question.correctAnswer;
                
                return (
                  <div key={question.id} className="text-left p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-1 ${
                        isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {isCorrect ? (
                          <CheckCircle className="h-4 w-4 text-white" />
                        ) : (
                          <XCircle className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">{question.question}</p>
                        <div className="space-y-1 text-sm">
                          <div className={`${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                            Your answer: {userAnswer >= 0 ? question.options[userAnswer] : 'No answer'}
                          </div>
                          {!isCorrect && (
                            <div className="text-green-700">
                              Correct answer: {question.options[question.correctAnswer]}
                            </div>
                          )}
                          {question.explanation && (
                            <div className="text-gray-600 mt-2 italic">
                              {question.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center space-x-4 mt-8">
              {!passed && (
                <button
                  onClick={handleRetry}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Retry Quiz
                </button>
              )}
              <button
                onClick={onBack}
                className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Study
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to study plan
          </button>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="h-10 w-10 text-blue-600" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">{quiz.title}</h2>
            <p className="text-gray-600 text-lg mb-8">
              Test your understanding with this AI-generated quiz
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-xl">
                <div className="text-2xl font-bold text-blue-600 mb-2">{quiz.questions.length}</div>
                <div className="text-gray-600">Questions</div>
              </div>
              <div className="bg-green-50 p-6 rounded-xl">
                <div className="text-2xl font-bold text-green-600 mb-2">5</div>
                <div className="text-gray-600">Minutes</div>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl">
                <div className="text-2xl font-bold text-purple-600 mb-2">{quiz.passingScore}%</div>
                <div className="text-gray-600">To Pass</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Quiz Instructions</h3>
              <ul className="text-left text-gray-700 space-y-2">
                <li>• You have 5 minutes to complete all questions</li>
                <li>• You can navigate between questions freely</li>
                <li>• You need {quiz.passingScore}% to pass this quiz</li>
                <li>• Review your answers before submitting</li>
                <li>• You can retake the quiz if you don't pass</li>
              </ul>
            </div>

            <button
              onClick={() => setQuizStarted(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const allAnswered = selectedAnswers.every(answer => answer !== -1);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to study plan
        </button>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{quiz.title}</h2>
              <p className="text-gray-600">Question {currentQuestion + 1} of {quiz.questions.length}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-600">
                <Clock className="h-5 w-5 mr-2" />
                <span className={`font-mono ${timeLeft < 60 ? 'text-red-600' : ''}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">{question.question}</h3>
            
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedAnswers[currentQuestion] === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                      selectedAnswers[currentQuestion] === index
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedAnswers[currentQuestion] === index && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-gray-900">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Previous
            </button>

            <div className="flex space-x-2">
              {quiz.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 ${
                    index === currentQuestion
                      ? 'bg-blue-600 text-white'
                      : selectedAnswers[index] !== -1
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {currentQuestion === quiz.questions.length - 1 ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={!allAnswered}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                Next
                <ArrowLeft className="h-5 w-5 ml-2 rotate-180" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizComponent;