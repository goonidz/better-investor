import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

type InsiderCategory = 
  | 'purchases' 
  | 'sales' 
  | 'cluster-buys'
  | 'penny-stock-buys'
  | 'purchases-25k'
  | 'sales-100k'
  | 'top-week'
  | 'top-month'

const CATEGORY_URLS: Record<InsiderCategory, string> = {
  'purchases': 'http://openinsider.com/insider-purchases',
  'sales': 'http://openinsider.com/insider-sales',
  'cluster-buys': 'http://openinsider.com/latest-cluster-buys',
  'penny-stock-buys': 'http://openinsider.com/latest-penny-stock-buys',
  'purchases-25k': 'http://openinsider.com/latest-insider-purchases-25k',
  'sales-100k': 'http://openinsider.com/latest-insider-sales-100k',
  'top-week': 'http://openinsider.com/top-insider-purchases-of-the-week',
  'top-month': 'http://openinsider.com/top-insider-purchases-of-the-month',
}

// Screener URLs for bulk historical data (used for seeding)
const SCREENER_URLS: Record<string, string> = {
  'purchases': 'http://openinsider.com/screener?s=&o=&pl=&ph=&ll=&lh=&fd=365&td=0&xp=1&xs=&xa=&xd=&xg=&xf=&xm=&xx=&xc=&xw=&vl=&vh=&ocl=&och=&session=&cnt=1000',
  'sales': 'http://openinsider.com/screener?s=&o=&pl=&ph=&ll=&lh=&fd=365&td=0&xp=&xs=1&xa=&xd=&xg=&xf=&xm=&xx=&xc=&xw=&vl=&vh=&ocl=&och=&sic1=-1&sicl=100&sich=9999&session=&cnt=1000',
  'cluster-buys': 'http://openinsider.com/screener?s=&o=&pl=&ph=&ll=&lh=&fd=365&td=0&xp=1&xs=&xa=&xd=&xg=&xf=&xm=&xx=&xc=&xw=&vl=25&vh=&ocl=&och=&sic1=-1&sicl=100&sich=9999&grp=1&session=&cnt=500',
}

// Scrape OpenInsider
async function scrapeOpenInsider(category: InsiderCategory = 'purchases', maxItems: number = 100, useSeed: boolean = false): Promise<any[]> {
  try {
    // Use screener URL for seed mode (more historical data), otherwise use regular URL
    let url = CATEGORY_URLS[category] || CATEGORY_URLS['purchases']
    if (useSeed && SCREENER_URLS[category]) {
      url = SCREENER_URLS[category]
    }
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }

    const html = await response.text()
    const tradeType = category.includes('sales') ? 'S' : 'P'
    return parseInsiderTable(html, tradeType, category, maxItems)
  } catch (error) {
    console.error('Scraping error:', error)
    return []
  }
}

function parseInsiderTable(html: string, defaultTradeType: string, category: string, maxItems: number = 100): any[] {
  const trades: any[] = []
  
  // Find all data rows (they have style="background:#...")
  const rowRegex = /<tr style="background:#[a-f0-9]+">(.+?)<\/tr>/gs
  const matches = html.matchAll(rowRegex)

  for (const match of matches) {
    const rowHtml = match[1]
    
    // Extract all td contents
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g
    const cells: string[] = []
    let tdMatch
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      cells.push(tdMatch[1])
    }

    // Need at least 17 cells for a valid row (all columns)
    if (cells.length < 13) continue

    // Columns:
    // 0: X (filing flag: A=Amended, D=Derivative, M=Multiple)
    // 1: Filing date
    // 2: Trade date
    // 3: Ticker
    // 4: Company name
    // 5: Insider name
    // 6: Title
    // 7: Trade type
    // 8: Price
    // 9: Qty
    // 10: Owned
    // 11: ΔOwn
    // 12: Value
    // 13: 1d (optional)
    // 14: 1w (optional)
    // 15: 1m (optional)
    // 16: 6m (optional)

    // Extract filing flag (X column)
    const filingFlag = cleanText(cells[0]) || null

    // Extract ticker
    const tickerCell = cells[3]
    const tickerMatch = tickerCell.match(/>([A-Z0-9]+)<\/a><\/b>/i)
    const ticker = tickerMatch ? tickerMatch[1].toUpperCase() : null
    
    if (!ticker) continue

    // Extract company name
    const companyCell = cells[4]
    const companyMatch = companyCell.match(/>([^<]+)<\/a>/)
    const companyName = companyMatch ? decodeHtmlEntities(companyMatch[1].trim()) : ticker

    // Extract insider name
    const insiderCell = cells[5]
    const insiderMatch = insiderCell.match(/>([^<]+)<\/a>/)
    const insiderName = insiderMatch ? decodeHtmlEntities(insiderMatch[1].trim()) : 'Unknown'

    // Extract title
    const title = cleanText(cells[6]) || null

    // Extract transaction type
    const transactionCell = cleanText(cells[7])
    let tradeType = defaultTradeType
    if (transactionCell.includes('Sale')) {
      tradeType = 'S'
    } else if (transactionCell.includes('Purchase')) {
      tradeType = 'P'
    }

    // Extract filing date
    const filingDateMatch = cells[1].match(/(\d{4}-\d{2}-\d{2})\s*(\d{2}:\d{2}:\d{2})?/)
    const filingDate = filingDateMatch 
      ? `${filingDateMatch[1]}T${filingDateMatch[2] || '00:00:00'}` 
      : null

    // Extract trade date
    const tradeDateMatch = cells[2].match(/(\d{4}-\d{2}-\d{2})/)
    const tradeDate = tradeDateMatch ? tradeDateMatch[1] : null

    // Extract numeric fields
    const price = parseNumber(cleanText(cells[8]))
    const quantity = parseInteger(cleanText(cells[9]))
    const owned = parseInteger(cleanText(cells[10]))
    const deltaOwn = cleanText(cells[11]) || null
    const value = parseNumber(cleanText(cells[12]))

    // Extract performance columns (if available)
    const perf1d = cells.length > 13 ? parsePercentage(cleanText(cells[13])) : null
    const perf1w = cells.length > 14 ? parsePercentage(cleanText(cells[14])) : null
    const perf1m = cells.length > 15 ? parsePercentage(cleanText(cells[15])) : null
    const perf6m = cells.length > 16 ? parsePercentage(cleanText(cells[16])) : null

    if (filingDate && ticker) {
      trades.push({
        filing_date: filingDate,
        trade_date: tradeDate || filingDate.split('T')[0],
        ticker,
        company_name: companyName,
        insider_name: insiderName,
        insider_title: title,
        trade_type: tradeType,
        price,
        quantity: Math.abs(quantity || 0),
        owned,
        delta_own: deltaOwn,
        value: Math.abs(value || 0),
        filing_flag: filingFlag,
        perf_1d: perf1d,
        perf_1w: perf1w,
        perf_1m: perf1m,
        perf_6m: perf6m,
        source_category: category
      })
    }
  }

  return trades.slice(0, maxItems)
}

function cleanText(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function parseNumber(str: string): number | null {
  if (!str) return null
  const clean = str.replace(/[$,+\s]/g, '')
  const num = parseFloat(clean)
  return isNaN(num) ? null : num
}

function parseInteger(str: string): number | null {
  if (!str) return null
  const clean = str.replace(/[$,+\s]/g, '')
  const num = parseInt(clean)
  return isNaN(num) ? null : num
}

function parsePercentage(str: string): number | null {
  if (!str) return null
  const clean = str.replace(/[%,+\s]/g, '')
  const num = parseFloat(clean)
  return isNaN(num) ? null : num
}

// GET - Fetch insider trades from database OR scrape directly
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = (searchParams.get('category') || 'purchases') as InsiderCategory
    const limit = parseInt(searchParams.get('limit') || '50')
    const live = searchParams.get('live') === 'true'
    const isCron = searchParams.get('cron') === 'true'
    
    // Handle cron job (daily automatic sync)
    if (isCron) {
      const vercelCron = request.headers.get('x-vercel-cron')
      const authHeader = request.headers.get('authorization')
      const cronSecret = process.env.CRON_SECRET
      
      if (!vercelCron && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      // Run the sync for ALL categories
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const allCategories: InsiderCategory[] = [
        'purchases', 'sales', 'cluster-buys', 'purchases-25k', 
        'sales-100k', 'top-week', 'top-month'
      ]
      const results = await Promise.all(allCategories.map(cat => scrapeOpenInsider(cat)))
      const allTrades = results.flat()
      
      let inserted = 0
      for (const trade of allTrades) {
        const { error } = await supabase
          .from('insider_trades')
          .upsert(trade, { 
            onConflict: 'filing_date,ticker,insider_name,trade_type,quantity,source_category',
          })
        if (!error) inserted++
      }
      
      // Generate AI insight after scraping
      try {
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : 'http://localhost:3000'
        await fetch(`${baseUrl}/api/insider-insights`, { method: 'POST' })
      } catch (e) {
        console.error('Failed to generate insight:', e)
      }

      return NextResponse.json({ 
        message: 'Cron sync complete', 
        scraped: allTrades.length,
        inserted,
        timestamp: new Date().toISOString()
      })
    }
    
    // Live scraping (no save)
    if (live) {
      const trades = await scrapeOpenInsider(category)
      return NextResponse.json({ trades, source: 'live' })
    }

    // Fetch from database filtered by category
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('insider_trades')
      .select('*')
      .eq('source_category', category)
      .order('filing_date', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ trades: data || [], source: 'database' })
  } catch (error: any) {
    console.error('GET error:', error)
    return NextResponse.json({ trades: [], error: error.message }, { status: 200 })
  }
}

// POST - Scrape and update insider trades
// Add ?seed=true for initial large import (500 items per category)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const category = (searchParams.get('category') || 'all') as InsiderCategory | 'all'
    const isSeed = searchParams.get('seed') === 'true'
    const maxItems = isSeed ? 500 : 100 // 500 for initial seed, 100 for daily updates

    let allTrades: any[] = []

    if (category === 'all') {
      // Scrape ALL categories
      const allCategories: InsiderCategory[] = [
        'purchases', 'sales', 'cluster-buys', 'purchases-25k', 
        'sales-100k', 'top-week', 'top-month'
      ]
      const results = await Promise.all(allCategories.map(cat => scrapeOpenInsider(cat, maxItems, isSeed)))
      allTrades = results.flat()
    } else {
      allTrades = await scrapeOpenInsider(category, maxItems, isSeed)
    }
    
    if (allTrades.length === 0) {
      return NextResponse.json({ message: 'No trades scraped', count: 0 })
    }

    // Insert trades
    let inserted = 0
    for (const trade of allTrades) {
      const { error } = await supabase
        .from('insider_trades')
        .upsert(trade, { 
          onConflict: 'filing_date,ticker,insider_name,trade_type,quantity,source_category',
        })
      
      if (!error) inserted++
    }

    return NextResponse.json({ 
      message: 'Scraping complete', 
      scraped: allTrades.length,
      inserted
    })
  } catch (error: any) {
    console.error('POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
