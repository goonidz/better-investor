import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cron job to snapshot all portfolio values daily
// Runs at 23:00 UTC every day

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  // Verify cron authentication
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const today = new Date().toISOString().split('T')[0]

    // Get all users with portfolios
    const { data: portfolios, error: portfoliosError } = await supabase
      .from('portfolios')
      .select('id, user_id')

    if (portfoliosError) {
      console.error('Failed to fetch portfolios:', portfoliosError)
      return NextResponse.json({ error: portfoliosError.message }, { status: 500 })
    }

    if (!portfolios || portfolios.length === 0) {
      return NextResponse.json({ success: true, message: 'No portfolios to snapshot', count: 0 })
    }

    let snapshotCount = 0
    const errors: string[] = []

    // Process each portfolio
    for (const portfolio of portfolios) {
      try {
        // Get holdings for this portfolio
        const { data: holdings } = await supabase
          .from('holdings')
          .select('quantity, avg_price, current_price, current_value')
          .eq('portfolio_id', portfolio.id)

        if (!holdings || holdings.length === 0) continue

        // Calculate total value and cost
        let totalValue = 0
        let totalCost = 0

        for (const h of holdings) {
          // Value: prefer current_value, then current_price * qty, then avg_price * qty
          if (h.current_value) {
            totalValue += parseFloat(h.current_value)
          } else if (h.current_price) {
            totalValue += parseFloat(h.quantity) * parseFloat(h.current_price)
          } else if (h.avg_price) {
            totalValue += parseFloat(h.quantity) * parseFloat(h.avg_price)
          }

          // Cost basis
          if (h.avg_price) {
            totalCost += parseFloat(h.quantity) * parseFloat(h.avg_price)
          }
        }

        // Upsert the snapshot (update if exists for today)
        const { error: upsertError } = await supabase
          .from('portfolio_history')
          .upsert({
            user_id: portfolio.user_id,
            date: today,
            total_value: totalValue,
            total_cost: totalCost,
            holdings_count: holdings.length
          }, {
            onConflict: 'user_id,date'
          })

        if (upsertError) {
          errors.push(`User ${portfolio.user_id}: ${upsertError.message}`)
        } else {
          snapshotCount++
        }
      } catch (err: any) {
        errors.push(`User ${portfolio.user_id}: ${err.message}`)
      }
    }

    console.log(`Portfolio snapshot: ${snapshotCount} saved, ${errors.length} errors`)

    return NextResponse.json({
      success: true,
      date: today,
      snapshots: snapshotCount,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('Portfolio snapshot failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
