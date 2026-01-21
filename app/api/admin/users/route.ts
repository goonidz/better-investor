import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const planFilter = searchParams.get('plan') || ''

    // Get subscriptions with user info
    let query = supabase
      .from('subscriptions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (planFilter) {
      query = query.eq('plan', planFilter)
    }

    const { data: subscriptions, count, error } = await query

    if (error) throw error

    // Get holdings count for each user
    const userIds = subscriptions?.map(s => s.user_id) || []
    
    const { data: holdingsCounts } = await supabase
      .from('holdings')
      .select('user_id')
      .in('user_id', userIds)

    // Count holdings per user
    const holdingsMap: Record<string, number> = {}
    holdingsCounts?.forEach(h => {
      holdingsMap[h.user_id] = (holdingsMap[h.user_id] || 0) + 1
    })

    // Get portfolio values
    const { data: holdingsValues } = await supabase
      .from('holdings')
      .select('user_id, current_value')
      .in('user_id', userIds)

    const portfolioValues: Record<string, number> = {}
    holdingsValues?.forEach(h => {
      portfolioValues[h.user_id] = (portfolioValues[h.user_id] || 0) + (h.current_value || 0)
    })

    const users = subscriptions?.map(sub => ({
      ...sub,
      holdings_count: holdingsMap[sub.user_id] || 0,
      portfolio_value: portfolioValues[sub.user_id] || 0,
    }))

    return NextResponse.json({
      users,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error: any) {
    console.error('Admin users error:', error)
    return NextResponse.json({ error: error.message }, { status: error.message === 'Not authorized' ? 403 : 500 })
  }
}
