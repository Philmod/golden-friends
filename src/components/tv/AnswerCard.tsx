'use client'

import { Answer } from '@/types/game'

interface AnswerCardProps {
  answer: Answer
  index: number
  isStolen?: boolean
}

export default function AnswerCard({ answer, index, isStolen }: AnswerCardProps) {
  return (
    <div className={`relative h-12 md:h-14 ${isStolen ? 'mt-2' : ''}`}>
      {/* Answer bar container */}
      <div
        className={`
          w-full h-full rounded-full overflow-hidden
          transition-all duration-500 ease-out
          ${answer.revealed ? 'answer-bar-gradient' : 'answer-bar-hidden'}
        `}
      >
        <div className="w-full h-full flex items-center justify-between px-6 md:px-8">
          {/* Answer text */}
          <span
            className={`
              text-lg md:text-xl font-bold uppercase tracking-wide
              transition-opacity duration-300
              ${answer.revealed ? 'text-white' : 'text-transparent'}
            `}
            style={{
              textShadow: answer.revealed ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none'
            }}
          >
            {answer.text}
          </span>

          {/* Points */}
          <span
            className={`
              text-xl md:text-2xl font-bold min-w-[3rem] text-right
              transition-all duration-300
              ${answer.revealed
                ? 'text-white opacity-100 scale-100'
                : 'text-transparent opacity-0 scale-50'
              }
            `}
            style={{
              textShadow: answer.revealed ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none'
            }}
          >
            {answer.points}
          </span>
        </div>
      </div>

      {/* Reveal animation overlay */}
      {answer.revealed && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none animate-reveal-flash"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
          }}
        />
      )}

      <style jsx>{`
        @keyframes reveal-flash {
          0% {
            transform: translateX(-100%);
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        .animate-reveal-flash {
          animation: reveal-flash 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
