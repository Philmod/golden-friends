import { describe, it, expect } from 'vitest'
import {
  createInitialGameState,
  type Question,
  type GameState,
  type Answer,
} from './game'

describe('createInitialGameState', () => {
  const sampleQuestions: Question[] = [
    {
      id: 1,
      type: 'multiple',
      question: 'Test question?',
      answers: [
        { id: 1, text: 'Answer 1', points: 30, revealed: false },
        { id: 2, text: 'Answer 2', points: 20, revealed: false },
      ],
    },
    {
      id: 2,
      type: 'buzzer',
      question: 'Who said this?',
      correctAnswer: 'Someone',
      answers: [],
    },
  ]

  it('should create initial state with provided questions', () => {
    const state = createInitialGameState(sampleQuestions)

    expect(state.questions).toBe(sampleQuestions)
    expect(state.questions.length).toBe(2)
  })

  it('should initialize with lobby phase', () => {
    const state = createInitialGameState(sampleQuestions)

    expect(state.phase).toBe('lobby')
  })

  it('should start at question index 0', () => {
    const state = createInitialGameState(sampleQuestions)

    expect(state.currentQuestionIndex).toBe(0)
    expect(state.currentRound).toBe(1)
  })

  it('should initialize both teams with zero scores', () => {
    const state = createInitialGameState(sampleQuestions)

    expect(state.teams.girls.score).toBe(0)
    expect(state.teams.boys.score).toBe(0)
    expect(state.teams.girls.roundPoints).toBe(0)
    expect(state.teams.boys.roundPoints).toBe(0)
  })

  it('should initialize teams with zero strikes', () => {
    const state = createInitialGameState(sampleQuestions)

    expect(state.teams.girls.strikes).toBe(0)
    expect(state.teams.boys.strikes).toBe(0)
  })

  it('should initialize teams with empty player lists', () => {
    const state = createInitialGameState(sampleQuestions)

    expect(state.teams.girls.players).toEqual([])
    expect(state.teams.boys.players).toEqual([])
  })

  it('should set correct team colors and names', () => {
    const state = createInitialGameState(sampleQuestions)

    expect(state.teams.girls.name).toBe('Girls')
    expect(state.teams.girls.color).toBe('#FF69B4')
    expect(state.teams.boys.name).toBe('Boys')
    expect(state.teams.boys.color).toBe('#4169E1')
  })

  it('should initialize with locked buzzers', () => {
    const state = createInitialGameState(sampleQuestions)

    expect(state.isLocked).toBe(true)
  })

  it('should initialize with empty buzz order', () => {
    const state = createInitialGameState(sampleQuestions)

    expect(state.buzzOrder).toEqual([])
  })

  it('should initialize timer in stopped state', () => {
    const state = createInitialGameState(sampleQuestions)

    expect(state.timerRunning).toBe(false)
    expect(state.timerEndTime).toBeNull()
    expect(state.timerDuration).toBe(10)
  })

  it('should initialize with no active or controlling team', () => {
    const state = createInitialGameState(sampleQuestions)

    expect(state.activeTeam).toBeNull()
    expect(state.controllingTeam).toBeNull()
  })

  it('should initialize UI states correctly', () => {
    const state = createInitialGameState(sampleQuestions)

    expect(state.showWrongX).toBe(false)
    expect(state.showConfetti).toBeNull()
    expect(state.showDrinkingRules).toBe(true)
    expect(state.highlightDrinkingRule).toBeNull()
    expect(state.questionVisible).toBe(false)
  })

  it('should initialize with zero round points', () => {
    const state = createInitialGameState(sampleQuestions)

    expect(state.roundPoints).toBe(0)
  })

  it('should handle empty questions array', () => {
    const state = createInitialGameState([])

    expect(state.questions).toEqual([])
    expect(state.currentQuestionIndex).toBe(0)
  })
})

describe('GameState types', () => {
  it('should allow valid game phases', () => {
    const validPhases = ['lobby', 'faceoff', 'play', 'steal', 'reveal', 'complete']

    validPhases.forEach((phase) => {
      const state = createInitialGameState([])
      state.phase = phase as GameState['phase']
      expect(state.phase).toBe(phase)
    })
  })

  it('should allow valid team ids', () => {
    const state = createInitialGameState([])

    state.activeTeam = 'girls'
    expect(state.activeTeam).toBe('girls')

    state.activeTeam = 'boys'
    expect(state.activeTeam).toBe('boys')

    state.activeTeam = null
    expect(state.activeTeam).toBeNull()
  })
})

describe('Answer structure', () => {
  it('should track revealed state correctly', () => {
    const answer: Answer = {
      id: 1,
      text: 'Test Answer',
      points: 25,
      revealed: false,
    }

    expect(answer.revealed).toBe(false)
    answer.revealed = true
    expect(answer.revealed).toBe(true)
  })
})

describe('Question structure', () => {
  it('should support multiple question type with answers', () => {
    const question: Question = {
      id: 1,
      type: 'multiple',
      question: 'Test?',
      answers: [
        { id: 1, text: 'A', points: 30, revealed: false },
      ],
    }

    expect(question.type).toBe('multiple')
    expect(question.answers.length).toBe(1)
  })

  it('should support buzzer question type with correct answer', () => {
    const question: Question = {
      id: 1,
      type: 'buzzer',
      question: 'Who?',
      correctAnswer: 'Someone',
      answers: [],
    }

    expect(question.type).toBe('buzzer')
    expect(question.correctAnswer).toBe('Someone')
  })

  it('should support optional properties', () => {
    const question: Question = {
      id: 1,
      type: 'multiple',
      question: 'Test?',
      category: 'Trivia',
      mediaUrl: '/test.jpg',
      timeLimit: 30,
      pointMultiplier: 2,
      answers: [],
    }

    expect(question.category).toBe('Trivia')
    expect(question.mediaUrl).toBe('/test.jpg')
    expect(question.timeLimit).toBe(30)
    expect(question.pointMultiplier).toBe(2)
  })
})
