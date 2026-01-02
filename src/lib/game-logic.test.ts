import { describe, it, expect } from 'vitest'
import {
  calculateRoundPoints,
  getOppositeTeam,
  hasPlayerBuzzed,
  sortBuzzOrder,
  getBuzzPosition,
  hasMaxStrikes,
  calculateBuzzerPoints,
  canNavigateToQuestion,
  clampScore,
  shouldShowConfetti,
  findAnswerById,
  isTopAnswer,
  countRevealedAnswers,
  areAllAnswersRevealed,
} from './game-logic'
import type { Question, BuzzEvent } from '../types/game'

describe('calculateRoundPoints', () => {
  it('should return 0 when no answers are revealed', () => {
    const question: Question = {
      id: 1,
      type: 'multiple',
      question: 'Test?',
      answers: [
        { id: 1, text: 'A', points: 30, revealed: false },
        { id: 2, text: 'B', points: 20, revealed: false },
      ],
    }

    expect(calculateRoundPoints(question)).toBe(0)
  })

  it('should sum points of revealed answers', () => {
    const question: Question = {
      id: 1,
      type: 'multiple',
      question: 'Test?',
      answers: [
        { id: 1, text: 'A', points: 30, revealed: true },
        { id: 2, text: 'B', points: 20, revealed: true },
        { id: 3, text: 'C', points: 10, revealed: false },
      ],
    }

    expect(calculateRoundPoints(question)).toBe(50)
  })

  it('should apply point multiplier', () => {
    const question: Question = {
      id: 1,
      type: 'multiple',
      question: 'Test?',
      pointMultiplier: 2,
      answers: [
        { id: 1, text: 'A', points: 30, revealed: true },
        { id: 2, text: 'B', points: 20, revealed: false },
      ],
    }

    expect(calculateRoundPoints(question)).toBe(60)
  })

  it('should default to multiplier of 1', () => {
    const question: Question = {
      id: 1,
      type: 'multiple',
      question: 'Test?',
      answers: [
        { id: 1, text: 'A', points: 25, revealed: true },
      ],
    }

    expect(calculateRoundPoints(question)).toBe(25)
  })

  it('should handle 3x multiplier', () => {
    const question: Question = {
      id: 1,
      type: 'multiple',
      question: 'Test?',
      pointMultiplier: 3,
      answers: [
        { id: 1, text: 'A', points: 10, revealed: true },
        { id: 2, text: 'B', points: 10, revealed: true },
      ],
    }

    expect(calculateRoundPoints(question)).toBe(60)
  })
})

describe('getOppositeTeam', () => {
  it('should return boys when given girls', () => {
    expect(getOppositeTeam('girls')).toBe('boys')
  })

  it('should return girls when given boys', () => {
    expect(getOppositeTeam('boys')).toBe('girls')
  })
})

describe('hasPlayerBuzzed', () => {
  const buzzOrder: BuzzEvent[] = [
    { playerId: 'player1', playerName: 'Alice', team: 'girls', timestamp: 100 },
    { playerId: 'player2', playerName: 'Bob', team: 'boys', timestamp: 200 },
  ]

  it('should return true if player has buzzed', () => {
    expect(hasPlayerBuzzed(buzzOrder, 'player1')).toBe(true)
    expect(hasPlayerBuzzed(buzzOrder, 'player2')).toBe(true)
  })

  it('should return false if player has not buzzed', () => {
    expect(hasPlayerBuzzed(buzzOrder, 'player3')).toBe(false)
  })

  it('should return false for empty buzz order', () => {
    expect(hasPlayerBuzzed([], 'player1')).toBe(false)
  })
})

describe('sortBuzzOrder', () => {
  it('should sort by timestamp ascending', () => {
    const buzzOrder: BuzzEvent[] = [
      { playerId: 'p2', playerName: 'B', team: 'boys', timestamp: 200 },
      { playerId: 'p1', playerName: 'A', team: 'girls', timestamp: 100 },
      { playerId: 'p3', playerName: 'C', team: 'girls', timestamp: 150 },
    ]

    const sorted = sortBuzzOrder(buzzOrder)

    expect(sorted[0].playerId).toBe('p1')
    expect(sorted[1].playerId).toBe('p3')
    expect(sorted[2].playerId).toBe('p2')
  })

  it('should not mutate original array', () => {
    const buzzOrder: BuzzEvent[] = [
      { playerId: 'p2', playerName: 'B', team: 'boys', timestamp: 200 },
      { playerId: 'p1', playerName: 'A', team: 'girls', timestamp: 100 },
    ]

    const sorted = sortBuzzOrder(buzzOrder)

    expect(buzzOrder[0].playerId).toBe('p2')
    expect(sorted[0].playerId).toBe('p1')
  })
})

describe('getBuzzPosition', () => {
  const buzzOrder: BuzzEvent[] = [
    { playerId: 'p2', playerName: 'B', team: 'boys', timestamp: 200 },
    { playerId: 'p1', playerName: 'A', team: 'girls', timestamp: 100 },
    { playerId: 'p3', playerName: 'C', team: 'girls', timestamp: 150 },
  ]

  it('should return 1-indexed position', () => {
    expect(getBuzzPosition(buzzOrder, 'p1')).toBe(1) // timestamp 100 is first
    expect(getBuzzPosition(buzzOrder, 'p3')).toBe(2) // timestamp 150 is second
    expect(getBuzzPosition(buzzOrder, 'p2')).toBe(3) // timestamp 200 is third
  })

  it('should return -1 for player not in list', () => {
    expect(getBuzzPosition(buzzOrder, 'p4')).toBe(-1)
  })
})

describe('hasMaxStrikes', () => {
  it('should return true for 3 or more strikes', () => {
    expect(hasMaxStrikes(3)).toBe(true)
    expect(hasMaxStrikes(4)).toBe(true)
  })

  it('should return false for less than 3 strikes', () => {
    expect(hasMaxStrikes(0)).toBe(false)
    expect(hasMaxStrikes(1)).toBe(false)
    expect(hasMaxStrikes(2)).toBe(false)
  })
})

describe('calculateBuzzerPoints', () => {
  it('should return 30 for correct answer', () => {
    expect(calculateBuzzerPoints(true)).toBe(30)
  })

  it('should return -10 for incorrect answer', () => {
    expect(calculateBuzzerPoints(false)).toBe(-10)
  })

  it('should apply multiplier for correct answer', () => {
    expect(calculateBuzzerPoints(true, 2)).toBe(60)
    expect(calculateBuzzerPoints(true, 3)).toBe(90)
  })

  it('should apply multiplier for incorrect answer', () => {
    expect(calculateBuzzerPoints(false, 2)).toBe(-20)
    expect(calculateBuzzerPoints(false, 3)).toBe(-30)
  })
})

describe('canNavigateToQuestion', () => {
  it('should return true for valid indices', () => {
    expect(canNavigateToQuestion(0, 5)).toBe(true)
    expect(canNavigateToQuestion(4, 5)).toBe(true)
    expect(canNavigateToQuestion(2, 5)).toBe(true)
  })

  it('should return false for negative index', () => {
    expect(canNavigateToQuestion(-1, 5)).toBe(false)
  })

  it('should return false for index >= total questions', () => {
    expect(canNavigateToQuestion(5, 5)).toBe(false)
    expect(canNavigateToQuestion(10, 5)).toBe(false)
  })

  it('should return false when no questions', () => {
    expect(canNavigateToQuestion(0, 0)).toBe(false)
  })
})

describe('clampScore', () => {
  it('should return 0 for negative values', () => {
    expect(clampScore(-10)).toBe(0)
    expect(clampScore(-1)).toBe(0)
  })

  it('should return unchanged for positive values', () => {
    expect(clampScore(0)).toBe(0)
    expect(clampScore(50)).toBe(50)
    expect(clampScore(100)).toBe(100)
  })
})

describe('shouldShowConfetti', () => {
  it('should return true for 20 or more points', () => {
    expect(shouldShowConfetti(20)).toBe(true)
    expect(shouldShowConfetti(50)).toBe(true)
    expect(shouldShowConfetti(100)).toBe(true)
  })

  it('should return false for less than 20 points', () => {
    expect(shouldShowConfetti(0)).toBe(false)
    expect(shouldShowConfetti(19)).toBe(false)
  })
})

describe('findAnswerById', () => {
  const question: Question = {
    id: 1,
    type: 'multiple',
    question: 'Test?',
    answers: [
      { id: 1, text: 'A', points: 30, revealed: false },
      { id: 2, text: 'B', points: 20, revealed: false },
      { id: 3, text: 'C', points: 10, revealed: true },
    ],
  }

  it('should find answer by id', () => {
    const answer = findAnswerById(question, 2)
    expect(answer?.text).toBe('B')
    expect(answer?.points).toBe(20)
  })

  it('should return undefined for non-existent id', () => {
    expect(findAnswerById(question, 99)).toBeUndefined()
  })
})

describe('isTopAnswer', () => {
  const question: Question = {
    id: 1,
    type: 'multiple',
    question: 'Test?',
    answers: [
      { id: 5, text: 'Top', points: 40, revealed: false },
      { id: 2, text: 'Second', points: 20, revealed: false },
    ],
  }

  it('should return true for first answer in list', () => {
    expect(isTopAnswer(question, 5)).toBe(true)
  })

  it('should return true for id 0 (legacy check)', () => {
    expect(isTopAnswer(question, 0)).toBe(true)
  })

  it('should return false for non-top answers', () => {
    expect(isTopAnswer(question, 2)).toBe(false)
    expect(isTopAnswer(question, 99)).toBe(false)
  })
})

describe('countRevealedAnswers', () => {
  it('should count revealed answers', () => {
    const question: Question = {
      id: 1,
      type: 'multiple',
      question: 'Test?',
      answers: [
        { id: 1, text: 'A', points: 30, revealed: true },
        { id: 2, text: 'B', points: 20, revealed: false },
        { id: 3, text: 'C', points: 10, revealed: true },
      ],
    }

    expect(countRevealedAnswers(question)).toBe(2)
  })

  it('should return 0 when none revealed', () => {
    const question: Question = {
      id: 1,
      type: 'multiple',
      question: 'Test?',
      answers: [
        { id: 1, text: 'A', points: 30, revealed: false },
      ],
    }

    expect(countRevealedAnswers(question)).toBe(0)
  })
})

describe('areAllAnswersRevealed', () => {
  it('should return true when all revealed', () => {
    const question: Question = {
      id: 1,
      type: 'multiple',
      question: 'Test?',
      answers: [
        { id: 1, text: 'A', points: 30, revealed: true },
        { id: 2, text: 'B', points: 20, revealed: true },
      ],
    }

    expect(areAllAnswersRevealed(question)).toBe(true)
  })

  it('should return false when some not revealed', () => {
    const question: Question = {
      id: 1,
      type: 'multiple',
      question: 'Test?',
      answers: [
        { id: 1, text: 'A', points: 30, revealed: true },
        { id: 2, text: 'B', points: 20, revealed: false },
      ],
    }

    expect(areAllAnswersRevealed(question)).toBe(false)
  })

  it('should return true for empty answers', () => {
    const question: Question = {
      id: 1,
      type: 'buzzer',
      question: 'Test?',
      answers: [],
    }

    expect(areAllAnswersRevealed(question)).toBe(true)
  })
})
