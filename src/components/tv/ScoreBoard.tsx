'use client'

import { Team } from '@/types/game'

interface ScoreBoardProps {
  girls: Team
  boys: Team
  roundPoints: number
}

export default function ScoreBoard({ girls, boys, roundPoints }: ScoreBoardProps) {
  // Render strike X marks - French TV style
  const renderStrikes = (strikes: number, maxStrikes: number = 3) => {
    return (
      <div className="flex gap-1 md:gap-2">
        {Array.from({ length: maxStrikes }).map((_, i) => (
          <div
            key={i}
            className={`
              text-3xl md:text-4xl font-bold
              transition-all duration-300
              ${i < strikes
                ? 'text-red-500 opacity-100 scale-100'
                : 'text-red-500/20 opacity-30 scale-90'
              }
            `}
            style={{
              textShadow: i < strikes
                ? '0 0 10px rgba(255,0,0,0.8), 2px 2px 4px rgba(0,0,0,0.5)'
                : 'none',
              fontFamily: 'Arial Black, sans-serif',
            }}
          >
            X
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Main TV header - French style with X marks and centered points */}
      <div className="flex items-center justify-center gap-4 md:gap-8 py-4">
        {/* Left team strikes (Girls) */}
        {renderStrikes(girls.strikes)}

        {/* Round points - centered */}
        <div className="px-4 md:px-8">
          <span
            className="text-5xl md:text-7xl font-bold text-white"
            style={{
              textShadow: '0 0 20px rgba(255,255,255,0.5), 2px 2px 4px rgba(0,0,0,0.5)',
              fontFamily: 'Arial Black, sans-serif',
            }}
          >
            {roundPoints}
          </span>
        </div>

        {/* Right team strikes (Boys) */}
        {renderStrikes(boys.strikes)}
      </div>

      {/* Team scores - smaller display below */}
      <div className="flex items-center justify-between w-full max-w-2xl mx-auto px-4 pb-2">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold"
            style={{ backgroundColor: girls.color }}
          >
            {girls.score}
          </div>
          <span className="text-sm md:text-base font-medium" style={{ color: girls.color }}>
            {girls.name}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm md:text-base font-medium" style={{ color: boys.color }}>
            {boys.name}
          </span>
          <div
            className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold"
            style={{ backgroundColor: boys.color }}
          >
            {boys.score}
          </div>
        </div>
      </div>
    </div>
  )
}
