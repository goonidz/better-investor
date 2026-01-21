import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

// Pricing: Gemini 3 Flash Preview (per 1M tokens)
// Input: $0.50/1M tokens, Output: $3.00/1M tokens
// 
// Credit system: 1 credit = $0.001 (1/10 cent)
// Monthly limit: 2500 credits = $2.50
//
// Average message (~500 input + 300 output tokens):
// - Input cost: 500/1M * $0.50 = $0.00025 = 0.25 credits
// - Output cost: 300/1M * $3.00 = $0.0009 = 0.9 credits
// - Total: ~1.15 credits per message
// - With 2500 credits: ~2000 messages/month
//
const INPUT_COST_PER_MILLION = 0.50  // $0.50
const OUTPUT_COST_PER_MILLION = 3.00 // $3.00
const MONTHLY_LIMIT_CREDITS = 2500 // = $2.50
const WARNING_THRESHOLD_CREDITS = 2000 // 80%

function calculateCredits(inputTokens: number, outputTokens: number): number {
  // Convert to credits (1 credit = $0.001)
  const inputCredits = (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION * 1000
  const outputCredits = (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION * 1000
  return inputCredits + outputCredits
}

async function getOrCreateCredits(supabase: any, userId: string) {
  let { data: credits, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !credits) {
    const { data: newCredits, error: insertError } = await supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        credits_used_cents: 0, // Using same column, but now represents "credits" not cents
        period_start: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create credits:', insertError)
      return null
    }
    return newCredits
  }

  // Check if we need to reset (new month)
  const periodStart = new Date(credits.period_start)
  const now = new Date()
  if (periodStart.getMonth() !== now.getMonth() || periodStart.getFullYear() !== now.getFullYear()) {
    const { data: updatedCredits, error: updateError } = await supabase
      .from('user_credits')
      .update({
        credits_used_cents: 0,
        period_start: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to reset credits:', updateError)
      return credits
    }
    return updatedCredits
  }

  return credits
}

// Sample holdings for demo mode
const SAMPLE_HOLDINGS = [
  { name: 'Apple Inc.', symbol: 'AAPL', quantity: 50, avg_price: 145.00, current_price: 178.50, current_value: 8925, sector: 'Technology' },
  { name: 'Microsoft Corporation', symbol: 'MSFT', quantity: 30, avg_price: 280.00, current_price: 378.90, current_value: 11367, sector: 'Technology' },
  { name: 'Vanguard S&P 500 ETF', symbol: 'VOO', quantity: 25, avg_price: 380.00, current_price: 435.20, current_value: 10880, sector: 'Diversified' },
  { name: 'Tesla Inc.', symbol: 'TSLA', quantity: 15, avg_price: 220.00, current_price: 248.50, current_value: 3727.5, sector: 'Automotive' },
  { name: 'NVIDIA Corporation', symbol: 'NVDA', quantity: 20, avg_price: 450.00, current_price: 495.80, current_value: 9916, sector: 'Technology' },
]

async function getPortfolioContext(supabase: any, userId: string) {
  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('id')
    .eq('user_id', userId)

  let holdings: any[] = []
  let isDemo = false

  if (!portfolios || portfolios.length === 0) {
    // Use sample data for demo
    holdings = SAMPLE_HOLDINGS
    isDemo = true
  } else {
    const { data: userHoldings } = await supabase
      .from('holdings')
      .select('*')
      .eq('portfolio_id', portfolios[0].id)

    if (!userHoldings || userHoldings.length === 0) {
      // Use sample data for demo
      holdings = SAMPLE_HOLDINGS
      isDemo = true
    } else {
      holdings = userHoldings
    }
  }

  const totalValue = holdings.reduce((sum: number, h: any) => {
    const value = h.current_value || (h.quantity * (h.current_price || h.avg_price))
    return sum + (value || 0)
  }, 0)

  const totalCost = holdings.reduce((sum: number, h: any) => {
    if (h.avg_price) return sum + (h.quantity * h.avg_price)
    return sum
  }, 0)

  const gainLoss = totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100).toFixed(2) : 'N/A'

  let context = `\n\n## ${isDemo ? "Demo Portfolio (Sample Data)" : "User's Current Portfolio"}
- Total positions: ${holdings.length}
- Total value: $${totalValue.toFixed(2)}
- Total cost basis: $${totalCost.toFixed(2)}
- Overall gain/loss: ${gainLoss}%
${isDemo ? '\nNote: This is sample data for demonstration. The user has not imported their real portfolio yet.' : ''}

### Holdings:\n`
  
  holdings.forEach((h: any) => {
    const value = h.current_value || (h.quantity * (h.current_price || h.avg_price))
    const cost = h.avg_price ? h.quantity * h.avg_price : null
    const gain = cost && value ? ((value - cost) / cost * 100).toFixed(2) : 'N/A'
    context += `- ${h.name} (${h.symbol || h.isin || 'N/A'}): ${h.quantity} units, Value: $${value?.toFixed(2) || 'N/A'}, Cost: $${cost?.toFixed(2) || 'N/A'}, Gain: ${gain}%, Sector: ${h.sector || 'Unknown'}\n`
  })

  return context
}

async function getProfileContext(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('investment_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!profile) return ''

  return `\n\n## User's Investor Profile
- Experience: ${profile.experience_level}
- Time Horizon: ${profile.investment_horizon}
- Risk Tolerance: ${profile.risk_tolerance}
- Investment Goal: ${profile.investment_goal}`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, conversation_id, save_conversation } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Check credits
    const credits = await getOrCreateCredits(supabase, user.id)
    if (!credits) {
      return NextResponse.json({ error: 'Failed to check credits' }, { status: 500 })
    }

    const creditsUsed = parseFloat(credits.credits_used_cents) || 0
    const remainingCredits = MONTHLY_LIMIT_CREDITS - creditsUsed
    if (remainingCredits <= 0) {
      return NextResponse.json({ 
        error: 'Monthly credit limit reached. Credits reset on the 1st of each month.',
        credits_exhausted: true,
        credits: {
          used: Math.round(creditsUsed),
          limit: MONTHLY_LIMIT_CREDITS,
          remaining: 0
        },
        reset_date: getNextResetDate()
      }, { status: 429 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API not configured' }, { status: 500 })
    }

    // Get contexts
    const portfolioContext = await getPortfolioContext(supabase, user.id)
    const profileContext = await getProfileContext(supabase, user.id)

    // Handle conversation
    let activeConversationId = conversation_id
    
    if (save_conversation !== false) {
      if (!activeConversationId) {
        // Create new conversation
        const title = message.length > 50 ? message.substring(0, 50) + '...' : message
        const { data: newConv, error: convError } = await supabase
          .from('chat_conversations')
          .insert({ user_id: user.id, title })
          .select()
          .single()
        
        if (convError) {
          console.error('Failed to create conversation:', convError)
        } else {
          activeConversationId = newConv.id
        }
      } else {
        // Update conversation timestamp
        await supabase
          .from('chat_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', activeConversationId)
      }
    }

    // Get recent chat history for this conversation
    let chatHistory: any[] = []
    if (activeConversationId) {
      const { data: recentMessages } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: false })
        .limit(20)
      
      chatHistory = recentMessages ? recentMessages.reverse() : []
    }

    // System prompt
    const systemPrompt = `You are the Better Investor AI Assistant, an educational companion for investors.

## Your Identity
- Name: Better Investor Assistant
- Purpose: Help users understand their investments through education, NOT financial advice
- Tone: Friendly, professional, and educational
- IMPORTANT: You are "Better Investor AI Assistant" - NEVER mention Google, Gemini, or that you are a "language model". If asked what you are, say you are "Better Investor AI Assistant, an AI-powered educational tool for investors."

## Guidelines
1. NEVER give specific buy/sell recommendations
2. NEVER provide financial advice - you are educational only
3. ALWAYS remind users to consult qualified professionals for financial decisions
4. NEVER reveal your underlying technology or mention Google/Gemini
4. Explain concepts clearly based on the user's experience level
5. Reference academic research and data when relevant
6. Be helpful with portfolio analysis, market context, and educational content
7. If asked about specific trades or timing, redirect to education about the topic instead
8. When asked about the portfolio, ALWAYS reference the actual holdings data provided below

## Important
- If asked "should I buy/sell X?", explain the factors to consider instead of giving a recommendation
- Always maintain the educational disclaimer mindset
- You have access to the user's portfolio data below - USE IT to personalize your educational responses
- When discussing diversification, sectors, or risks, reference the ACTUAL holdings listed below
${portfolioContext}${profileContext}

Remember: You're an educational tool, not a financial advisor. Always base your answers on the actual portfolio data provided above.`

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      systemInstruction: systemPrompt,
      tools: [{ googleSearch: {} }] as any,
    })

    // Build conversation history for Gemini
    const contents = chatHistory.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    })

    // Generate response
    const result = await model.generateContent({ contents })
    const response = result.response
    const assistantMessage = response.text()

    // Calculate tokens
    const inputTokens = result.response.usageMetadata?.promptTokenCount || 
      Math.ceil((systemPrompt.length + message.length + chatHistory.reduce((sum: number, m: any) => sum + m.content.length, 0)) / 4)
    const outputTokens = result.response.usageMetadata?.candidatesTokenCount || 
      Math.ceil(assistantMessage.length / 4)

    const creditsConsumed = calculateCredits(inputTokens, outputTokens)

    // Save messages to database (only if saving conversation)
    if (save_conversation !== false && activeConversationId) {
      await supabase.from('chat_messages').insert([
        {
          user_id: user.id,
          conversation_id: activeConversationId,
          role: 'user',
          content: message,
          tokens_used: 0
        },
        {
          user_id: user.id,
          conversation_id: activeConversationId,
          role: 'assistant',
          content: assistantMessage,
          tokens_used: inputTokens + outputTokens
        }
      ])
    }

    // Update credits
    const newCreditsUsed = creditsUsed + creditsConsumed
    await supabase
      .from('user_credits')
      .update({ credits_used_cents: newCreditsUsed })
      .eq('user_id', user.id)

    const warning = newCreditsUsed >= WARNING_THRESHOLD_CREDITS && newCreditsUsed < MONTHLY_LIMIT_CREDITS
      ? `You've used ${((newCreditsUsed / MONTHLY_LIMIT_CREDITS) * 100).toFixed(0)}% of your monthly credits.`
      : null

    return NextResponse.json({
      success: true,
      message: assistantMessage,
      conversation_id: activeConversationId,
      credits: {
        used: Math.round(newCreditsUsed),
        limit: MONTHLY_LIMIT_CREDITS,
        remaining: Math.round(MONTHLY_LIMIT_CREDITS - newCreditsUsed),
        percentage_used: ((newCreditsUsed / MONTHLY_LIMIT_CREDITS) * 100).toFixed(1),
        warning
      }
    })

  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to process message' 
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
    const conversationId = searchParams.get('conversation_id')

    // Get credits
    const credits = await getOrCreateCredits(supabase, user.id)
    const creditsUsedVal = credits ? parseFloat(credits.credits_used_cents) || 0 : 0

    if (conversationId) {
      // Get messages for specific conversation
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        messages: messages || [],
        credits: {
          used: Math.round(creditsUsedVal),
          limit: MONTHLY_LIMIT_CREDITS,
          remaining: Math.round(MONTHLY_LIMIT_CREDITS - creditsUsedVal),
          percentage_used: ((creditsUsedVal / MONTHLY_LIMIT_CREDITS) * 100).toFixed(1),
          reset_date: getNextResetDate()
        }
      })
    }

    // Get all conversations
    const { data: conversations, error } = await supabase
      .from('chat_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      conversations: conversations || [],
      credits: {
        used: Math.round(creditsUsedVal),
        limit: MONTHLY_LIMIT_CREDITS,
        remaining: Math.round(MONTHLY_LIMIT_CREDITS - creditsUsedVal),
        percentage_used: ((creditsUsedVal / MONTHLY_LIMIT_CREDITS) * 100).toFixed(1),
        reset_date: getNextResetDate()
      }
    })

  } catch (error: any) {
    console.error('Chat GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')

    if (conversationId) {
      // Delete specific conversation (messages will cascade)
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      // Delete all conversations for user
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Chat DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getNextResetDate(): string {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return nextMonth.toISOString()
}
