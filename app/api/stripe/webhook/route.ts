import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { upsertSubscription, getSubscriptionByStripeCustomerId } from '@/lib/subscription'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        
        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          
          // Get period end from subscription or from items
          const periodEnd = subscription.current_period_end 
            || subscription.items?.data?.[0]?.current_period_end
            || subscription.trial_end
          
          await upsertSubscription(userId, {
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            plan: 'deepdive',
            status: subscription.status === 'trialing' ? 'trialing' : 'active',
            current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        const existingSub = await getSubscriptionByStripeCustomerId(customerId)
        
        if (existingSub) {
          let status: 'active' | 'canceled' | 'past_due' | 'trialing' = 'active'
          if (subscription.status === 'trialing') status = 'trialing'
          else if (subscription.status === 'past_due') status = 'past_due'
          else if (subscription.status === 'canceled' || subscription.cancel_at_period_end) status = 'canceled'
          
          // Get period end from subscription or from items
          const periodEnd = subscription.current_period_end 
            || subscription.items?.data?.[0]?.current_period_end
            || subscription.trial_end
          
          await upsertSubscription(existingSub.user_id, {
            status,
            current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        const existingSub = await getSubscriptionByStripeCustomerId(customerId)
        
        if (existingSub) {
          await upsertSubscription(existingSub.user_id, {
            plan: 'free',
            status: 'canceled',
            stripe_subscription_id: null,
            current_period_end: null,
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        
        const existingSub = await getSubscriptionByStripeCustomerId(customerId)
        
        if (existingSub) {
          await upsertSubscription(existingSub.user_id, {
            status: 'past_due',
          })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
