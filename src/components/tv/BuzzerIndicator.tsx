'use client'

import { BuzzEvent, Team } from '@/types/game'

interface BuzzerIndicatorProps {
  buzzOrder: BuzzEvent[]
  teams: { girls: Team; boys: Team }
  showFirst?: boolean
}

export default function BuzzerIndicator({ buzzOrder, teams, showFirst = true }: BuzzerIndicatorProps) {
  if (buzzOrder.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-2xl text-gray-400 animate-pulse">
          Waiting for the buzzers...
        </div>
      </div>
    )
  }

  const firstBuzz = buzzOrder[0]
  const team = teams[firstBuzz.team]

  if (showFirst) {
    return (
      <div className="text-center py-4 animate-pop">
        <div className="text-xl text-gray-300 mb-2">Premier(e) a buzzer:</div>
        <div
          className="text-4xl font-bold px-8 py-4 rounded-xl inline-block animate-pulse-glow"
          style={{ backgroundColor: team.color + '40', color: team.color }}
        >
          {firstBuzz.playerName}
        </div>
      </div>
    )
  }

  // Show all buzzers in order
  return (
    <div className="flex flex-wrap justify-center gap-2 py-4">
      {buzzOrder.slice(0, 5).map((buzz, index) => {
        const buzzTeam = teams[buzz.team]
        return (
          <div
            key={buzz.playerId}
            className="px-4 py-2 rounded-lg text-sm font-bold"
            style={{
              backgroundColor: buzzTeam.color + '30',
              color: buzzTeam.color,
              opacity: 1 - index * 0.15,
            }}
          >
            {index + 1}. {buzz.playerName}
          </div>
        )
      })}
    </div>
  )
}
