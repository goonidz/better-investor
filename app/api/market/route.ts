import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY
const CACHE_DURATION_HOURS = 24 // Only refresh once per day

interface QuoteData {
  symbol: string
  price: number
  change: number
  changePercent: number
  currency: string
  previousClose?: number
  latestTradingDay?: string
  open?: number
  high?: number
  low?: number
}

async function fetchQuoteFromAPI(symbol: string): Promise<QuoteData | null> {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.error('Alpha Vantage API key not configured')
    return null
  }

  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`
    
    console.log('Fetching quote for:', symbol)
    const response = await fetch(url)
    const data = await response.json()
    console.log('Alpha Vantage response:', JSON.stringify(data, null, 2))

    if (data['Global Quote'] && data['Global Quote']['05. price']) {
      const quote = data['Global Quote']
      return {
        symbol: quote['01. symbol'] || symbol,
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change'] || '0'),
        changePercent: parseFloat((quote['10. change percent'] || '0%').replace('%', '')),
        currency: 'USD',
        previousClose: parseFloat(quote['08. previous close'] || '0'),
        latestTradingDay: quote['07. latest trading day'],
        open: parseFloat(quote['02. open'] || '0'),
        high: parseFloat(quote['03. high'] || '0'),
        low: parseFloat(quote['04. low'] || '0')
      }
    }

    if (data['Note']) {
      console.warn('Alpha Vantage rate limit:', data['Note'])
    }
    if (data['Error Message']) {
      console.error('Alpha Vantage error for', symbol, ':', data['Error Message'])
    }

    return null
  } catch (error) {
    console.error(`Failed to fetch quote for ${symbol}:`, error)
    return null
  }
}

// Search for a symbol using Alpha Vantage SYMBOL_SEARCH
async function searchSymbol(query: string): Promise<string | null> {
  if (!ALPHA_VANTAGE_API_KEY) return null

  try {
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${ALPHA_VANTAGE_API_KEY}`
    
    const response = await fetch(url)
    const data = await response.json()

    if (data['bestMatches'] && data['bestMatches'].length > 0) {
      // Return the best match symbol
      return data['bestMatches'][0]['1. symbol']
    }

    return null
  } catch (error) {
    console.error('Symbol search failed:', error)
    return null
  }
}

function isCacheStale(updatedAt: string): boolean {
  const cacheTime = new Date(updatedAt).getTime()
  const now = Date.now()
  const hoursSinceUpdate = (now - cacheTime) / (1000 * 60 * 60)
  return hoursSinceUpdate >= CACHE_DURATION_HOURS
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()

    // Refresh all unique symbols from all users' holdings
    if (action === 'refresh_all') {
      // Get all unique symbols across all holdings
      const { data: allSymbols } = await supabase
        .from('holdings')
        .select('symbol')
        .not('symbol', 'is', null)
        .not('symbol', 'eq', '')

      if (!allSymbols || allSymbols.length === 0) {
        return NextResponse.json({ error: 'No symbols found' }, { status: 404 })
      }

      // Get unique symbols
      const uniqueSymbols = [...new Set(allSymbols.map(h => h.symbol).filter(Boolean))]
      
      // Check which symbols need updating (cache stale or missing)
      const { data: cachedPrices } = await supabase
        .from('market_prices')
        .select('symbol, updated_at')
        .in('symbol', uniqueSymbols)

      const cachedMap = new Map(cachedPrices?.map(p => [p.symbol, p.updated_at]) || [])
      
      const symbolsToUpdate = uniqueSymbols.filter(symbol => {
        const cachedAt = cachedMap.get(symbol)
        return !cachedAt || isCacheStale(cachedAt)
      })

      if (symbolsToUpdate.length === 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'All prices are up to date',
          updated: 0,
          fromCache: uniqueSymbols.length
        })
      }

      const results: { symbol: string; success: boolean; price?: number; error?: string }[] = []
      
      // Fetch and update each symbol (with rate limiting)
      for (const symbol of symbolsToUpdate) {
        const quote = await fetchQuoteFromAPI(symbol)
        
        if (quote) {
          // Upsert into cache
          await supabase
            .from('market_prices')
            .upsert({
              symbol: symbol,
              price: quote.price,
              change: quote.change,
              change_percent: quote.changePercent,
              currency: quote.currency,
              source: 'alphavantage',
              updated_at: new Date().toISOString()
            }, { onConflict: 'symbol' })

          results.push({ symbol, success: true, price: quote.price })
        } else {
          results.push({ symbol, success: false, error: 'Failed to fetch' })
        }

        // Rate limiting: 5 requests per minute for free tier
        if (symbolsToUpdate.indexOf(symbol) < symbolsToUpdate.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 12000))
        }
      }

      // Now update all holdings with the new cached prices
      await updateHoldingsFromCache(supabase)

      return NextResponse.json({ 
        success: true, 
        updated: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        skipped: uniqueSymbols.length - symbolsToUpdate.length,
        results 
      })
    }

    // Update holdings from cache (no API calls)
    if (action === 'sync_from_cache') {
      const updated = await updateHoldingsFromCache(supabase, user.id)
      return NextResponse.json({ success: true, updated })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('Market API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function updateHoldingsFromCache(supabase: any, userId?: string) {
  // Get all cached prices
  const { data: cachedPrices } = await supabase
    .from('market_prices')
    .select('symbol, price')

  if (!cachedPrices || cachedPrices.length === 0) return 0

  const priceMap = new Map(cachedPrices.map((p: any) => [p.symbol, p.price]))

  // Get holdings to update
  let query = supabase
    .from('holdings')
    .select('id, symbol, quantity')
    .not('symbol', 'is', null)

  if (userId) {
    // Get user's portfolio first
    const { data: portfolios } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', userId)

    if (portfolios && portfolios.length > 0) {
      query = query.eq('portfolio_id', portfolios[0].id)
    }
  }

  const { data: holdings } = await query

  if (!holdings) return 0

  // Batch update: prepare all updates
  const updates = holdings
    .filter((h: any) => priceMap.has(h.symbol))
    .map((h: any) => ({
      id: h.id,
      current_price: priceMap.get(h.symbol),
      current_value: h.quantity * priceMap.get(h.symbol)
    }))

  if (updates.length === 0) return 0

  // Use Promise.all for parallel updates (much faster than sequential)
  await Promise.all(
    updates.map((u: any) => 
      supabase
        .from('holdings')
        .update({ current_price: u.current_price, current_value: u.current_value })
        .eq('id', u.id)
    )
  )

  return updates.length
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    if (symbol) {
      // Get single symbol from cache
      const { data: cached } = await supabase
        .from('market_prices')
        .select('*')
        .eq('symbol', symbol)
        .single()

      if (cached && !isCacheStale(cached.updated_at)) {
        return NextResponse.json({
          ...cached,
          fromCache: true
        })
      }

      // Fetch fresh if not in cache or stale
      const quote = await fetchQuoteFromAPI(symbol)
      if (quote) {
        await supabase
          .from('market_prices')
          .upsert({
            symbol: symbol,
            price: quote.price,
            change: quote.change,
            change_percent: quote.changePercent,
            currency: quote.currency,
            source: 'alphavantage',
            updated_at: new Date().toISOString()
          }, { onConflict: 'symbol' })

        return NextResponse.json({ ...quote, fromCache: false })
      }

      return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 })
    }

    // Get all cached prices
    const { data: prices } = await supabase
      .from('market_prices')
      .select('*')
      .order('updated_at', { ascending: false })

    return NextResponse.json({ prices: prices || [] })

  } catch (error: any) {
    console.error('Market GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
