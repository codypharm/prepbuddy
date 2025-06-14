import React, { useEffect, useState } from 'react';
import { 
  CreditCard, 
  Calendar, 
  Download, 
  Settings, 
  AlertCircle, 
  CheckCircle,
  Clock,
  ArrowUpRight,
  Shield
} from 'lucide-react';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { formatPrice, getPlanById } from '../../config/subscriptionPlans';
import { PaymentHistory } from '../../types/subscription';

const BillingPage: React.FC = () => {
  const { 
    subscription, 
    paymentHistory, 
    isLoading, 
    error,
    fetchSubscription, 
    fetchPaymentHistory,
    createPortalSession,
    cancelSubscription,
    getCurrentPlan,
    isSubscribed,
    getRemainingUsage,
    clearError
  } = useSubscriptionStore();
  
  const { isAuthenticated } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscription();
      fetchPaymentHistory();
    }
  }, [isAuthenticated, fetchSubscription, fetchPaymentHistory]);

  const currentPlan = getCurrentPlan();
  const usage = getRemainingUsage();

  const handleManageBilling = async () => {
    setIsProcessing(true);
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to open billing portal:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    setIsProcessing(true);
    try {
      await cancelSubscription();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'trialing': return 'text-blue-600 bg-blue-100';
      case 'canceled': return 'text-red-600 bg-red-100';
      case 'past_due': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentStatusIcon = (status: PaymentHistory['status']) => {
    switch (status) {
      case 'succeeded': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sign in to view billing
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in to access your billing information and manage your subscription.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Billing & Subscription
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your subscription, view payment history, and update billing information.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
              <button
                onClick={clearError}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Current Plan */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Current Plan
                </h2>
                {subscription && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </span>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {currentPlan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {currentPlan.description}
                  </p>
                  
                  {currentPlan.price > 0 ? (
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(currentPlan.price)}
                      <span className="text-lg font-normal text-gray-600 dark:text-gray-400">
                        /{currentPlan.interval}
                      </span>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      Free
                    </div>
                  )}
                </div>

                <div>
                  {subscription && subscription.currentPeriodEnd && (
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Next billing date</span>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {subscription.currentPeriodEnd.toLocaleDateString()}
                        </div>
                      </div>
                      
                      {subscription.cancelAtPeriodEnd && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-center">
                            <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                            <span className="text-yellow-800 text-sm">
                              Subscription will cancel on {subscription.currentPeriodEnd.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                {isSubscribed() && (
                  <button
                    onClick={handleManageBilling}
                    disabled={isProcessing}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Billing
                  </button>
                )}
                
                <a
                  href="/pricing"
                  className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  {isSubscribed() ? 'Change Plan' : 'Upgrade Plan'}
                </a>

                {isSubscribed() && !subscription?.cancelAtPeriodEnd && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={isProcessing}
                    className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Payment History
              </h2>

              {paymentHistory.length > 0 ? (
                <div className="space-y-4">
                  {paymentHistory.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center">
                        {getPaymentStatusIcon(payment.status)}
                        <div className="ml-3">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {payment.description || 'Subscription payment'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {payment.createdAt.toLocaleDateString()} • {payment.status}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatPrice(payment.amount, payment.currency)}
                        </div>
                        <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
                          <Download className="h-3 w-3 mr-1" />
                          Invoice
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No payment history available
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Usage & Limits */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Usage This Month
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Study Plans</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {usage.studyPlans === 'unlimited' ? 'Unlimited' : `${usage.studyPlans} remaining`}
                    </span>
                  </div>
                  {usage.studyPlans !== 'unlimited' && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.max(0, 100 - (usage.studyPlans as number / currentPlan.limits.studyPlans as number) * 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">AI Requests</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {usage.aiRequests === 'unlimited' ? 'Unlimited' : `${usage.aiRequests} remaining`}
                    </span>
                  </div>
                  {usage.aiRequests !== 'unlimited' && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.max(0, 100 - (usage.aiRequests as number / currentPlan.limits.aiRequests as number) * 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Storage</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {currentPlan.limits.storage}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-500" />
                Security
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Payments secured by Stripe</span>
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Data encrypted in transit</span>
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>PCI DSS compliant</span>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Need Help?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Our support team is here to help with any billing questions.
              </p>
              <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                Contact Support →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;