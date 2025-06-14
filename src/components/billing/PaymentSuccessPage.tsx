import React, { useEffect } from 'react';
import { CheckCircle, ArrowRight, Download } from 'lucide-react';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';

const PaymentSuccessPage: React.FC = () => {
  const { fetchSubscription, getCurrentPlan } = useSubscriptionStore();

  useEffect(() => {
    // Refresh subscription data after successful payment
    fetchSubscription();
  }, [fetchSubscription]);

  const currentPlan = getCurrentPlan();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Payment Successful!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Welcome to {currentPlan.name}! Your subscription is now active and you have access to all premium features.
          </p>

          {/* Plan Details */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {currentPlan.name} Plan
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentPlan.description}
            </p>
          </div>

          {/* Next Steps */}
          <div className="space-y-3 mb-8">
            <h4 className="font-medium text-gray-900 dark:text-white">What's next?</h4>
            <div className="text-left space-y-2">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                <span>Create unlimited AI study plans</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                <span>Access advanced analytics</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                <span>Join study groups</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                <span>Priority support</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <a
              href="/dashboard"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </a>
            
            <div className="flex space-x-3">
              <a
                href="/billing"
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-center"
              >
                View Billing
              </a>
              <button className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium flex items-center justify-center">
                <Download className="h-4 w-4 mr-1" />
                Receipt
              </button>
            </div>
          </div>

          {/* Support */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Questions? Contact our support team for help getting started.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;