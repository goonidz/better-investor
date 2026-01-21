import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'

// Get conversation with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = await isAdmin(user.id)

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('support_conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (convError) throw convError

    // Check access
    if (!admin && conversation.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from('support_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (msgError) throw msgError

    // Mark messages as read
    const unreadMessages = messages?.filter(m => 
      admin ? m.sender_type === 'user' && !m.read_at : m.sender_type === 'admin' && !m.read_at
    )

    if (unreadMessages?.length) {
      await supabase
        .from('support_messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadMessages.map(m => m.id))
    }

    return NextResponse.json({ conversation, messages })
  } catch (error: any) {
    console.error('Get conversation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Send message to conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = await isAdmin(user.id)
    const { content } = await request.json()

    // Verify access
    const { data: conversation } = await supabase
      .from('support_conversations')
      .select('user_id')
      .eq('id', conversationId)
      .single()

    if (!admin && conversation?.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Send message
    const { data: message, error } = await supabase
      .from('support_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_type: admin ? 'admin' : 'user',
        content,
      })
      .select()
      .single()

    if (error) throw error

    // If admin is responding, set status to pending (waiting for user)
    // If user is responding, set status to open (waiting for admin)
    await supabase
      .from('support_conversations')
      .update({ 
        status: admin ? 'pending' : 'open',
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)

    return NextResponse.json({ message })
  } catch (error: any) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Update conversation status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = await isAdmin(user.id)
    if (!admin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { status } = await request.json()

    const { data, error } = await supabase
      .from('support_conversations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ conversation: data })
  } catch (error: any) {
    console.error('Update conversation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
