import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase, handleSupabaseError, requireAuth } from '../lib/supabase';
import { Subscription, PaymentHistory, BillingInfo } from '../types/subscription';
import { SUBSCRIPTION_PLANS, getFreePlan } from '../config/subscriptionPlans';

interface SubscriptionState {
  subscription: Subscription | null;
  paymentHistory: PaymentHistory[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchSubscription: () => Promise<void>;
  fetchPaymentHistory: () => Promise<void>;
  createCheckoutSession: (priceId: string) => Promise<{ url: string }>;
  createPortalSession: () => Promise<{ url: string }>;
  cancelSubscription: () => Promise<void>;
  updateSubscription: (updates: Partial<Subscription>) => Promise<void>;
  clearError: () => void;
  
  // Computed properties
  getCurrentPlan: () => typeof SUBSCRIPTION_PLANS[0];
  isSubscribed: () => boolean;
  canAccessFeature: (feature: string) => boolean;
  getRemainingUsage: () => {
    studyPlans: number | 'unlimited';
    aiRequests: number | 'unlimited';
    fileUploads: number | 'unlimited';
    studyGroups: number | 'unlimited';
  };
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: null,
      paymentHistory: [],
      isLoading: false,
      error: null,

      fetchSubscription: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const user = await requireAuth();
          
          const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

          if (error && error.code !== 'PGRST116') {
            throw error;
          }

          const subscription = data ? {
            id: data.id,
            userId: data.user_id,
            stripeCustomerId: data.stripe_customer_id || undefined,
            stripeSubscriptionId: data.stripe_subscription_id || undefined,
            planId: data.plan_id,
            status: data.status as Subscription['status'],
            currentPeriodStart: data.current_period_start ? new Date(data.current_period_start) : undefined,
            currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : undefined,
            cancelAtPeriodEnd: data.cancel_at_period_end,
            trialEnd: data.trial_end ? new Date(data.trial_end) : undefined,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
          } : null;
          
          set({
            subscription,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: handleSupabaseError(error),
          });
        }
      },

      fetchPaymentHistory: async () => {
        try {
          const user = await requireAuth();
          
          const { data, error } = await supabase
            .from('payment_history')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

          if (error) throw error;

          const paymentHistory = data.map(payment => ({
            id: payment.id,
            userId: payment.user_id,
            subscriptionId: payment.subscription_id || undefined,
            stripePaymentIntentId: payment.stripe_payment_intent_id || undefined,
            stripeInvoiceId: payment.stripe_invoice_id || undefined,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status as PaymentHistory['status'],
            description: payment.description || undefined,
            createdAt: new Date(payment.created_at),
          }));
          
          set({ paymentHistory });
        } catch (error: any) {
          set({ error: handleSupabaseError(error) });
        }
      },

      createCheckoutSession: async (priceId: string) => {
        try {
          const user = await requireAuth();
          
          // Call Supabase Edge Function to create checkout session
          const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: {
              priceId,
              userId: user.id,
              successUrl: `${window.location.origin}/billing/success`,
              cancelUrl: `${window.location.origin}/billing`,
            },
          });

          if (error) throw error;

          return { url: data.url };
        } catch (error: any) {
          set({ error: handleSupabaseError(error) });
          throw error;
        }
      },

      createPortalSession: async () => {
        try {
          const user = await requireAuth();
          const { subscription } = get();
          
          if (!subscription?.stripeCustomerId) {
            throw new Error('No active subscription found');
          }

          // Call Supabase Edge Function to create portal session
          const { data, error } = await supabase.functions.invoke('create-portal-session', {
            body: {
              customerId: subscription.stripeCustomerId,
              returnUrl: `${window.location.origin}/billing`,
            },
          });

          if (error) throw error;

          return { url: data.url };
        } catch (error: any) {
          set({ error: handleSupabaseError(error) });
          throw error;
        }
      },

      cancelSubscription: async () => {
        try {
          const user = await requireAuth();
          const { subscription } = get();
          
          if (!subscription?.stripeSubscriptionId) {
            throw new Error('No active subscription found');
          }

          // Call Supabase Edge Function to cancel subscription
          const { error } = await supabase.functions.invoke('cancel-subscription', {
            body: {
              subscriptionId: subscription.stripeSubscriptionId,
            },
          });

          if (error) throw error;

          // Refresh subscription data
          await get().fetchSubscription();
        } catch (error: any) {
          set({ error: handleSupabaseError(error) });
          throw error;
        }
      },

      updateSubscription: async (updates) => {
        try {
          const user = await requireAuth();
          const { subscription } = get();
          
          if (!subscription) {
            throw new Error('No subscription found');
          }

          const { error } = await supabase
            .from('subscriptions')
            .update({
              ...updates,
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscription.id)
            .eq('user_id', user.id);

          if (error) throw error;

          // Update local state
          set({
            subscription: { ...subscription, ...updates },
          });
        } catch (error: any) {
          set({ error: handleSupabaseError(error) });
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      // Computed properties
      getCurrentPlan: () => {
        const { subscription } = get();
        if (!subscription) {
          return getFreePlan();
        }
        
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.planId);
        return plan || getFreePlan();
      },

      isSubscribed: () => {
        const { subscription } = get();
        return subscription?.status === 'active' || subscription?.status === 'trialing';
      },

      canAccessFeature: (feature: string) => {
        const plan = get().getCurrentPlan();
        return plan.features.includes(feature) || plan.id !== 'free';
      },

      getRemainingUsage: () => {
        const plan = get().getCurrentPlan();
        // This would typically fetch actual usage from the database
        // For now, return the plan limits
        return {
          studyPlans: plan.limits.studyPlans,
          aiRequests: plan.limits.aiRequests,
          fileUploads: plan.limits.fileUploads,
          studyGroups: plan.limits.studyGroups,
        };
      },
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        subscription: state.subscription,
        paymentHistory: state.paymentHistory,
      }),
    }
  )
);