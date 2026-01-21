import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cron job to reset all credits on the 1st of each month
// Runs at 00:01 UTC on the 1st

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

    // Reset all user credits to 0
    const { data, error } = await supabase
      .from('user_credits')
      .update({
        credits_used_cents: 0,
        period_start: new Date().toISOString()
      })
      .neq('credits_used_cents', 0) // Only update users who have used credits
      .select('user_id')

    if (error) {
      console.error('Credits reset error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const resetCount = data?.length || 0
    console.log(`Credits reset for ${resetCount} users`)

    return NextResponse.json({
      success: true,
      message: `Credits reset for ${resetCount} users`,
      reset_date: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Credits reset failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
