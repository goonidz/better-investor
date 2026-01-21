// Credit system for AI usage
// 1 credit = $0.001 (1/10 cent)
// Monthly limit: 2500 credits = $2.50

// Gemini 3 Flash Preview pricing (per 1M tokens)
const INPUT_COST_PER_MILLION = 0.50  // $0.50
const OUTPUT_COST_PER_MILLION = 3.00 // $3.00
export const MONTHLY_LIMIT_CREDITS = 2500

export function calculateCredits(inputTokens: number, outputTokens: number): number {
  const inputCredits = (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION * 1000
  const outputCredits = (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION * 1000
  return inputCredits + outputCredits
}

export async function getOrCreateCredits(supabase: any, userId: string) {
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
        credits_used_cents: 0,
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

export async function checkAndConsumeCredits(
  supabase: any, 
  userId: string, 
  inputTokens: number, 
  outputTokens: number
): Promise<{ success: boolean; error?: string; creditsUsed?: number; remaining?: number }> {
  const credits = await getOrCreateCredits(supabase, userId)
  
  if (!credits) {
    return { success: false, error: 'Failed to get credits' }
  }

  const currentUsed = parseFloat(credits.credits_used_cents) || 0
  const remaining = MONTHLY_LIMIT_CREDITS - currentUsed

  if (remaining <= 0) {
    return { success: false, error: 'Monthly credit limit reached' }
  }

  const creditsConsumed = calculateCredits(inputTokens, outputTokens)
  const newUsed = currentUsed + creditsConsumed

  await supabase
    .from('user_credits')
    .update({ credits_used_cents: newUsed })
    .eq('user_id', userId)

  return { 
    success: true, 
    creditsUsed: creditsConsumed, 
    remaining: Math.round(MONTHLY_LIMIT_CREDITS - newUsed) 
  }
}

export async function hasCredits(supabase: any, userId: string): Promise<boolean> {
  const credits = await getOrCreateCredits(supabase, userId)
  if (!credits) return false
  
  const currentUsed = parseFloat(credits.credits_used_cents) || 0
  return (MONTHLY_LIMIT_CREDITS - currentUsed) > 0
}
