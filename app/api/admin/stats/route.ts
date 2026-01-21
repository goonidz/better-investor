import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'

export async function GET() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })

    // Get paid users count
    const { count: paidUsers } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('plan', 'deepdive')

    // Get active trials
    const { count: activeTrials } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'trialing')

    // Get open support tickets
    const { count: openTickets } = await supabase
      .from('support_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')

    // Get total holdings value (sum of all portfolios)
    const { data: holdings } = await supabase
      .from('holdings')
      .select('current_value')

    const totalPortfolioValue = holdings?.reduce((sum, h) => sum + (h.current_value || 0), 0) || 0

    // Get recent signups (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { count: recentSignups } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      paidUsers: paidUsers || 0,
      activeTrials: activeTrials || 0,
      openTickets: openTickets || 0,
      totalPortfolioValue,
      recentSignups: recentSignups || 0,
      conversionRate: totalUsers ? ((paidUsers || 0) / totalUsers * 100).toFixed(1) : 0,
    })
  } catch (error: any) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: error.message }, { status: error.message === 'Not authorized' ? 403 : 500 })
  }
}
