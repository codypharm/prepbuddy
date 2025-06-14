import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface SignInFormProps {
  onSwitchToSignUp: () => void;
  onClose: () => void;
}

const SignInForm: React.FC<SignInFormProps> = ({ onSwitchToSignUp, onClose }) => {
  const { signIn, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: 'williamikeji@gmail.com', // Updated to match signup page
    password: 'password123', // Default for development
  });
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      if (clearError) clearError();
    };
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (clearError) clearError();
      
      // Store email in localStorage for verification error handling
      localStorage.setItem('auth_email', formData.email);
      
      await signIn(formData.email, formData.password);
      // The modal will be closed automatically by the useEffect in AuthModal
      // when isAuthenticated becomes true
    } catch (error) {
      // Error is handled by the auth hook
    }
  };

  const handleQuickDemo = async () => {
    try {
      if (clearError) clearError();
      
      // Store email in localStorage for verification error handling
      localStorage.setItem('auth_email', 'williamikeji@gmail.com');
      
      await signIn('williamikeji@gmail.com', 'password123');
      // The modal will be closed automatically by the useEffect in AuthModal
      // when isAuthenticated becomes true
    } catch (error) {
      // Error is handled by the auth hook
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      return;
    }
    
    try {
      if (clearError) clearError();
      
      // Call Supabase reset password
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setResetSent(true);
    } catch (error: any) {
      console.error('Reset password error:', error);
    }
  };

  // Reset password form
  if (resetPasswordMode) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h2>
          <p className="text-gray-600">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {resetSent ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
              <div>
                <p className="text-green-800 text-sm mb-1">
                  <strong>Reset link sent!</strong>
                </p>
                <p className="text-green-700 text-sm">
                  Please check your email and follow the instructions to reset your password.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.email}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  Send Reset Link
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => setResetPasswordMode(false)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
        <p className="text-gray-600">Sign in to continue your learning journey</p>
      </div>

      {error && !error.includes('Email not confirmed') && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="ml-2 text-sm text-gray-600">Remember me</span>
          </label>
          <button 
            type="button" 
            className="text-sm text-blue-600 hover:text-blue-700"
            onClick={() => setResetPasswordMode(true)}
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Signing In...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="h-5 w-5 ml-2" />
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Button for Development */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Development Mode</span>
          </div>
        </div>
        <button
          onClick={handleQuickDemo}
          disabled={isLoading}
          className="mt-4 w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
        >
          🚀 Quick Demo Access
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToSignUp}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignInForm;