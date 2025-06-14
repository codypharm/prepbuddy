import { SubscriptionPlan } from '../types/subscription';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started with AI-powered learning',
    price: 0,
    currency: 'usd',
    interval: 'month',
    stripePriceId: '', // No Stripe price for free plan
    features: [
      '3 AI study plans per month',
      '50 AI requests per month',
      'Basic progress tracking',
      'File upload support (PDF, DOCX)',
      'Community support',
      '100MB storage'
    ],
    limits: {
      studyPlans: 3,
      aiRequests: 50,
      fileUploads: 10,
      studyGroups: 1,
      storage: '100MB'
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For serious learners who want unlimited AI-powered study plans',
    price: 999, // $9.99/month
    currency: 'usd',
    interval: 'month',
    stripePriceId: 'price_1234567890', // Replace with actual Stripe price ID
    popular: true,
    features: [
      'Unlimited AI study plans',
      '1,000 AI requests per month',
      'Advanced analytics & insights',
      'Priority AI processing',
      'Study groups (up to 5)',
      'Advanced file support (LaTeX, BibTeX)',
      'Email support',
      '5GB storage',
      'Export study plans',
      'Custom study schedules'
    ],
    limits: {
      studyPlans: 'unlimited',
      aiRequests: 1000,
      fileUploads: 'unlimited',
      studyGroups: 5,
      storage: '5GB'
    }
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For educators and power users who need maximum flexibility',
    price: 1999, // $19.99/month
    currency: 'usd',
    interval: 'month',
    stripePriceId: 'price_0987654321', // Replace with actual Stripe price ID
    features: [
      'Everything in Pro',
      'Unlimited AI requests',
      'Advanced AI models access',
      'Unlimited study groups',
      'Team collaboration tools',
      'API access',
      'Priority support',
      'Unlimited storage',
      'White-label options',
      'Custom integrations',
      'Advanced reporting',
      'Bulk operations'
    ],
    limits: {
      studyPlans: 'unlimited',
      aiRequests: 'unlimited',
      fileUploads: 'unlimited',
      studyGroups: 'unlimited',
      storage: 'unlimited'
    }
  },
  {
    id: 'pro-yearly',
    name: 'Pro (Yearly)',
    description: 'Pro plan with 2 months free when billed annually',
    price: 9999, // $99.99/year (equivalent to $8.33/month)
    currency: 'usd',
    interval: 'year',
    stripePriceId: 'price_yearly_123', // Replace with actual Stripe price ID
    features: [
      'Everything in Pro',
      '2 months free (save 17%)',
      'Annual billing discount'
    ],
    limits: {
      studyPlans: 'unlimited',
      aiRequests: 1000,
      fileUploads: 'unlimited',
      studyGroups: 5,
      storage: '5GB'
    }
  },
  {
    id: 'premium-yearly',
    name: 'Premium (Yearly)',
    description: 'Premium plan with 2 months free when billed annually',
    price: 19999, // $199.99/year (equivalent to $16.67/month)
    currency: 'usd',
    interval: 'year',
    stripePriceId: 'price_yearly_456', // Replace with actual Stripe price ID
    features: [
      'Everything in Premium',
      '2 months free (save 17%)',
      'Annual billing discount'
    ],
    limits: {
      studyPlans: 'unlimited',
      aiRequests: 'unlimited',
      fileUploads: 'unlimited',
      studyGroups: 'unlimited',
      storage: 'unlimited'
    }
  }
];

export const getPlanById = (planId: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
};

export const getFreePlan = (): SubscriptionPlan => {
  return SUBSCRIPTION_PLANS[0]; // Free plan is always first
};

export const getPaidPlans = (): SubscriptionPlan[] => {
  return SUBSCRIPTION_PLANS.filter(plan => plan.price > 0);
};

export const formatPrice = (price: number, currency: string = 'usd'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(price / 100);
};