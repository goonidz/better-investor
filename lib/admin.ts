import { createClient } from '@/lib/supabase/server'

export async function isAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false
  
  const supabase = await createClient()
  const { data } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', userId)
    .single()
  
  return !!data
}

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  const admin = await isAdmin(user.id)
  if (!admin) {
    throw new Error('Not authorized')
  }
  
  return user
}
