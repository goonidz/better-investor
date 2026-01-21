'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, Zap } from 'lucide-react'

const features = [
  { name: 'View portfolio & dashboard', free: true, deepdive: true },
  { name: 'Insider trading data (raw)', free: true, deepdive: true },
  { name: 'AI Chat Assistant', free: false, deepdive: '2,500 credits/month' },
  { name: 'PDF & CSV Import', free: false, deepdive: true },
  { name: 'AI Portfolio Analysis', free: false, deepdive: true },
  { name: 'Insider Trading AI Insights', free: false, deepdive: true },
  { name: 'Projection Calculator', free: false, deepdive: true },
  { name: 'Priority Support', free: false, deepdive: true },
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const monthlyPrice = 59
  const yearlyPrice = 490
  const yearlyMonthly = Math.round(yearlyPrice / 12)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else if (data.error) {
        alert(data.error)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-semibold text-zinc-900">Better Investor</span>
          </Link>
          <Link 
            href="/dashboard" 
            className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-zinc-900 mb-3">
            Upgrade to Deepdive
          </h1>
          <p className="text-zinc-600 max-w-lg mx-auto">
            Unlock AI-powered insights, portfolio analysis, and advanced features to make smarter investment decisions.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              billingCycle === 'yearly'
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300'
            }`}
          >
            Yearly
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              billingCycle === 'yearly' ? 'bg-white/20' : 'bg-zinc-900 text-white'
            }`}>
              2 months free
            </span>
          </button>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-zinc-900">Free</h3>
              <p className="text-sm text-zinc-500 mt-1">Basic portfolio tracking</p>
            </div>
            <div className="mb-6">
              <span className="text-3xl font-bold text-zinc-900">$0</span>
              <span className="text-zinc-500">/month</span>
            </div>
            <Link
              href="/dashboard"
              className="block w-full text-center px-4 py-2.5 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors mb-6"
            >
              Current Plan
            </Link>
            <ul className="space-y-3">
              {features.map((feature) => (
                <li key={feature.name} className="flex items-start gap-3">
                  {feature.free ? (
                    <Check className="w-5 h-5 text-zinc-900 shrink-0" />
                  ) : (
                    <X className="w-5 h-5 text-zinc-300 shrink-0" />
                  )}
                  <span className={`text-sm ${feature.free ? 'text-zinc-700' : 'text-zinc-400'}`}>
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Deepdive Plan */}
          <div className="bg-zinc-900 rounded-2xl p-6 text-white relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 bg-white text-zinc-900 text-xs font-semibold rounded-full">
                Most Popular
              </span>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Deepdive
              </h3>
              <p className="text-sm text-zinc-400 mt-1">Full AI-powered analysis</p>
            </div>
            <div className="mb-6">
              <span className="text-3xl font-bold">
                ${billingCycle === 'yearly' ? yearlyMonthly : monthlyPrice}
              </span>
              <span className="text-zinc-400">/month</span>
              {billingCycle === 'yearly' && (
                <p className="text-sm text-zinc-400 mt-1">
                  ${yearlyPrice} billed annually
                </p>
              )}
            </div>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full px-4 py-2.5 text-sm font-medium text-zinc-900 bg-white rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Start 7-day free trial'
              )}
            </button>
            <ul className="space-y-3">
              {features.map((feature) => (
                <li key={feature.name} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white shrink-0" />
                  <span className="text-sm text-zinc-300">
                    {typeof feature.deepdive === 'string' ? feature.deepdive : feature.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-zinc-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-zinc-200 p-4">
              <h3 className="font-medium text-zinc-900">What happens after the 7-day trial?</h3>
              <p className="text-sm text-zinc-600 mt-1">
                You'll be charged the subscription fee. Cancel anytime before the trial ends to avoid charges.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-zinc-200 p-4">
              <h3 className="font-medium text-zinc-900">Can I cancel anytime?</h3>
              <p className="text-sm text-zinc-600 mt-1">
                Yes, you can cancel your subscription at any time. You'll keep access until the end of your billing period.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-zinc-200 p-4">
              <h3 className="font-medium text-zinc-900">What are AI credits?</h3>
              <p className="text-sm text-zinc-600 mt-1">
                AI credits are used for chat messages, portfolio analysis, and AI insights. Deepdive includes 2,500 credits per month, which resets on the 1st.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
