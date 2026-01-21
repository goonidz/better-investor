import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// POST - Restore holdings from a snapshot
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
    const { snapshot_id } = await request.json()

    if (!snapshot_id) {
      return NextResponse.json({ error: 'Missing snapshot_id' }, { status: 400 })
    }

    // Get the snapshot
    const { data: snapshot, error: snapshotError } = await supabase
      .from('import_history')
      .select('holdings_snapshot')
      .eq('id', snapshot_id)
      .eq('user_id', user.id)
      .single()

    if (snapshotError || !snapshot) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })
    }

    const holdingsToRestore = snapshot.holdings_snapshot as any[]

    if (!holdingsToRestore || holdingsToRestore.length === 0) {
      return NextResponse.json({ error: 'Snapshot is empty' }, { status: 400 })
    }

    // Get user's portfolio
    let { data: portfolios } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    let portfolioId: string

    if (!portfolios || portfolios.length === 0) {
      // Create portfolio
      const { data: newPortfolio, error: createError } = await supabase
        .from('portfolios')
        .insert({ user_id: user.id, name: 'My Portfolio' })
        .select('id')
        .single()

      if (createError || !newPortfolio) {
        return NextResponse.json({ error: 'Failed to create portfolio' }, { status: 500 })
      }
      portfolioId = newPortfolio.id
    } else {
      portfolioId = portfolios[0].id
    }

    // First, save current state as backup before restore
    const { data: currentHoldings } = await supabase
      .from('holdings')
      .select('*')
      .eq('portfolio_id', portfolioId)

    if (currentHoldings && currentHoldings.length > 0) {
      const currentTotal = currentHoldings.reduce((sum, h) => {
        if (h.current_value) return sum + parseFloat(h.current_value)
        if (h.current_price) return sum + parseFloat(h.quantity) * parseFloat(h.current_price)
        if (h.avg_price) return sum + parseFloat(h.quantity) * parseFloat(h.avg_price)
        return sum
      }, 0)

      await supabase
        .from('import_history')
        .insert({
          user_id: user.id,
          source_type: 'restore_backup',
          source_name: 'Auto-backup before restore',
          holdings_snapshot: currentHoldings,
          holdings_count: currentHoldings.length,
          total_value: currentTotal,
          note: `Auto-backup before restoring from ${snapshot_id}`
        })
    }

    // Delete current holdings
    await supabase
      .from('holdings')
      .delete()
      .eq('portfolio_id', portfolioId)

    // Insert restored holdings
    const holdingsToInsert = holdingsToRestore.map(h => ({
      portfolio_id: portfolioId,
      name: h.name,
      symbol: h.symbol,
      isin: h.isin,
      quantity: h.quantity,
      avg_price: h.avg_price,
      current_price: h.current_price,
      current_value: h.current_value,
      currency: h.currency,
      asset_type: h.asset_type,
      sector: h.sector
    }))

    const { error: insertError } = await supabase
      .from('holdings')
      .insert(holdingsToInsert)

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      restored_count: holdingsToInsert.length
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
