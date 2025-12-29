'use client'

import { Answer } from '@/types/game'
import AnswerCard from './AnswerCard'

interface AnswerBoardProps {
  answers: Answer[]
  stolenAnswerIndex?: number // Index of stolen answer to show separately
}

export default function AnswerBoard({ answers, stolenAnswerIndex }: AnswerBoardProps) {
  // Separate main answers from stolen answer if specified
  const mainAnswers = stolenAnswerIndex !== undefined
    ? answers.filter((_, idx) => idx !== stolenAnswerIndex)
    : answers

  const stolenAnswer = stolenAnswerIndex !== undefined
    ? answers[stolenAnswerIndex]
    : null

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Main answers - single column French TV style */}
      <div className="space-y-2">
        {mainAnswers.map((answer, index) => (
          <AnswerCard
            key={answer.id}
            answer={answer}
            index={stolenAnswerIndex !== undefined && index >= stolenAnswerIndex ? index + 1 : index}
          />
        ))}
      </div>

      {/* Stolen answer - separated at bottom */}
      {stolenAnswer && (
        <>
          <div className="my-4 border-t-2 border-blue-400/30" />
          <AnswerCard
            answer={stolenAnswer}
            index={stolenAnswerIndex}
            isStolen={true}
          />
        </>
      )}
    </div>
  )
}
