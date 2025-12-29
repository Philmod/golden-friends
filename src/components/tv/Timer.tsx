'use client'

import { useEffect, useState } from 'react'

interface TimerProps {
  endTime: number | null
  isRunning: boolean
  duration: number
}

export default function Timer({ endTime, isRunning, duration }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration)

  useEffect(() => {
    if (!isRunning || !endTime) {
      setTimeLeft(duration)
      return
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      setTimeLeft(remaining)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 100)

    return () => clearInterval(interval)
  }, [endTime, isRunning, duration])

  if (!isRunning) return null

  const percentage = (timeLeft / duration) * 100
  const isLow = timeLeft <= 3
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - percentage / 100)

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`relative w-24 h-24 ${isLow ? 'animate-pulse' : ''}`}>
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={isLow ? '#ef4444' : '#fbbf24'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-100"
          />
        </svg>
        {/* Time text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-3xl font-bold ${isLow ? 'text-red-500' : 'text-yellow-400'}`}>
            {timeLeft}
          </span>
        </div>
      </div>
    </div>
  )
}
