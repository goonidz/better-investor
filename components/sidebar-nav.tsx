'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Upload, MessageCircle, TrendingUp, Users, Settings } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/chat', label: 'AI Assistant', icon: MessageCircle },
  { href: '/dashboard/projection', label: 'Projection', icon: TrendingUp },
  { href: '/dashboard/insider', label: 'Insider Trading', icon: Users },
  { href: '/dashboard/import', label: 'Import', icon: Upload },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function SidebarNav() {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="flex-1 px-3 py-4">
      <div className="space-y-1">
        {links.map((link) => {
          const active = isActive(link.href, link.exact)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                active
                  ? 'text-zinc-900 bg-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
