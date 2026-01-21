import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('investment_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ data: profile || null })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { investment_horizon, risk_tolerance, investment_goal, experience_level } = body

    // Upsert profile
    const { data: profile, error } = await supabase
      .from('investment_profiles')
      .upsert({
        user_id: user.id,
        investment_horizon,
        risk_tolerance,
        investment_goal,
        experience_level,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ data: profile })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
