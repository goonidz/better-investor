import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      'View your portfolio',
      'Basic dashboard',
      'Insider trading data (raw)',
    ],
    limits: {
      aiCredits: 0,
      import: false,
      projections: false,
      aiInsights: false,
    }
  },
  deepdive: {
    name: 'Deepdive',
    price: 59,
    yearlyPrice: 490,
    features: [
      'Everything in Free',
      '2,500 AI credits/month',
      'PDF & CSV import',
      'AI portfolio analysis',
      'Insider trading AI insights',
      'Projection calculator',
      'Priority support',
    ],
    limits: {
      aiCredits: 2500,
      import: true,
      projections: true,
      aiInsights: true,
    }
  }
} as const

export type PlanType = keyof typeof PLANS
