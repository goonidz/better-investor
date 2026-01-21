import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'

// Get conversations (user gets their own, admin gets all)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = await isAdmin(user.id)
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    let query = supabase
      .from('support_conversations')
      .select(`
        *,
        support_messages (
          id,
          content,
          sender_type,
          created_at,
          read_at
        )
      `)
      .order('updated_at', { ascending: false })

    if (!admin) {
      query = query.eq('user_id', user.id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    // Add unread count and last message
    const conversations = data?.map(conv => {
      const messages = conv.support_messages || []
      const unreadCount = admin 
        ? messages.filter((m: any) => m.sender_type === 'user' && !m.read_at).length
        : messages.filter((m: any) => m.sender_type === 'admin' && !m.read_at).length
      const lastMessage = messages.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]

      return {
        ...conv,
        unread_count: unreadCount,
        last_message: lastMessage,
        support_messages: undefined, // Remove full messages array
      }
    })

    return NextResponse.json({ conversations })
  } catch (error: any) {
    console.error('Get conversations error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Create new conversation (users only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { subject, message } = await request.json()

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('support_conversations')
      .insert({
        user_id: user.id,
        subject: subject || 'Support Request',
        status: 'open',
      })
      .select()
      .single()

    if (convError) throw convError

    // Add first message
    const { error: msgError } = await supabase
      .from('support_messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        sender_type: 'user',
        content: message,
      })

    if (msgError) throw msgError

    return NextResponse.json({ conversation })
  } catch (error: any) {
    console.error('Create conversation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
