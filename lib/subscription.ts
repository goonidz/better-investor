import { createClient } from '@supabase/supabase-js'
import { PLANS, PlanType } from './stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: PlanType
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching subscription:', error)
    return null
  }

  return data as Subscription
}

export async function getUserPlan(userId: string): Promise<PlanType> {
  const subscription = await getUserSubscription(userId)
  
  if (!subscription) return 'free'
  if (subscription.status === 'canceled' || subscription.status === 'past_due') return 'free'
  
  return subscription.plan as PlanType
}

export async function updateSubscription(
  userId: string, 
  data: Partial<Omit<Subscription, 'id' | 'user_id' | 'created_at'>>
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const { error } = await supabase
    .from('subscriptions')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
}

export async function upsertSubscription(
  userId: string,
  data: Partial<Omit<Subscription, 'id' | 'created_at'>>
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      ...data,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('Error upserting subscription:', error)
    throw error
  }
}

export async function getSubscriptionByStripeCustomerId(customerId: string): Promise<Subscription | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .single()

  if (error) {
    console.error('Error fetching subscription by customer ID:', error)
    return null
  }

  return data as Subscription
}

export function canAccessFeature(plan: PlanType, feature: keyof typeof PLANS.deepdive.limits): boolean {
  const planLimits = PLANS[plan].limits
  return !!planLimits[feature]
}

export function getPlanLimits(plan: PlanType) {
  return PLANS[plan].limits
}
