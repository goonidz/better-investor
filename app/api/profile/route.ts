import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      }
    })
  } catch (error: any) {
    console.error('Get profile error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
