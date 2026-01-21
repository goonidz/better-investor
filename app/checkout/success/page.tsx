'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Zap, ArrowRight, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function CheckoutSuccessPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Trigger confetti
    const duration = 3000
    const end = Date.now() + duration

    const colors = ['#18181b', '#71717a', '#a1a1aa']

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2.5 mb-12">
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-xl tracking-tighter" style={{ fontFamily: 'system-ui' }}>B</span>
          </div>
          <div className="flex flex-col -space-y-1 text-left">
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.2em]">Better</span>
            <span className="text-lg font-bold text-zinc-900 tracking-tight">Investor</span>
          </div>
        </Link>

        {/* Success Icon */}
        <div className="relative inline-flex mb-8">
          <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center animate-[scale-in_0.5s_ease-out]">
            <CheckCircle className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-zinc-100">
            <Sparkles className="w-4 h-4 text-zinc-900" />
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold text-zinc-900 mb-3">
          Welcome to Deepdive!
        </h1>
        <p className="text-zinc-500 text-lg mb-8">
          Your subscription is now active. You have full access to all premium features.
        </p>

        {/* Features unlocked */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-8 text-left">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-zinc-900" />
            <span className="font-semibold text-zinc-900">Features unlocked</span>
          </div>
          <ul className="space-y-3">
            {[
              'AI Portfolio Analysis & Chat',
              'PDF & CSV Import',
              'Insider Trading AI Insights',
              'Projection Calculator',
              '2,500 AI credits per month',
              'Priority Support'
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-zinc-600">
                <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-zinc-900" />
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 w-full bg-zinc-900 text-white font-semibold py-4 px-6 rounded-xl hover:bg-zinc-800 transition-colors"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="text-sm text-zinc-400 mt-6">
          Questions? Contact us at{' '}
          <a href="mailto:support@betterinvestor.app" className="text-zinc-600 hover:underline">
            support@betterinvestor.app
          </a>
        </p>
      </div>
    </div>
  )
}
