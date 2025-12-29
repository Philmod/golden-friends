'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { getSocket } from '@/lib/socket'
import type {
  GameState,
  Player,
  TeamId,
  GamePhase,
  SoundType,
  ClientToServerEvents,
} from '@/types/game'

interface GameContextValue {
  // State
  gameState: GameState | null
  players: Player[]
  isConnected: boolean
  myPlayerId: string | null
  myTeam: TeamId | null
  myBuzzerPosition: number | null
  currentContestId: string | null

  // Player actions
  joinGame: (name: string, team: TeamId) => void
  leaveGame: () => void
  pressBuzzer: () => void

  // Admin actions
  nextQuestion: () => void
  prevQuestion: () => void
  goToQuestion: (index: number) => void
  revealAnswer: (answerId: number) => void
  hideAnswer: (answerId: number) => void
  revealAll: () => void
  updateScore: (team: TeamId, delta: number) => void
  setPhase: (phase: GamePhase) => void
  setActiveTeam: (team: TeamId | null) => void
  resetBuzzers: () => void
  lockBuzzers: (locked: boolean) => void
  showWrongX: () => void
  hideWrongX: () => void
  addStrike: () => void
  awardPoints: (team: TeamId) => void
  resetRound: () => void
  markCorrect: (isCorrect: boolean) => void
  loadContest: (contestId: string, resetScores: boolean) => void
  getCurrentContest: () => void

  // Subscriptions
  subscribeTV: () => void
  subscribeAdmin: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null)
  const [myTeam, setMyTeam] = useState<TeamId | null>(null)
  const [myBuzzerPosition, setMyBuzzerPosition] = useState<number | null>(null)
  const [currentContestId, setCurrentContestId] = useState<string | null>(null)

  // Sound playing
  const playSound = useCallback((soundId: SoundType) => {
    const audio = new Audio(`/sounds/${soundId}.mp3`)
    audio.play().catch(e => console.log('Sound play failed:', e))
  }, [])

  useEffect(() => {
    const socket = getSocket()

    socket.on('connect', () => {
      setIsConnected(true)
      setMyPlayerId(socket.id || null)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('game:state', (state) => {
      setGameState(state)
    })

    socket.on('game:stateUpdate', (partialState) => {
      setGameState(prev => prev ? { ...prev, ...partialState } : null)
    })

    socket.on('player:list', (playerList) => {
      setPlayers(playerList)
    })

    socket.on('buzzer:accepted', ({ playerId, position }) => {
      if (playerId === socket.id) {
        setMyBuzzerPosition(position)
      }
    })

    socket.on('buzzer:rejected', ({ reason }) => {
      console.log('Buzzer rejected:', reason)
    })

    socket.on('sound:play', (soundId) => {
      playSound(soundId)
    })

    socket.on('admin:contestLoaded', (data) => {
      if (data.success && data.contestId) {
        setCurrentContestId(data.contestId)
        console.log(`Contest loaded: ${data.contestId} (${data.questionCount} questions)`)
      } else {
        console.error('Failed to load contest:', data.error)
      }
    })

    socket.on('admin:currentContest', (data) => {
      setCurrentContestId(data.contestId)
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('game:state')
      socket.off('game:stateUpdate')
      socket.off('player:list')
      socket.off('buzzer:accepted')
      socket.off('buzzer:rejected')
      socket.off('sound:play')
      socket.off('admin:contestLoaded')
      socket.off('admin:currentContest')
    }
  }, [playSound])

  // Player actions
  const joinGame = useCallback((name: string, team: TeamId) => {
    const socket = getSocket()
    socket.emit('player:join', { name, team })
    setMyTeam(team)

    // Save to localStorage
    localStorage.setItem('goldenFriends_player', JSON.stringify({ name, team }))
  }, [])

  const leaveGame = useCallback(() => {
    const socket = getSocket()
    socket.emit('player:leave')
    setMyTeam(null)
    setMyBuzzerPosition(null)
    localStorage.removeItem('goldenFriends_player')
  }, [])

  const pressBuzzer = useCallback(() => {
    const socket = getSocket()
    socket.emit('buzzer:press')

    // Vibrate on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }, [])

  // Admin actions
  const nextQuestion = useCallback(() => {
    const socket = getSocket()
    socket.emit('admin:nextQuestion')
    setMyBuzzerPosition(null)
  }, [])

  const prevQuestion = useCallback(() => {
    const socket = getSocket()
    socket.emit('admin:prevQuestion')
    setMyBuzzerPosition(null)
  }, [])

  const goToQuestion = useCallback((index: number) => {
    const socket = getSocket()
    socket.emit('admin:goToQuestion', index)
    setMyBuzzerPosition(null)
  }, [])

  const revealAnswer = useCallback((answerId: number) => {
    const socket = getSocket()
    socket.emit('admin:revealAnswer', answerId)
  }, [])

  const hideAnswer = useCallback((answerId: number) => {
    const socket = getSocket()
    socket.emit('admin:hideAnswer', answerId)
  }, [])

  const revealAll = useCallback(() => {
    const socket = getSocket()
    socket.emit('admin:revealAll')
  }, [])

  const updateScore = useCallback((team: TeamId, delta: number) => {
    const socket = getSocket()
    socket.emit('admin:updateScore', { team, delta })
  }, [])

  const setPhase = useCallback((phase: GamePhase) => {
    const socket = getSocket()
    socket.emit('admin:setPhase', phase)
    if (phase === 'faceoff') {
      setMyBuzzerPosition(null)
    }
  }, [])

  const setActiveTeam = useCallback((team: TeamId | null) => {
    const socket = getSocket()
    socket.emit('admin:setActiveTeam', team)
  }, [])

  const resetBuzzers = useCallback(() => {
    const socket = getSocket()
    socket.emit('admin:resetBuzzers')
    setMyBuzzerPosition(null)
  }, [])

  const lockBuzzers = useCallback((locked: boolean) => {
    const socket = getSocket()
    socket.emit('admin:lockBuzzers', locked)
  }, [])

  const showWrongX = useCallback(() => {
    const socket = getSocket()
    socket.emit('admin:showWrongX')
  }, [])

  const hideWrongX = useCallback(() => {
    const socket = getSocket()
    socket.emit('admin:hideWrongX')
  }, [])

  const addStrike = useCallback(() => {
    const socket = getSocket()
    socket.emit('admin:addStrike')
  }, [])

  const awardPoints = useCallback((team: TeamId) => {
    const socket = getSocket()
    socket.emit('admin:awardPoints', team)
  }, [])

  const resetRound = useCallback(() => {
    const socket = getSocket()
    socket.emit('admin:resetRound')
    setMyBuzzerPosition(null)
  }, [])

  const markCorrect = useCallback((isCorrect: boolean) => {
    const socket = getSocket()
    socket.emit('admin:correctAnswer', isCorrect)
  }, [])

  const loadContest = useCallback((contestId: string, resetScores: boolean) => {
    const socket = getSocket()
    socket.emit('admin:loadContest', { contestId, resetScores })
    setMyBuzzerPosition(null)
  }, [])

  const getCurrentContest = useCallback(() => {
    const socket = getSocket()
    socket.emit('admin:getCurrentContest')
  }, [])

  // Subscriptions
  const subscribeTV = useCallback(() => {
    const socket = getSocket()
    socket.emit('subscribe:tv')
  }, [])

  const subscribeAdmin = useCallback(() => {
    const socket = getSocket()
    socket.emit('subscribe:admin')
  }, [])

  const value: GameContextValue = {
    gameState,
    players,
    isConnected,
    myPlayerId,
    myTeam,
    myBuzzerPosition,
    currentContestId,
    joinGame,
    leaveGame,
    pressBuzzer,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    revealAnswer,
    hideAnswer,
    revealAll,
    updateScore,
    setPhase,
    setActiveTeam,
    resetBuzzers,
    lockBuzzers,
    showWrongX,
    hideWrongX,
    addStrike,
    awardPoints,
    resetRound,
    markCorrect,
    loadContest,
    getCurrentContest,
    subscribeTV,
    subscribeAdmin,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
