import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET - List import history
export async function GET() {
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

  const { data: history, error } = await supabase
    .from('import_history')
    .select('id, import_date, source_type, source_name, holdings_count, total_value, note')
    .eq('user_id', user.id)
    .order('import_date', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ history: history || [] })
}

// POST - Create snapshot before import
export async function POST(request: NextRequest) {
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
    const { source_type, source_name, note } = await request.json()

    // Get user's portfolio
    const { data: portfolios } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    if (!portfolios || portfolios.length === 0) {
      // No portfolio yet, nothing to snapshot
      return NextResponse.json({ success: true, message: 'No existing holdings to snapshot' })
    }

    // Get current holdings
    const { data: holdings } = await supabase
      .from('holdings')
      .select('*')
      .eq('portfolio_id', portfolios[0].id)

    if (!holdings || holdings.length === 0) {
      return NextResponse.json({ success: true, message: 'No existing holdings to snapshot' })
    }

    // Calculate total value
    const totalValue = holdings.reduce((sum, h) => {
      if (h.current_value) return sum + parseFloat(h.current_value)
      if (h.current_price) return sum + parseFloat(h.quantity) * parseFloat(h.current_price)
      if (h.avg_price) return sum + parseFloat(h.quantity) * parseFloat(h.avg_price)
      return sum
    }, 0)

    // Save snapshot
    const { data: snapshot, error: insertError } = await supabase
      .from('import_history')
      .insert({
        user_id: user.id,
        source_type: source_type || 'unknown',
        source_name: source_name || null,
        holdings_snapshot: holdings,
        holdings_count: holdings.length,
        total_value: totalValue,
        note: note || null
      })
      .select('id')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      snapshot_id: snapshot.id,
      holdings_count: holdings.length
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete a snapshot
export async function DELETE(request: NextRequest) {
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

  const { searchParams } = new URL(request.url)
  const snapshotId = searchParams.get('id')

  if (!snapshotId) {
    return NextResponse.json({ error: 'Missing snapshot id' }, { status: 400 })
  }

  const { error } = await supabase
    .from('import_history')
    .delete()
    .eq('id', snapshotId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
