'use client'

import { useState, useEffect, use } from 'react'
import { ArrowLeft, Loader2, DollarSign, TrendingUp, TrendingDown, MessageSquare, Zap, Save } from 'lucide-react'
import Link from 'next/link'

interface Holding {
  id: string
  symbol: string
  name: string
  quantity: number
  purchase_price: number
  current_price: number
  current_value: number
  sector: string
}

interface UserData {
  subscription: {
    user_id: string
    plan: string
    status: string
    stripe_customer_id: string | null
    stripe_subscription_id: string | null
    current_period_end: string | null
    created_at: string
  }
  holdings: Holding[]
  credits: { credits_remaining: number; last_reset: string } | null
  chatCount: number
  supportConversations: any[]
  stats: {
    portfolioValue: number
    totalGainLoss: number
    holdingsCount: number
  }
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const [data, setData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editPlan, setEditPlan] = useState('')
  const [editStatus, setEditStatus] = useState('')

  useEffect(() => {
    loadUser()
  }, [userId])

  const loadUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      const userData = await res.json()
      setData(userData)
      setEditPlan(userData.subscription?.plan || 'free')
      setEditStatus(userData.subscription?.status || 'active')
    } catch (err) {
      console.error('Error loading user:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveSubscription = async () => {
    setSaving(true)
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: editPlan, status: editStatus }),
      })
      await loadUser()
    } catch (err) {
      console.error('Error saving:', err)
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (!data) {
    return <div>User not found</div>
  }

  const gainLossPercent = data.stats.portfolioValue > 0 
    ? (data.stats.totalGainLoss / (data.stats.portfolioValue - data.stats.totalGainLoss) * 100) 
    : 0

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">User Details</h1>
        <p className="text-zinc-500 font-mono text-sm">{userId}</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Subscription & Stats */}
        <div className="space-y-6">
          {/* Subscription Management */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-4">Subscription</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase">Plan</label>
                <select
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                >
                  <option value="free">Free</option>
                  <option value="deepdive">Deepdive</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                >
                  <option value="active">Active</option>
                  <option value="trialing">Trialing</option>
                  <option value="canceled">Canceled</option>
                  <option value="past_due">Past Due</option>
                </select>
              </div>

              {data.subscription?.current_period_end && (
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase">Period End</label>
                  <p className="text-sm text-zinc-900 mt-1">
                    {formatDate(data.subscription.current_period_end)}
                  </p>
                </div>
              )}

              {data.subscription?.stripe_customer_id && (
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase">Stripe Customer</label>
                  <a 
                    href={`https://dashboard.stripe.com/customers/${data.subscription.stripe_customer_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline block mt-1"
                  >
                    {data.subscription.stripe_customer_id}
                  </a>
                </div>
              )}

              <button
                onClick={saveSubscription}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white py-2 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>

          {/* AI Credits */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">AI Credits</p>
                <p className="text-2xl font-bold text-zinc-900">
                  {data.credits?.credits_remaining || 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              {data.chatCount} AI chat conversations
            </p>
          </div>
        </div>

        {/* Right Column - Portfolio */}
        <div className="col-span-2 space-y-6">
          {/* Portfolio Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                <DollarSign className="w-4 h-4" />
                Portfolio Value
              </div>
              <p className="text-2xl font-bold text-zinc-900">
                {formatCurrency(data.stats.portfolioValue)}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                {data.stats.totalGainLoss >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                Total Gain/Loss
              </div>
              <p className={`text-2xl font-bold ${data.stats.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.stats.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(data.stats.totalGainLoss)}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                Holdings
              </div>
              <p className="text-2xl font-bold text-zinc-900">
                {data.stats.holdingsCount}
              </p>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100">
              <h2 className="font-semibold text-zinc-900">Portfolio Holdings</h2>
            </div>
            {data.holdings.length === 0 ? (
              <div className="px-6 py-12 text-center text-zinc-500">
                No holdings in portfolio
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Symbol</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Qty</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Avg Cost</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Current</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Value</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Gain/Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {data.holdings.map((holding) => {
                    const cost = holding.quantity * holding.purchase_price
                    const gain = holding.current_value - cost
                    const gainPercent = cost > 0 ? (gain / cost) * 100 : 0

                    return (
                      <tr key={holding.id} className="hover:bg-zinc-50">
                        <td className="px-6 py-3">
                          <p className="font-medium text-zinc-900">{holding.symbol}</p>
                          <p className="text-xs text-zinc-500">{holding.name}</p>
                        </td>
                        <td className="px-6 py-3 text-sm text-zinc-600">
                          {holding.quantity}
                        </td>
                        <td className="px-6 py-3 text-sm text-zinc-600 text-right">
                          {formatCurrency(holding.purchase_price)}
                        </td>
                        <td className="px-6 py-3 text-sm text-zinc-900 text-right font-medium">
                          {formatCurrency(holding.current_price)}
                        </td>
                        <td className="px-6 py-3 text-sm text-zinc-900 text-right font-medium">
                          {formatCurrency(holding.current_value)}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className={`text-sm font-medium ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {gain >= 0 ? '+' : ''}{formatCurrency(gain)}
                          </span>
                          <span className={`text-xs ml-1 ${gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ({gainPercent >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%)
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
