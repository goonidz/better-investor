import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import Link from 'next/link'
import { LayoutDashboard, Users, MessageSquare, LogOut, ArrowLeft } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const admin = await isAdmin(user.id)
  if (!admin) {
    redirect('/dashboard')
  }

  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/support', label: 'Support', icon: MessageSquare },
  ]

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-zinc-100">
        {/* Logo */}
        <div className="px-5 py-5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-lg tracking-tighter" style={{ fontFamily: 'system-ui' }}>B</span>
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-[0.2em]">Better</span>
              <span className="text-base font-bold text-zinc-900 tracking-tight">Investor</span>
            </div>
          </Link>
          <div className="mt-3 px-1">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Admin</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-zinc-100">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-zinc-500 rounded-lg hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
          <form action="/auth/logout" method="POST" className="mt-1">
            <button
              type="submit"
              className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-zinc-500 rounded-lg hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 min-h-screen">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
