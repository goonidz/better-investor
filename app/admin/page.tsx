'use client'

import { useState, useEffect } from 'react'
import { Users, CreditCard, MessageSquare, TrendingUp, DollarSign, UserPlus, Loader2 } from 'lucide-react'

interface Stats {
  totalUsers: number
  paidUsers: number
  activeTrials: number
  openTickets: number
  totalPortfolioValue: number
  recentSignups: number
  conversionRate: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Error loading stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
    },
    {
      label: 'Paid Users',
      value: stats?.paidUsers || 0,
      icon: CreditCard,
    },
    {
      label: 'Active Trials',
      value: stats?.activeTrials || 0,
      icon: TrendingUp,
    },
    {
      label: 'Open Tickets',
      value: stats?.openTickets || 0,
      icon: MessageSquare,
    },
    {
      label: 'Total Portfolio Value',
      value: formatCurrency(stats?.totalPortfolioValue || 0),
      icon: DollarSign,
    },
    {
      label: 'Signups (7 days)',
      value: stats?.recentSignups || 0,
      icon: UserPlus,
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500">Overview of your platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-zinc-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
                <p className="text-sm text-zinc-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Conversion Rate */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="font-semibold text-zinc-900 mb-4">Conversion Rate</h2>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-zinc-900">{stats?.conversionRate}%</span>
          <span className="text-zinc-500 mb-1">free to paid</span>
        </div>
        <div className="mt-4 h-3 bg-zinc-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-zinc-900 rounded-full transition-all"
            style={{ width: `${stats?.conversionRate || 0}%` }}
          />
        </div>
      </div>
    </div>
  )
}
