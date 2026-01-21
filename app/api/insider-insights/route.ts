import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// GET - Fetch latest insight from database
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase
      .from('insider_insights')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({ insight: data || null })
  } catch (error: any) {
    console.error('GET insight error:', error)
    return NextResponse.json({ insight: null, error: error.message })
  }
}

// POST - Generate new insight (called by cron after scraping)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check if we already have an insight for today
    const today = new Date().toISOString().split('T')[0]
    const { data: existing } = await supabase
      .from('insider_insights')
      .select('*')
      .gte('created_at', `${today}T00:00:00`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existing) {
      // Return the existing insight instead of skipping
      return NextResponse.json({ insight: existing, cached: true })
    }

    // Fetch recent trades from DB
    const { data: trades } = await supabase
      .from('insider_trades')
      .select('*')
      .order('filing_date', { ascending: false })
      .limit(200)

    if (!trades || trades.length === 0) {
      return NextResponse.json({ message: 'No trades to analyze', skipped: true })
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            headline: { type: SchemaType.STRING, description: 'One impactful factual sentence headline' },
            summary: { type: SchemaType.STRING, description: '2-3 sentences factual summary of key insider activity' },
            notable_buys: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  ticker: { type: SchemaType.STRING },
                  company: { type: SchemaType.STRING, description: 'Brief company description (what they do)' },
                  activity: { type: SchemaType.STRING, description: 'Factual description of the insider activity (who bought, how much)' }
                }
              },
              description: 'Top 3 most significant buy signals'
            },
            notable_sells: {
              type: SchemaType.ARRAY, 
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  ticker: { type: SchemaType.STRING },
                  company: { type: SchemaType.STRING, description: 'Brief company description (what they do)' },
                  activity: { type: SchemaType.STRING, description: 'Factual description of the insider activity (who sold, how much)' }
                }
              },
              description: 'Top 3 most significant sell signals'
            },
            sentiment: { 
              type: SchemaType.STRING, 
              enum: ['bullish', 'bearish', 'neutral'],
              description: 'Overall insider sentiment based on data'
            }
          },
          required: ['headline', 'summary', 'sentiment']
        }
      }
    })

    // Summarize trades data for the prompt
    const buyTrades = trades.filter((t: any) => t.trade_type === 'P')
    const sellTrades = trades.filter((t: any) => t.trade_type === 'S')
    
    const totalBuyValue = buyTrades.reduce((sum: number, t: any) => sum + (t.value || 0), 0)
    const totalSellValue = sellTrades.reduce((sum: number, t: any) => sum + (t.value || 0), 0)
    
    // Get top trades by value
    const topBuys = buyTrades
      .sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
      .slice(0, 10)
      .map((t: any) => `${t.ticker} (${t.company_name}): $${((t.value || 0)/1000000).toFixed(1)}M by ${t.insider_name} - ${t.insider_title || 'insider'}`)
    
    const topSells = sellTrades
      .sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
      .slice(0, 10)
      .map((t: any) => `${t.ticker} (${t.company_name}): $${((t.value || 0)/1000000).toFixed(1)}M by ${t.insider_name} - ${t.insider_title || 'insider'}`)

    // Find cluster activity (multiple insiders same stock)
    const tickerCounts: Record<string, { buys: number, sells: number, value: number, company: string }> = {}
    trades.forEach((t: any) => {
      if (!tickerCounts[t.ticker]) {
        tickerCounts[t.ticker] = { buys: 0, sells: 0, value: 0, company: t.company_name }
      }
      if (t.trade_type === 'P') {
        tickerCounts[t.ticker].buys++
      } else {
        tickerCounts[t.ticker].sells++
      }
      tickerCounts[t.ticker].value += t.value || 0
    })
    
    const clusterActivity = Object.entries(tickerCounts)
      .filter(([_, data]) => data.buys >= 2 || data.sells >= 2)
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 5)
      .map(([ticker, data]) => `${ticker} (${data.company}): ${data.buys} buys, ${data.sells} sells, total $${(data.value/1000000).toFixed(1)}M`)

    const prompt = `Analyze this weekly insider trading activity and provide key factual takeaways.

STATISTICS:
- Total buy transactions: ${buyTrades.length} worth $${(totalBuyValue/1000000).toFixed(1)}M
- Total sell transactions: ${sellTrades.length} worth $${(totalSellValue/1000000).toFixed(1)}M
- Buy/Sell ratio: ${sellTrades.length > 0 ? (buyTrades.length / sellTrades.length).toFixed(2) : 'N/A'}

TOP PURCHASES:
${topBuys.join('\n') || 'None'}

TOP SALES:
${topSells.join('\n') || 'None'}

CLUSTER ACTIVITY (multiple insiders same stock):
${clusterActivity.join('\n') || 'None detected'}

STRICT RULES:
- NEVER give investment advice, recommendations, or suggestions to buy/sell
- NEVER use words like "consider", "should", "opportunity", "recommend", "attractive", "promising"
- Only state FACTS about what insiders did
- Be neutral and educational
- For each notable ticker, include a brief description of what the company does

Provide a factual summary focusing on:
1. What insiders actually did (who, how much, when)
2. Cluster patterns (multiple insiders on same stock)
3. Overall market sentiment based purely on the data`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    
    let insight
    try {
      insight = JSON.parse(text)
    } catch {
      insight = { 
        headline: 'Insider activity analysis available',
        summary: text.slice(0, 300),
        sentiment: 'neutral'
      }
    }

    // Save to database
    const { error: insertError } = await supabase
      .from('insider_insights')
      .insert({
        headline: insight.headline,
        summary: insight.summary,
        notable_buys: insight.notable_buys || [],
        notable_sells: insight.notable_sells || [],
        sentiment: insight.sentiment
      })

    if (insertError) throw insertError

    return NextResponse.json({ insight, saved: true })
  } catch (error: any) {
    console.error('POST insight error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
