'use client'

import { useState, useEffect } from 'react'
import { User, CreditCard, Zap, Calendar, Loader2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Subscription {
  plan: 'free' | 'deepdive'
  status: 'active' | 'trialing' | 'canceled' | 'past_due'
  current_period_end: string | null
  stripe_customer_id: string | null
}

interface UserProfile {
  email: string
  created_at: string
}

export default function SettingsPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Get subscription
      const subRes = await fetch('/api/subscription')
      const subData = await subRes.json()
      setSubscription(subData.subscription)

      // Get profile
      const profileRes = await fetch('/api/profile')
      const profileData = await profileRes.json()
      setProfile(profileData.profile)
    } catch (err) {
      console.error('Error loading settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const openBillingPortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Could not open billing portal')
      }
    } catch (err) {
      console.error('Error opening portal:', err)
      alert('Something went wrong')
    } finally {
      setPortalLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Settings</h1>
        <p className="text-zinc-500 mt-1">Manage your account and subscription</p>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-zinc-600" />
          </div>
          <div>
            <h2 className="font-semibold text-zinc-900">Profile</h2>
            <p className="text-sm text-zinc-500">Your account information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Email</label>
            <p className="text-zinc-900 mt-1">{profile?.email || '-'}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Member since</label>
            <p className="text-zinc-900 mt-1">
              {profile?.created_at ? formatDate(profile.created_at) : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-zinc-600" />
          </div>
          <div>
            <h2 className="font-semibold text-zinc-900">Subscription</h2>
            <p className="text-sm text-zinc-500">Manage your plan and billing</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Current Plan */}
          <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
            <div className="flex items-center gap-3">
              {subscription?.plan === 'deepdive' ? (
                <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-zinc-200 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-zinc-500" />
                </div>
              )}
              <div>
                <p className="font-semibold text-zinc-900">
                  {subscription?.plan === 'deepdive' ? 'Deepdive' : 'Free'} Plan
                </p>
                <p className="text-sm text-zinc-500">
                  {subscription?.status === 'trialing' && 'Trial period'}
                  {subscription?.status === 'active' && subscription?.plan === 'deepdive' && 'Active subscription'}
                  {subscription?.status === 'active' && subscription?.plan === 'free' && 'Basic access'}
                  {subscription?.status === 'canceled' && 'Subscription canceled'}
                  {subscription?.status === 'past_due' && 'Payment past due'}
                </p>
              </div>
            </div>
            {subscription?.plan === 'deepdive' && (
              <span className="px-2.5 py-1 bg-zinc-900 text-white text-xs font-medium rounded-full">
                {subscription.status === 'trialing' ? 'Trial' : 'Pro'}
              </span>
            )}
          </div>

          {/* Period End */}
          {subscription?.current_period_end && subscription?.plan === 'deepdive' && (
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <Calendar className="w-4 h-4" />
              <span>
                {subscription.status === 'trialing' ? 'Trial ends' : 'Renews'} on {formatDate(subscription.current_period_end)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {subscription?.plan === 'deepdive' && subscription?.stripe_customer_id ? (
              <button
                onClick={openBillingPortal}
                disabled={portalLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {portalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                Manage Billing
              </button>
            ) : (
              <Link
                href="/pricing"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <Zap className="w-4 h-4" />
                Upgrade to Deepdive
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Plan Features */}
      {subscription?.plan === 'deepdive' && (
        <div className="bg-zinc-50 rounded-xl border border-zinc-100 p-6">
          <h3 className="font-semibold text-zinc-900 mb-4">Your Deepdive features</h3>
          <ul className="grid grid-cols-2 gap-3 text-sm text-zinc-600">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-zinc-900 rounded-full"></span>
              2,500 AI credits/month
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-zinc-900 rounded-full"></span>
              PDF & CSV Import
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-zinc-900 rounded-full"></span>
              AI Portfolio Analysis
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-zinc-900 rounded-full"></span>
              Insider Trading AI Insights
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-zinc-900 rounded-full"></span>
              Projection Calculator
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-zinc-900 rounded-full"></span>
              Priority Support
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
