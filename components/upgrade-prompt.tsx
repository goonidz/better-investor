'use client'

import Link from 'next/link'
import { Lock, Zap, Sparkles, FileUp, TrendingUp, Brain } from 'lucide-react'

interface UpgradePromptProps {
  feature: 'ai-chat' | 'import' | 'projections' | 'ai-insights'
  className?: string
}

const featureInfo = {
  'ai-chat': {
    icon: Sparkles,
    title: 'AI Chat Assistant',
    description: 'Get personalized insights about your portfolio, ask questions about market concepts, and receive AI-powered analysis.',
    benefits: [
      '2,500 AI credits per month',
      'Portfolio-aware responses',
      'Financial education',
    ],
  },
  'import': {
    icon: FileUp,
    title: 'Portfolio Import',
    description: 'Import your holdings from PDF statements or CSV exports. Our AI extracts data automatically.',
    benefits: [
      'PDF statement parsing',
      'CSV import with mapping',
      'Automatic data extraction',
    ],
  },
  'projections': {
    icon: TrendingUp,
    title: 'Projection Calculator',
    description: 'Model your portfolio growth with different scenarios and contribution strategies.',
    benefits: [
      'Multiple growth scenarios',
      'Contribution modeling',
      'Goal tracking',
    ],
  },
  'ai-insights': {
    icon: Brain,
    title: 'AI Insights',
    description: 'Get AI-powered analysis of insider trading patterns and market signals.',
    benefits: [
      'Insider activity analysis',
      'Pattern detection',
      'Weekly summaries',
    ],
  },
}

export function UpgradePrompt({ feature, className = '' }: UpgradePromptProps) {
  const info = featureInfo[feature]
  const Icon = info.icon

  return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh] text-center px-6 ${className}`}>
      <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6">
        <Lock className="w-8 h-8 text-zinc-400" />
      </div>
      
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">
        {info.title}
      </h1>
      
      <p className="text-zinc-600 max-w-md mb-8">
        {info.description}
      </p>

      <div className="bg-zinc-50 rounded-xl p-6 mb-8 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-zinc-900">Deepdive Plan</p>
            <p className="text-sm text-zinc-500">$59/month</p>
          </div>
        </div>
        <ul className="space-y-2 text-left">
          {info.benefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2 text-sm text-zinc-600">
              <Zap className="w-4 h-4 text-zinc-900" />
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors"
      >
        <Zap className="w-4 h-4" />
        Upgrade to Deepdive
      </Link>

      <p className="text-xs text-zinc-400 mt-4">
        7-day free trial • Cancel anytime
      </p>
    </div>
  )
}

// Smaller inline version for partial blocks
export function UpgradePromptInline({ feature }: { feature: UpgradePromptProps['feature'] }) {
  const info = featureInfo[feature]

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Lock className="w-5 h-5 text-zinc-400" />
        <div>
          <p className="font-medium text-zinc-900 text-sm">{info.title}</p>
          <p className="text-xs text-zinc-500">Upgrade to access this feature</p>
        </div>
      </div>
      <Link
        href="/pricing"
        className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
      >
        Upgrade
      </Link>
    </div>
  )
}
