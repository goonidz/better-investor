import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ isAdmin: false })
    }

    const admin = await isAdmin(user.id)

    return NextResponse.json({ isAdmin: admin })
  } catch (error) {
    return NextResponse.json({ isAdmin: false })
  }
}
