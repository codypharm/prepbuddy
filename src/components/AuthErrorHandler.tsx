import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';

const AuthErrorHandler: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { error: authError, clearError } = useAuthStore();

  useEffect(() => {
    // Parse error from URL hash
    const hash = location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const errorParam = params.get('error');
      const errorCode = params.get('error_code');
      const errorDescription = params.get('error_description');
      
      if (errorParam) {
        setError(errorDescription || errorParam);
        setErrorCode(errorCode);
        
        // Try to get email from localStorage if available
        const storedEmail = localStorage.getItem('auth_email');
        if (storedEmail) {
          setEmail(storedEmail);
        }
      }
    }
  }, [location]);

  useEffect(() => {
    // Handle auth errors from the store (API errors)
    if (authError) {
      setError(authError);
      
      // Check if it's an email confirmation error
      if (authError.includes('Email not confirmed') || authError.includes('email_not_confirmed')) {
        setErrorCode('email_not_confirmed');
      }
      
      // Try to get email from localStorage if available
      const storedEmail = localStorage.getItem('auth_email');
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
  }, [authError]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (clearError) {
        clearError();
      }
    };
  }, [clearError]);

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address to resend the verification link');
      return;
    }
    
    setIsResending(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      
      if (error) throw error;
      
      setSuccess(true);
      setError(null);
      
      // Clear the error from the auth store
      if (clearError) {
        clearError();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleGoHome = () => {
    // Clear the error from the auth store
    if (clearError) {
      clearError();
    }
    setError(null);
    setErrorCode(null);
    navigate('/');
  };

  const handleClose = () => {
    // Clear the error from the auth store
    if (clearError) {
      clearError();
    }
    setError(null);
    setErrorCode(null);
  };

  if (!error) return null;

  const isEmailConfirmationError = errorCode === 'otp_expired' || errorCode === 'email_not_confirmed' || error.includes('Email not confirmed');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-center mb-6">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full">
            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-center">
          {isEmailConfirmationError ? 'Email Verification Required' : 'Authentication Error'}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
          {isEmailConfirmationError 
            ? 'Please verify your email address before signing in. Check your inbox for a verification link.'
            : error
          }
        </p>
        
        {isEmailConfirmationError && (
          <div className="mb-6">
            {success ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-green-700 dark:text-green-300">
                  Verification email has been resent. Please check your inbox and click the verification link.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
                  Didn't receive the verification email? Enter your email address to resend it:
                </p>
                <input
                  type="email"
                  value={email || ''}
                  onChange={handleEmailChange}
                  placeholder="Your email address"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={handleResendVerification}
                  disabled={isResending || !email}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isResending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Resending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
        
        <div className="flex justify-center space-x-3">
          {!success && (
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          )}
          <button
            onClick={handleGoHome}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthErrorHandler;