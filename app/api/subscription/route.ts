import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription, getUserPlan } from '@/lib/subscription'
import { PLANS } from '@/lib/stripe'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const subscription = await getUserSubscription(user.id)
    const plan = await getUserPlan(user.id)
    const planDetails = PLANS[plan]

    return NextResponse.json({
      subscription,
      plan,
      planDetails,
      limits: planDetails.limits,
    })
  } catch (error: any) {
    console.error('Get subscription error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
