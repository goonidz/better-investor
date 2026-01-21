import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get history for different periods
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    // Calculate date ranges
    const date7d = new Date(now)
    date7d.setDate(date7d.getDate() - 7)
    
    const date30d = new Date(now)
    date30d.setDate(date30d.getDate() - 30)
    
    const dateYtd = new Date(now.getFullYear(), 0, 1)

    // Fetch all history for this year (covers all periods)
    const { data: history, error } = await supabase
      .from('portfolio_history')
      .select('date, total_value, total_cost')
      .eq('user_id', user.id)
      .gte('date', dateYtd.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!history || history.length === 0) {
      return NextResponse.json({
        history: [],
        periods: {
          '7d': null,
          '30d': null,
          'ytd': null
        }
      })
    }

    // Get the most recent value (today or latest)
    const latestValue = history[0]?.total_value ? parseFloat(history[0].total_value) : null

    // Find values at specific dates
    const findValueAtDate = (targetDate: Date) => {
      const targetStr = targetDate.toISOString().split('T')[0]
      
      // Find the closest record on or before the target date
      for (const h of history) {
        if (h.date <= targetStr) {
          return parseFloat(h.total_value)
        }
      }
      
      // If no record found, return the oldest available
      return history.length > 0 ? parseFloat(history[history.length - 1].total_value) : null
    }

    const value7dAgo = findValueAtDate(date7d)
    const value30dAgo = findValueAtDate(date30d)
    const valueYtd = findValueAtDate(dateYtd)

    // Calculate performance for each period
    const calcPerformance = (oldValue: number | null, currentValue: number | null) => {
      if (!oldValue || !currentValue || oldValue === 0) return null
      const amount = currentValue - oldValue
      const percent = ((currentValue - oldValue) / oldValue) * 100
      return { amount, percent }
    }

    return NextResponse.json({
      history: history.slice(0, 365), // Max 1 year of daily data
      current: latestValue,
      periods: {
        '7d': calcPerformance(value7dAgo, latestValue),
        '30d': calcPerformance(value30dAgo, latestValue),
        'ytd': calcPerformance(valueYtd, latestValue)
      }
    })
  } catch (error: any) {
    console.error('Portfolio history error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
