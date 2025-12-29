'use client'

import { useState, useEffect } from 'react'

interface DrinkingRule {
  id: string
  event: string
  rule: string
  icon: string
}

const DRINKING_RULES: DrinkingRule[] = [
  {
    id: 'strike',
    event: 'Strike (X)',
    rule: 'Playing team drinks',
    icon: '❌',
  },
  {
    id: 'top-answer',
    event: 'Answer #1',
    rule: 'Other team drinks',
    icon: '🥇',
  },
  {
    id: 'steal-fail',
    event: 'Failed steal',
    rule: 'Stealing team drinks 2x',
    icon: '🫠',
  },
  {
    id: 'sweep',
    event: 'Complete board',
    rule: 'Other team drinks 3x',
    icon: '🧹',
  },
  {
    id: 'buzzer-wrong',
    event: 'Buzzer + wrong answer',
    rule: 'Player drinks',
    icon: '🔔',
  },
]

interface DrinkingRulesProps {
  show: boolean
  highlightRule?: string // Rule ID to highlight
}

export default function DrinkingRules({ show, highlightRule }: DrinkingRulesProps) {
  const [isVisible, setIsVisible] = useState(show)
  const [highlighted, setHighlighted] = useState<string | null>(null)

  useEffect(() => {
    setIsVisible(show)
  }, [show])

  useEffect(() => {
    if (highlightRule) {
      setHighlighted(highlightRule)
      // Auto-clear highlight after 3 seconds
      const timer = setTimeout(() => setHighlighted(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [highlightRule])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="bg-gray-900/90 border border-gold-400/50 rounded-xl p-4 max-w-xs">
        <h3 className="text-gold-400 font-bold text-lg mb-3 flex items-center gap-2">
          <span>🍺</span>
          <span>Drinking Rules</span>
        </h3>
        <div className="space-y-2">
          {DRINKING_RULES.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-start gap-2 p-2 rounded-lg transition-all duration-300 ${
                highlighted === rule.id
                  ? 'bg-yellow-500/30 scale-105 border border-yellow-400'
                  : 'bg-gray-800/50'
              }`}
            >
              <span className="text-xl">{rule.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white">{rule.event}</div>
                <div className="text-xs text-gray-300">{rule.rule}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
