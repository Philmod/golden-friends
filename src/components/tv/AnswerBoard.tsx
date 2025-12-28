'use client'

import { Answer } from '@/types/game'
import AnswerCard from './AnswerCard'

interface AnswerBoardProps {
  answers: Answer[]
}

export default function AnswerBoard({ answers }: AnswerBoardProps) {
  // Split answers into two columns
  const midPoint = Math.ceil(answers.length / 2)
  const leftColumn = answers.slice(0, midPoint)
  const rightColumn = answers.slice(midPoint)

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 w-full max-w-4xl mx-auto">
      {/* Left column */}
      <div className="space-y-3 md:space-y-4">
        {leftColumn.map((answer, index) => (
          <AnswerCard key={answer.id} answer={answer} index={index} />
        ))}
      </div>

      {/* Right column */}
      <div className="space-y-3 md:space-y-4">
        {rightColumn.map((answer, index) => (
          <AnswerCard key={answer.id} answer={answer} index={midPoint + index} />
        ))}
      </div>
    </div>
  )
}
