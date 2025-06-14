import React, { useState } from 'react';
import { Check, Star, Zap, Crown, Users, Infinity } from 'lucide-react';
import { SUBSCRIPTION_PLANS, formatPrice } from '../../config/subscriptionPlans';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { isStripeEnabled } from '../../lib/stripe';

interface PricingPageProps {
  onSelectPlan?: (planId: string) => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onSelectPlan }) => {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { createCheckoutSession, getCurrentPlan, isSubscribed } = useSubscriptionStore();
  const { isAuthenticated } = useAuthStore();
  
  const currentPlan = getCurrentPlan();
  const filteredPlans = SUBSCRIPTION_PLANS.filter(plan => 
    plan.interval === billingInterval || plan.id === 'free'
  );

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free' || planId === currentPlan.id) {
      return;
    }

    if (!isAuthenticated) {
      onSelectPlan?.(planId);
      return;
    }

    if (!isStripeEnabled()) {
      alert('Payment processing is not available in this environment.');
      return;
    }

    setIsLoading(planId);
    
    try {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan || !plan.stripePriceId) {
        throw new Error('Invalid plan selected');
      }

      const { url } = await createCheckoutSession(plan.stripePriceId);
      window.location.href = url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return <Zap className="h-6 w-6" />;
      case 'pro': 
      case 'pro-yearly': return <Star className="h-6 w-6" />;
      case 'premium':
      case 'premium-yearly': return <Crown className="h-6 w-6" />;
      default: return <Zap className="h-6 w-6" />;
    }
  };

  const getButtonText = (planId: string) => {
    if (planId === 'free') {
      return currentPlan.id === 'free' ? 'Current Plan' : 'Downgrade';
    }
    
    if (planId === currentPlan.id) {
      return 'Current Plan';
    }
    
    if (isSubscribed() && currentPlan.price < SUBSCRIPTION_PLANS.find(p => p.id === planId)?.price!) {
      return 'Upgrade';
    }
    
    return 'Get Started';
  };

  const isCurrentPlan = (planId: string) => planId === currentPlan.id;

  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Learning Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Unlock the full power of AI-driven learning with our flexible subscription plans. 
            Start free and upgrade as you grow.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billingInterval === 'month'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-6 py-2 rounded-md font-medium transition-colors relative ${
                billingInterval === 'year'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${
                plan.popular
                  ? 'border-blue-500 scale-105'
                  : isCurrentPlan(plan.id)
                  ? 'border-green-500'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan(plan.id) && (
                <div className="absolute -top-4 right-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Current
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                    plan.popular
                      ? 'bg-blue-100 text-blue-600'
                      : plan.id === 'free'
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    {getPlanIcon(plan.id)}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {plan.description}
                  </p>
                  
                  {/* Price */}
                  <div className="mb-6">
                    {plan.price === 0 ? (
                      <div className="text-4xl font-bold text-gray-900 dark:text-white">
                        Free
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(plan.price)}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          per {plan.interval}
                        </div>
                        {plan.interval === 'year' && (
                          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                            {formatPrice(Math.floor(plan.price / 12))}/month billed annually
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Usage Limits */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-8">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Usage Limits</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Study Plans</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {plan.limits.studyPlans === 'unlimited' ? (
                          <div className="flex items-center">
                            <Infinity className="h-4 w-4 mr-1" />
                            Unlimited
                          </div>
                        ) : (
                          `${plan.limits.studyPlans}/month`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">AI Requests</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {plan.limits.aiRequests === 'unlimited' ? (
                          <div className="flex items-center">
                            <Infinity className="h-4 w-4 mr-1" />
                            Unlimited
                          </div>
                        ) : (
                          `${plan.limits.aiRequests}/month`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Storage</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {plan.limits.storage}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isLoading === plan.id || isCurrentPlan(plan.id)}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                    isCurrentPlan(plan.id)
                      ? 'bg-green-100 text-green-800 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                      : plan.id === 'free'
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  } ${isLoading === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading === plan.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    getButtonText(plan.id)
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades, or at the end of your billing period for downgrades.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Our Free plan gives you access to core features forever. Paid plans include a 14-day money-back guarantee.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We accept all major credit cards, PayPal, and bank transfers through our secure payment processor Stripe.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Absolutely! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="flex justify-center items-center space-x-8 text-gray-400">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span>Secure payments</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span>Money-back guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;