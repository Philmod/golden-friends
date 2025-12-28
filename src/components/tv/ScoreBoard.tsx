'use client'

import { Team } from '@/types/game'

interface ScoreBoardProps {
  girls: Team
  boys: Team
  roundPoints: number
}

export default function ScoreBoard({ girls, boys, roundPoints }: ScoreBoardProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
      {/* Girls team */}
      <div className="flex flex-col items-center">
        <div
          className="w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center border-4"
          style={{ backgroundColor: girls.color + '30', borderColor: girls.color }}
        >
          <span className="text-4xl md:text-5xl font-bold">{girls.score}</span>
        </div>
        <span className="mt-2 text-xl md:text-2xl font-bold" style={{ color: girls.color }}>
          {girls.name}
        </span>
        {/* Strikes */}
        <div className="flex gap-2 mt-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`w-6 h-6 rounded-full border-2 ${
                i < girls.strikes ? 'bg-red-500 border-red-600' : 'border-gray-500'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Round points */}
      <div className="flex flex-col items-center">
        <div className="text-lg text-gray-400 uppercase tracking-wider">Points en jeu</div>
        <div className="text-5xl md:text-7xl font-bold text-gold-400 animate-pulse">
          {roundPoints}
        </div>
      </div>

      {/* Boys team */}
      <div className="flex flex-col items-center">
        <div
          className="w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center border-4"
          style={{ backgroundColor: boys.color + '30', borderColor: boys.color }}
        >
          <span className="text-4xl md:text-5xl font-bold">{boys.score}</span>
        </div>
        <span className="mt-2 text-xl md:text-2xl font-bold" style={{ color: boys.color }}>
          {boys.name}
        </span>
        {/* Strikes */}
        <div className="flex gap-2 mt-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`w-6 h-6 rounded-full border-2 ${
                i < boys.strikes ? 'bg-red-500 border-red-600' : 'border-gray-500'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
