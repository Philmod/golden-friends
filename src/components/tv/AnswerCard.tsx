'use client'

import { Answer } from '@/types/game'

interface AnswerCardProps {
  answer: Answer
  index: number
}

export default function AnswerCard({ answer, index }: AnswerCardProps) {
  return (
    <div className="flip-card h-16 md:h-20">
      <div className={`flip-card-inner relative w-full h-full ${answer.revealed ? 'flipped' : ''}`}>
        {/* Front - Hidden answer */}
        <div className="flip-card-front absolute w-full h-full">
          <div className="w-full h-full bg-blue-900 border-4 border-gold-400 rounded-lg flex items-center justify-center">
            <span className="text-4xl md:text-5xl font-bold text-gold-400">{index + 1}</span>
          </div>
        </div>

        {/* Back - Revealed answer */}
        <div className="flip-card-back absolute w-full h-full">
          <div className="w-full h-full gold-gradient border-4 border-gold-600 rounded-lg flex items-center justify-between px-4 md:px-6">
            <span className="text-lg md:text-2xl font-bold text-gray-900 uppercase tracking-wide truncate flex-1">
              {answer.text}
            </span>
            <span className="text-2xl md:text-3xl font-bold text-blue-900 ml-4 points-reveal">
              {answer.points}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .flip-card {
          perspective: 1000px;
        }
        .flip-card-inner {
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        .flip-card-inner.flipped {
          transform: rotateX(180deg);
        }
        .flip-card-front,
        .flip-card-back {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .flip-card-back {
          transform: rotateX(180deg);
        }
      `}</style>
    </div>
  )
}
