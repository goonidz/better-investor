import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { hasCredits, checkAndConsumeCredits, MONTHLY_LIMIT_CREDITS } from '@/lib/credits'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check credits before making AI call
    const canUseAI = await hasCredits(supabase, user.id)
    if (!canUseAI) {
      return NextResponse.json({ 
        error: 'Monthly credit limit reached. Credits reset on the 1st of each month.',
        credits_exhausted: true
      }, { status: 429 })
    }

    const { holdings, profile } = await request.json()

    if (!holdings || holdings.length === 0) {
      return NextResponse.json({ error: 'No holdings provided' }, { status: 400 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'No profile provided' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      tools: [{
        googleSearch: {}
      }] as any,
    })

    const totalValue = holdings.reduce((sum: number, h: any) => sum + (h.quantity * h.avg_price), 0)
    
    const holdingsSummary = holdings.map((h: any) => {
      const value = h.quantity * h.avg_price
      const percentage = ((value / totalValue) * 100).toFixed(1)
      return `- ${h.name} (${h.symbol || h.isin || 'N/A'}): ${h.quantity} units @ ${h.avg_price} ${h.currency}, Total: ${value.toFixed(2)} ${h.currency} (${percentage}%), Type: ${h.asset_type || 'Unknown'}`
    }).join('\n')

    // Build profile context
    const horizonContext = {
      short: 'less than 2 years - they need liquidity soon',
      medium: '2-7 years - medium-term planning',
      long: '7+ years - can ride out volatility'
    }[profile.investment_horizon] || profile.investment_horizon

    const riskContext = {
      conservative: 'Conservative - prioritizes capital preservation over growth',
      moderate: 'Moderate - accepts some volatility for better returns',
      aggressive: 'Aggressive - comfortable with high volatility for maximum growth'
    }[profile.risk_tolerance] || profile.risk_tolerance

    const goalContext = {
      retirement: 'building retirement savings',
      growth: 'growing wealth over time',
      income: 'generating regular income',
      preservation: 'preserving existing capital'
    }[profile.investment_goal] || profile.investment_goal

    const experienceContext = {
      beginner: 'BEGINNER - use simple language, explain financial terms, avoid jargon',
      intermediate: 'INTERMEDIATE - can use some technical terms with brief explanations',
      advanced: 'ADVANCED - can use sophisticated financial concepts directly'
    }[profile.experience_level] || profile.experience_level

    const prompt = `You are a financial educator. Your task is to provide PERSONALIZED educational content about a portfolio.

## INVESTOR PROFILE (CRITICAL - Personalize ALL content to this profile)
- Experience: ${experienceContext}
- Time horizon: ${horizonContext}
- Risk profile: ${riskContext}  
- Goal: ${goalContext}

## PERSONALIZATION REQUIREMENTS
1. Language complexity MUST match experience level:
   ${profile.experience_level === 'beginner' ? '- Use simple words, explain every concept, give analogies' : profile.experience_level === 'intermediate' ? '- Balance technical and simple language' : '- Use precise financial terminology'}
2. All educational content must relate to their ${profile.investment_horizon}-term horizon
3. Frame everything through their ${profile.risk_tolerance} risk perspective
4. Connect insights to their goal of ${goalContext}

## Portfolio
Total: €${totalValue.toFixed(2)} | Positions: ${holdings.length}

${holdingsSummary}

## RULES
- EDUCATIONAL ONLY, not financial advice
- NO buy/sell recommendations
- NO technical analysis or chart patterns
- NO "you should" or "I recommend"
- Search web for current news/data

## IMPORTANT: Search for recent news (last 7 days) about the TOP holdings only
- Focus ONLY on the 3-5 largest positions (by value)
- Only include news that is MATERIAL and could impact the investment
- Skip minor news, PR announcements, analyst ratings
- Look for: earnings reports, major product launches, regulatory changes, significant partnerships, leadership changes AND relevant academic research

## SCIENTIFIC STUDIES REQUIREMENT
Search for and include relevant academic/scientific studies. Examples:
- For long-term investors: studies on buy-and-hold vs active trading, compound interest research
- For conservative profiles: research on bond allocation, capital preservation strategies studies
- For aggressive profiles: studies on equity risk premium, growth investing research
- For beginners: behavioral finance studies (loss aversion, overconfidence bias)
- For retirement goal: Trinity study, safe withdrawal rate research
- For diversification: Markowitz Modern Portfolio Theory, correlation studies
- For concentrated portfolios: studies on single-stock risk, diversification benefits research

## OUTPUT (JSON only, no markdown)
{
  "summary": "15 words max - mention their ${profile.investment_goal} goal",
  "profile_note": "One sentence explaining how this analysis is tailored to their ${profile.experience_level} level and ${profile.risk_tolerance} risk profile",
  "market_context": "2-3 sentences about market conditions - ${profile.experience_level === 'beginner' ? 'explain simply what this means for regular people' : 'relate to their investment horizon'}",
  "portfolio_fit_score": 1-10,
  "portfolio_fit_feedback": "Evaluate how well this portfolio MATCHES their investor profile (${profile.investment_horizon} horizon, ${profile.risk_tolerance} risk tolerance, ${profile.investment_goal} goal, ${profile.experience_level} level). Score 10 = perfect match, 1 = completely misaligned. Explain ${profile.experience_level === 'beginner' ? 'simply' : 'clearly'} what's aligned or misaligned.",
  "educational_note": "One concept specifically useful for a ${profile.experience_level} investor focused on ${goalContext}",
  "scientific_studies": [
    {
      "title": "Study name or research paper title",
      "authors": "Author names or institution (e.g., 'Fama & French' or 'Vanguard Research')",
      "year": "Publication year if known, or 'N/A'",
      "what": "1-2 sentences explaining what this study is about and what it measured/analyzed",
      "finding": "Key finding explained ${profile.experience_level === 'beginner' ? 'in very simple terms anyone can understand' : 'clearly'}",
      "relevance": "Why this matters for their specific situation (${profile.investment_horizon} horizon, ${profile.risk_tolerance} risk, ${profile.investment_goal} goal)"
    }
  ],
  "insights": [
    {
      "type": "news|education|risk",
      "title": "Short title",
      "description": "${profile.experience_level === 'beginner' ? 'Simple explanation anyone can understand' : 'Clear explanation with appropriate detail'}",
      "ticker": "ticker or null"
    }
  ],
  "recent_news": [
    {
      "holding_name": "Name of the holding this news is about",
      "ticker": "Ticker symbol",
      "headline": "News headline",
      "summary": "1-2 sentences explaining what happened",
      "date": "Date of news (e.g., 'Jan 20, 2026' or '2 days ago')",
      "source": "News source (e.g., 'Bloomberg', 'Reuters', 'Company PR')",
      "impact": "Why this matters for an investor holding this position"
    }
  ]
}

Provide 2-3 relevant scientific studies, 3-4 insights, and 2-4 recent news items (ONLY for top holdings with material news). EVERY response must clearly reflect the investor's profile.`

    console.log('Sending prompt with profile:', profile)

    const result = await model.generateContent(prompt)
    const response = result.response
    const textResponse = response.text()

    // Consume credits based on token usage
    const inputTokens = result.response.usageMetadata?.promptTokenCount || 2000
    const outputTokens = result.response.usageMetadata?.candidatesTokenCount || 1000
    const creditResult = await checkAndConsumeCredits(supabase, user.id, inputTokens, outputTokens)
    
    if (!creditResult.success) {
      return NextResponse.json({ 
        error: creditResult.error,
        credits_exhausted: true
      }, { status: 429 })
    }
    
    let cleanedResponse = textResponse
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim()

    let insights
    try {
      insights = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', textResponse)
      return NextResponse.json({ 
        error: 'Failed to parse AI response',
        raw: textResponse 
      }, { status: 500 })
    }

    // Save to database
    const { data: savedInsight, error: saveError } = await supabase
      .from('insights')
      .insert({
        user_id: user.id,
        summary: insights.summary,
        market_context: insights.market_context,
        diversification_score: insights.portfolio_fit_score,
        diversification_feedback: insights.portfolio_fit_feedback,
        educational_note: insights.educational_note,
        insights: insights.insights,
        scientific_studies: insights.scientific_studies,
        recent_news: insights.recent_news,
        profile_note: insights.profile_note,
        holdings_snapshot: holdings
      })
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save insight:', saveError)
    }

    return NextResponse.json({ 
      success: true,
      data: {
        id: savedInsight?.id,
        ...insights,
        profile_note: insights.profile_note
      },
      generated_at: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Insights API error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to generate insights' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '10'

    // Get all insights for the user, ordered by most recent
    const { data: insights, error } = await supabase
      .from('insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))

    if (error) {
      console.error('Insights GET error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!insights || insights.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const formattedInsights = insights.map(insight => ({
      id: insight.id,
      summary: insight.summary,
      profile_note: insight.profile_note,
      market_context: insight.market_context,
      diversification_score: insight.diversification_score,
      diversification_feedback: insight.diversification_feedback,
      educational_note: insight.educational_note,
      scientific_studies: insight.scientific_studies,
      recent_news: insight.recent_news,
      insights: insight.insights,
      created_at: insight.created_at
    }))

    return NextResponse.json({ data: formattedInsights })

  } catch (error: any) {
    console.error('Insights GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
