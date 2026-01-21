'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LayoutDashboard, MessageCircle, TrendingUp, Upload, LogOut, Users } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/chat', label: 'AI Assistant', icon: MessageCircle },
  { href: '/dashboard/projection', label: 'Projection', icon: TrendingUp },
  { href: '/dashboard/insider', label: 'Insider Trading', icon: Users },
  { href: '/dashboard/import', label: 'Import', icon: Upload },
]

export function MobileNav({ userEmail }: { userEmail: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-zinc-100">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-lg tracking-tighter" style={{ fontFamily: 'system-ui' }}>B</span>
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-[0.2em]">Better</span>
              <span className="text-base font-bold text-zinc-900 tracking-tight">Investor</span>
            </div>
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/20" onClick={() => setIsOpen(false)} />
      )}

      {/* Mobile Menu */}
      <div className={`lg:hidden fixed top-16 right-0 z-50 w-72 h-[calc(100vh-4rem)] bg-white border-l border-zinc-100 transform transition-transform duration-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <nav className="p-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href, link.exact)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                  active 
                    ? 'text-zinc-900 bg-zinc-100' 
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-100">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-white font-medium text-xs">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-medium text-zinc-900 truncate flex-1">{userEmail}</p>
          </div>
          <form action="/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-zinc-500 rounded-xl hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
