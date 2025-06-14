import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.15.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()
  
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response('Webhook handled successfully', { status: 200 })
  } catch (error) {
    console.error('Error handling webhook:', error)
    return new Response('Webhook handler failed', { status: 500 })
  }
})

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  if (!userId) return

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
  
  // Get price to determine plan ID
  const priceId = subscription.items.data[0].price.id
  const planId = getPlanIdFromPriceId(priceId)

  // Create or update subscription record
  await supabaseClient
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscription.id,
      plan_id: planId,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    })
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const userId = invoice.subscription_object?.metadata?.userId
  if (!userId) return

  // Record payment in payment history
  await supabaseClient
    .from('payment_history')
    .insert({
      user_id: userId,
      stripe_payment_intent_id: invoice.payment_intent as string,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      description: invoice.description || 'Subscription payment',
    })
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const userId = invoice.subscription_object?.metadata?.userId
  if (!userId) return

  // Record failed payment
  await supabaseClient
    .from('payment_history')
    .insert({
      user_id: userId,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      description: 'Failed subscription payment',
    })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  if (!userId) return

  const priceId = subscription.items.data[0].price.id
  const planId = getPlanIdFromPriceId(priceId)

  // Update subscription record
  await supabaseClient
    .from('subscriptions')
    .update({
      plan_id: planId,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Update subscription status to canceled
  await supabaseClient
    .from('subscriptions')
    .update({
      status: 'canceled',
    })
    .eq('stripe_subscription_id', subscription.id)
}

function getPlanIdFromPriceId(priceId: string): string {
  // Map Stripe price IDs to plan IDs
  const priceToplanMap: Record<string, string> = {
    'price_1234567890': 'pro',
    'price_0987654321': 'premium',
    'price_yearly_123': 'pro-yearly',
    'price_yearly_456': 'premium-yearly',
  }
  
  return priceToplanMap[priceId] || 'free'
}