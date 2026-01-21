import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin()
    const { userId } = await params
    const supabase = await createClient()

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Get holdings
    const { data: holdings } = await supabase
      .from('holdings')
      .select('*')
      .eq('user_id', userId)
      .order('current_value', { ascending: false })

    // Get AI credits
    const { data: credits } = await supabase
      .from('ai_credits')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Get chat conversations count
    const { count: chatCount } = await supabase
      .from('chat_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get support conversations
    const { data: supportConversations } = await supabase
      .from('support_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    const portfolioValue = holdings?.reduce((sum, h) => sum + (h.current_value || 0), 0) || 0
    const totalGainLoss = holdings?.reduce((sum, h) => {
      const cost = (h.quantity || 0) * (h.purchase_price || 0)
      const current = h.current_value || 0
      return sum + (current - cost)
    }, 0) || 0

    return NextResponse.json({
      subscription,
      holdings,
      credits,
      chatCount: chatCount || 0,
      supportConversations,
      stats: {
        portfolioValue,
        totalGainLoss,
        holdingsCount: holdings?.length || 0,
      }
    })
  } catch (error: any) {
    console.error('Admin user detail error:', error)
    return NextResponse.json({ error: error.message }, { status: error.message === 'Not authorized' ? 403 : 500 })
  }
}

// Update user subscription
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin()
    const { userId } = await params
    const body = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        plan: body.plan,
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ subscription: data })
  } catch (error: any) {
    console.error('Admin update user error:', error)
    return NextResponse.json({ error: error.message }, { status: error.message === 'Not authorized' ? 403 : 500 })
  }
}
