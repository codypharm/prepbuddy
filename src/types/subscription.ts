export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  stripePriceId: string;
  limits: {
    studyPlans: number | 'unlimited';
    aiRequests: number | 'unlimited';
    fileUploads: number | 'unlimited';
    studyGroups: number | 'unlimited';
    storage: string; // e.g., "1GB", "unlimited"
  };
}

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  planId: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  subscriptionId?: string;
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  amount: number; // in cents
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'canceled' | 'refunded';
  description?: string;
  createdAt: Date;
}

export interface BillingInfo {
  subscription?: Subscription;
  paymentHistory: PaymentHistory[];
  upcomingInvoice?: {
    amount: number;
    currency: string;
    date: Date;
  };
}