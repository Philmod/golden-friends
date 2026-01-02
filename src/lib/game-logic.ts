import type { Question, TeamId, BuzzEvent, Answer } from '../types/game'

/**
 * Calculate round points for a question based on revealed answers and multiplier
 */
export function calculateRoundPoints(question: Question): number {
  const multiplier = question.pointMultiplier || 1
  return question.answers.reduce((total, answer) => {
    if (answer.revealed) {
      return total + answer.points * multiplier
    }
    return total
  }, 0)
}

/**
 * Get the opposite team
 */
export function getOppositeTeam(team: TeamId): TeamId {
  return team === 'girls' ? 'boys' : 'girls'
}

/**
 * Check if a player has already buzzed
 */
export function hasPlayerBuzzed(buzzOrder: BuzzEvent[], playerId: string): boolean {
  return buzzOrder.some((buzz) => buzz.playerId === playerId)
}

/**
 * Sort buzz events by timestamp
 */
export function sortBuzzOrder(buzzOrder: BuzzEvent[]): BuzzEvent[] {
  return [...buzzOrder].sort((a, b) => a.timestamp - b.timestamp)
}

/**
 * Get player position in buzz order (1-indexed)
 */
export function getBuzzPosition(buzzOrder: BuzzEvent[], playerId: string): number {
  const sorted = sortBuzzOrder(buzzOrder)
  const index = sorted.findIndex((buzz) => buzz.playerId === playerId)
  return index === -1 ? -1 : index + 1
}

/**
 * Check if team has reached max strikes (3)
 */
export function hasMaxStrikes(strikes: number): boolean {
  return strikes >= 3
}

/**
 * Calculate points for buzzer question
 */
export function calculateBuzzerPoints(isCorrect: boolean, multiplier: number = 1): number {
  if (isCorrect) {
    return 30 * multiplier
  }
  return -10 * multiplier
}

/**
 * Validate question navigation bounds
 */
export function canNavigateToQuestion(
  targetIndex: number,
  totalQuestions: number
): boolean {
  return targetIndex >= 0 && targetIndex < totalQuestions
}

/**
 * Ensure score doesn't go negative
 */
export function clampScore(score: number): number {
  return Math.max(0, score)
}

/**
 * Check if confetti should be shown based on points
 */
export function shouldShowConfetti(points: number): boolean {
  return points >= 20
}

/**
 * Create a buzz event
 */
export function createBuzzEvent(
  playerId: string,
  playerName: string,
  team: TeamId
): BuzzEvent {
  return {
    playerId,
    playerName,
    team,
    timestamp: performance.now(),
  }
}

/**
 * Find answer by id in question
 */
export function findAnswerById(question: Question, answerId: number): Answer | undefined {
  return question.answers.find((a) => a.id === answerId)
}

/**
 * Check if answer is the top answer (first in list)
 */
export function isTopAnswer(question: Question, answerId: number): boolean {
  const firstAnswer = question.answers[0]
  return firstAnswer?.id === answerId || answerId === 0
}

/**
 * Count revealed answers in a question
 */
export function countRevealedAnswers(question: Question): number {
  return question.answers.filter((a) => a.revealed).length
}

/**
 * Check if all answers are revealed
 */
export function areAllAnswersRevealed(question: Question): boolean {
  return question.answers.every((a) => a.revealed)
}
