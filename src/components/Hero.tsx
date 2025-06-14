import React from 'react';
import { Sparkles, Clock, Target, Brain } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <span className="inline-flex items-center bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Brain className="h-4 w-4 mr-2" />
            AI-Powered Learning
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Your Personal
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> AI Study</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Companion</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform any document into a personalized study plan. Upload PDFs, Word docs, or paste your content, 
            and PrepBuddy's AI will create the perfect learning path tailored to your goals and schedule.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart Planning</h3>
            <p className="text-gray-600 text-sm">AI analyzes your content and creates personalized study schedules</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="bg-gradient-to-r from-green-50 to-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Time Optimized</h3>
            <p className="text-gray-600 text-sm">Efficient learning paths that adapt to your busy lifestyle</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI-Enhanced</h3>
            <p className="text-gray-600 text-sm">Advanced algorithms understand and structure your content</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-500 mb-8">Ready to supercharge your learning? Get started below:</p>
          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-xl shadow-md border border-gray-200">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-3 py-1 rounded-lg font-medium">Upload Files</span>
                <span className="text-gray-400">+</span>
                <span className="bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 px-3 py-1 rounded-lg font-medium">Add Notes</span>
                <span className="text-gray-400">=</span>
                <span className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 px-3 py-1 rounded-lg font-medium">Perfect Plan</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;