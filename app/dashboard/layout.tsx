import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '../auth/actions'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { SidebarNav } from '@/components/sidebar-nav'
import { MobileNav } from '@/components/mobile-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Mobile Header */}
      <MobileNav userEmail={user.email || ''} />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 z-40 w-60 h-screen bg-white border-r border-zinc-100">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-5 py-5">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-lg tracking-tighter" style={{ fontFamily: 'system-ui' }}>B</span>
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-[0.2em]">Better</span>
                <span className="text-base font-bold text-zinc-900 tracking-tight">Investor</span>
              </div>
            </Link>
          </div>
          
          {/* Nav Links */}
          <SidebarNav />

          {/* User section */}
          <div className="p-3 border-t border-zinc-100">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-white font-medium text-xs">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{user.email}</p>
              </div>
            </div>
            <form action={logout} className="mt-1">
              <button
                type="submit"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-zinc-500 rounded-lg hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-60 min-h-screen pt-16 lg:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
