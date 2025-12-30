import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import next from 'next'
import { parse } from 'url'
import fs from 'fs'
import path from 'path'
import os from 'os'

// Get local network IP address
function getLocalIP(): string {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'localhost'
}
import type {
  GameState,
  Player,
  TeamId,
  GamePhase,
  BuzzEvent,
  Question,
  ClientToServerEvents,
  ServerToClientEvents,
  SoundType,
} from '../src/types/game'
import { createInitialGameState } from '../src/types/game'

// Helper to load questions from contest file
function loadQuestionsFromFile(contestId: string): Question[] {
  const filePath = path.join(process.cwd(), 'src/data/contests', `${contestId}.json`)
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  return content.questions as Question[]
}

// Path for saved game state
const SAVED_STATE_PATH = path.join(process.cwd(), '.game-state.json')

// Save game state to file
function saveGameState() {
  try {
    const dataToSave = {
      contestId: currentContestId,
      gameState,
      savedAt: new Date().toISOString(),
    }
    fs.writeFileSync(SAVED_STATE_PATH, JSON.stringify(dataToSave, null, 2))
  } catch (err) {
    console.error('Failed to save game state:', err)
  }
}

// Load game state from file
function loadSavedGameState(): boolean {
  try {
    if (fs.existsSync(SAVED_STATE_PATH)) {
      const content = JSON.parse(fs.readFileSync(SAVED_STATE_PATH, 'utf-8'))
      if (content.gameState && content.contestId) {
        currentContestId = content.contestId
        gameState = content.gameState
        console.log(`Restored game state from ${content.savedAt}`)
        return true
      }
    }
  } catch (err) {
    console.error('Failed to load saved game state:', err)
  }
  return false
}

// Clear saved game state
function clearSavedGameState() {
  try {
    if (fs.existsSync(SAVED_STATE_PATH)) {
      fs.unlinkSync(SAVED_STATE_PATH)
      console.log('Cleared saved game state')
    }
  } catch (err) {
    console.error('Failed to clear saved game state:', err)
  }
}

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)
const localIP = getLocalIP()

// Make local IP available to Next.js API routes
process.env.LOCAL_IP = localIP

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Game state
let currentContestId = 'default'
let gameState: GameState = createInitialGameState(loadQuestionsFromFile(currentContestId))
let players: Map<string, Player> = new Map()

// Try to restore saved game state on startup
if (loadSavedGameState()) {
  // Clear players from restored state (they need to reconnect)
  gameState.teams.girls.players = []
  gameState.teams.boys.players = []
  gameState.buzzOrder = []
}

// Helper functions
function broadcastState(io: Server) {
  io.emit('game:state', gameState)
  saveGameState()  // Persist state after each change
}

function broadcastSound(io: Server, sound: SoundType) {
  io.emit('sound:play', sound)
}

function getPlayerList(): Player[] {
  return Array.from(players.values())
}

function broadcastPlayerList(io: Server) {
  io.emit('player:list', getPlayerList())
}

function getCurrentQuestion(): Question | undefined {
  return gameState.questions[gameState.currentQuestionIndex]
}

function resetRoundState() {
  gameState.buzzOrder = []
  gameState.isLocked = true
  gameState.showWrongX = false
  gameState.roundPoints = 0
  gameState.teams.girls.strikes = 0
  gameState.teams.boys.strikes = 0
  gameState.teams.girls.roundPoints = 0
  gameState.teams.boys.roundPoints = 0
  gameState.activeTeam = null
  gameState.controllingTeam = null
  gameState.questionVisible = false  // Hide question until admin reveals it

  // Reset all answers to hidden
  const question = getCurrentQuestion()
  if (question?.answers) {
    question.answers.forEach(a => a.revealed = false)
  }
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log('Client connected:', socket.id)

    // Send current state to new client
    socket.emit('game:state', gameState)
    socket.emit('player:list', getPlayerList())

    // Player joins
    socket.on('player:join', ({ name, team }) => {
      // Remove any existing player with same name on same team (handles refresh/reconnect)
      const existingPlayer = Array.from(players.values()).find(
        p => p.name === name && p.team === team
      )
      if (existingPlayer) {
        players.delete(existingPlayer.id)
        gameState.teams[team].players = gameState.teams[team].players.filter(
          p => p.id !== existingPlayer.id
        )
      }

      const player: Player = {
        id: socket.id,
        name,
        team,
        connected: true,
      }
      players.set(socket.id, player)
      gameState.teams[team].players.push(player)

      console.log(`Player ${name} joined team ${team}`)
      broadcastPlayerList(io)
      broadcastState(io)
    })

    // Player leaves
    socket.on('player:leave', () => {
      const player = players.get(socket.id)
      if (player) {
        gameState.teams[player.team].players = gameState.teams[player.team].players
          .filter(p => p.id !== socket.id)
        players.delete(socket.id)
        broadcastPlayerList(io)
        broadcastState(io)
      }
    })

    // Buzzer press
    socket.on('buzzer:press', () => {
      const player = players.get(socket.id)
      if (!player) {
        socket.emit('buzzer:rejected', { reason: 'Not registered' })
        return
      }

      if (gameState.isLocked) {
        socket.emit('buzzer:rejected', { reason: 'Buzzers are locked' })
        return
      }

      // Check if already buzzed
      if (gameState.buzzOrder.find(b => b.playerId === socket.id)) {
        socket.emit('buzzer:rejected', { reason: 'Already buzzed' })
        return
      }

      const buzzEvent: BuzzEvent = {
        playerId: socket.id,
        playerName: player.name,
        team: player.team,
        timestamp: performance.now(),
      }

      gameState.buzzOrder.push(buzzEvent)
      gameState.buzzOrder.sort((a, b) => a.timestamp - b.timestamp)

      const position = gameState.buzzOrder.findIndex(b => b.playerId === socket.id) + 1

      socket.emit('buzzer:accepted', { playerId: socket.id, position })
      broadcastSound(io, 'buzzer')
      broadcastState(io)

      console.log(`Buzzer: ${player.name} (${player.team}) - Position ${position}`)
    })

    // Subscribe to TV updates
    socket.on('subscribe:tv', () => {
      socket.join('tv')
      console.log('TV subscribed')
    })

    // Subscribe to Admin updates
    socket.on('subscribe:admin', () => {
      socket.join('admin')
      console.log('Admin subscribed')
    })

    // Admin: Next question
    socket.on('admin:nextQuestion', () => {
      if (gameState.currentQuestionIndex < gameState.questions.length - 1) {
        gameState.currentQuestionIndex++
        resetRoundState()
        gameState.phase = 'faceoff'

        // Update round number and check for multipliers
        const question = getCurrentQuestion()
        if (question) {
          gameState.currentRound = gameState.currentQuestionIndex + 1
        }

        broadcastState(io)
      }
    })

    // Admin: Previous question
    socket.on('admin:prevQuestion', () => {
      if (gameState.currentQuestionIndex > 0) {
        gameState.currentQuestionIndex--
        resetRoundState()
        gameState.phase = 'faceoff'
        gameState.currentRound = gameState.currentQuestionIndex + 1
        broadcastState(io)
      }
    })

    // Admin: Go to specific question
    socket.on('admin:goToQuestion', (index: number) => {
      if (index >= 0 && index < gameState.questions.length) {
        gameState.currentQuestionIndex = index
        resetRoundState()
        gameState.phase = 'faceoff'
        gameState.currentRound = index + 1
        broadcastState(io)
      }
    })

    // Admin: Reveal answer
    socket.on('admin:revealAnswer', (answerId: number) => {
      const question = getCurrentQuestion()
      if (question) {
        const answer = question.answers.find(a => a.id === answerId)
        if (answer && !answer.revealed) {
          answer.revealed = true

          // Add points to round total
          const multiplier = question.pointMultiplier || 1
          gameState.roundPoints += answer.points * multiplier

          // Highlight drinking rule if this is the #1 answer (first in list)
          if (answerId === 0 || (question.answers[0] && question.answers[0].id === answerId)) {
            gameState.highlightDrinkingRule = 'top-answer'
            setTimeout(() => {
              gameState.highlightDrinkingRule = null
              broadcastState(io)
            }, 3000)
          }

          broadcastSound(io, 'reveal')
          broadcastState(io)
        }
      }
    })

    // Admin: Hide answer
    socket.on('admin:hideAnswer', (answerId: number) => {
      const question = getCurrentQuestion()
      if (question) {
        const answer = question.answers.find(a => a.id === answerId)
        if (answer && answer.revealed) {
          answer.revealed = false

          // Remove points from round total
          const multiplier = question.pointMultiplier || 1
          gameState.roundPoints -= answer.points * multiplier

          broadcastState(io)
        }
      }
    })

    // Admin: Reveal all answers
    socket.on('admin:revealAll', () => {
      const question = getCurrentQuestion()
      if (question) {
        let newPoints = 0
        question.answers.forEach(a => {
          if (!a.revealed) {
            a.revealed = true
            const multiplier = question.pointMultiplier || 1
            newPoints += a.points * multiplier
          }
        })
        gameState.roundPoints += newPoints
        gameState.phase = 'reveal'
        broadcastSound(io, 'reveal')
        broadcastState(io)
      }
    })

    // Admin: Update score directly
    socket.on('admin:updateScore', ({ team, delta }) => {
      gameState.teams[team].score += delta
      if (gameState.teams[team].score < 0) {
        gameState.teams[team].score = 0
      }
      broadcastState(io)
    })

    // Admin: Set game phase
    socket.on('admin:setPhase', (phase: GamePhase) => {
      gameState.phase = phase
      if (phase === 'faceoff') {
        gameState.isLocked = false
        gameState.buzzOrder = []
      } else if (phase === 'play') {
        gameState.isLocked = true
      }
      broadcastState(io)
    })

    // Admin: Set active team
    socket.on('admin:setActiveTeam', (team: TeamId | null) => {
      gameState.activeTeam = team
      gameState.controllingTeam = team
      gameState.phase = 'play'
      gameState.isLocked = true
      broadcastState(io)
    })

    // Admin: Reset buzzers
    socket.on('admin:resetBuzzers', () => {
      gameState.buzzOrder = []
      gameState.isLocked = false
      broadcastState(io)
    })

    // Admin: Lock/unlock buzzers
    socket.on('admin:lockBuzzers', (locked: boolean) => {
      gameState.isLocked = locked
      broadcastState(io)
    })

    // Admin: Show wrong X
    socket.on('admin:showWrongX', () => {
      gameState.showWrongX = true
      broadcastSound(io, 'wrong')
      broadcastState(io)

      // Auto-hide after 2 seconds
      setTimeout(() => {
        gameState.showWrongX = false
        broadcastState(io)
      }, 2000)
    })

    // Admin: Hide wrong X
    socket.on('admin:hideWrongX', () => {
      gameState.showWrongX = false
      broadcastState(io)
    })

    // Admin: Add strike to active team
    socket.on('admin:addStrike', () => {
      if (gameState.controllingTeam) {
        gameState.teams[gameState.controllingTeam].strikes++
        gameState.showWrongX = true
        gameState.highlightDrinkingRule = 'strike'
        broadcastSound(io, 'strike')
        broadcastState(io)

        // Auto-hide X and drinking rule highlight
        setTimeout(() => {
          gameState.showWrongX = false
          gameState.highlightDrinkingRule = null
          broadcastState(io)
        }, 2000)

        // Check for 3 strikes
        if (gameState.teams[gameState.controllingTeam].strikes >= 3) {
          gameState.phase = 'steal'
          gameState.activeTeam = gameState.controllingTeam === 'girls' ? 'boys' : 'girls'
          broadcastState(io)
        }
      }
    })

    // Admin: Award points to team
    socket.on('admin:awardPoints', (team: TeamId) => {
      gameState.teams[team].score += gameState.roundPoints

      // Show confetti for big wins (20+ points)
      if (gameState.roundPoints >= 20) {
        gameState.showConfetti = team

        // Clear confetti after 4 seconds
        setTimeout(() => {
          gameState.showConfetti = null
          broadcastState(io)
        }, 4000)
      }

      broadcastState(io)
    })

    // Admin: Reset current round
    socket.on('admin:resetRound', () => {
      resetRoundState()
      gameState.phase = 'faceoff'
      broadcastState(io)
    })

    // Admin: Mark answer correct/wrong (for buzzer questions)
    socket.on('admin:correctAnswer', (isCorrect: boolean) => {
      const question = getCurrentQuestion()
      if (!question || question.type !== 'buzzer') return

      if (isCorrect) {
        // Award points to the team of the first buzzer
        if (gameState.buzzOrder.length > 0) {
          const winner = gameState.buzzOrder[0]
          const multiplier = question.pointMultiplier || 1
          gameState.teams[winner.team].score += 30 * multiplier // +30 for buzzer questions
          gameState.showConfetti = winner.team
          broadcastSound(io, 'correct')

          // Stop timer if running
          gameState.timerRunning = false
          gameState.timerEndTime = null

          // Clear confetti after 3 seconds
          setTimeout(() => {
            gameState.showConfetti = null
            broadcastState(io)
          }, 3000)
        }
      } else {
        // Wrong answer: -10 points, let next person try
        if (gameState.buzzOrder.length > 0) {
          const wrong = gameState.buzzOrder[0]
          const multiplier = question.pointMultiplier || 1
          gameState.teams[wrong.team].score -= 10 * multiplier
          gameState.buzzOrder.shift() // Remove first person
          broadcastSound(io, 'wrong')
        }
      }
      broadcastState(io)
    })

    // Admin: Start timer
    socket.on('admin:startTimer', (duration: number) => {
      gameState.timerDuration = duration
      gameState.timerEndTime = Date.now() + (duration * 1000)
      gameState.timerRunning = true
      broadcastState(io)

      // Auto-stop timer when it ends
      setTimeout(() => {
        if (gameState.timerRunning && gameState.timerEndTime && Date.now() >= gameState.timerEndTime) {
          gameState.timerRunning = false
          gameState.timerEndTime = null
          broadcastSound(io, 'timer')
          broadcastState(io)
        }
      }, duration * 1000)
    })

    // Admin: Stop timer
    socket.on('admin:stopTimer', () => {
      gameState.timerRunning = false
      gameState.timerEndTime = null
      broadcastState(io)
    })

    // Admin: Toggle drinking rules
    socket.on('admin:toggleDrinkingRules', (show: boolean) => {
      gameState.showDrinkingRules = show
      broadcastState(io)
    })

    // Admin: Show/hide question on TV
    socket.on('admin:showQuestion', (visible: boolean) => {
      gameState.questionVisible = visible
      // Automatically unlock buzzers when showing question
      if (visible) {
        gameState.isLocked = false
      }
      broadcastState(io)
    })

    // Admin: Load contest
    socket.on('admin:loadContest', ({ contestId, resetScores }: { contestId: string; resetScores: boolean }) => {
      try {
        const questions = loadQuestionsFromFile(contestId)

        // Clear saved state when loading a new contest
        clearSavedGameState()

        // Save current scores if not resetting
        const girlsScore = resetScores ? 0 : gameState.teams.girls.score
        const boysScore = resetScores ? 0 : gameState.teams.boys.score

        // Create new game state with new questions
        gameState = createInitialGameState(questions)
        currentContestId = contestId

        // Restore scores if not resetting
        gameState.teams.girls.score = girlsScore
        gameState.teams.boys.score = boysScore

        // Re-add existing players to teams
        players.forEach((player) => {
          gameState.teams[player.team].players.push(player)
        })

        // Broadcast new state to all clients (this resets buzzers on their end)
        broadcastState(io)

        // Also broadcast player list to ensure buzzer positions are cleared
        broadcastPlayerList(io)

        // Notify admin of success
        socket.emit('admin:contestLoaded', {
          success: true,
          contestId,
          questionCount: questions.length,
        })

        console.log(`Loaded contest: ${contestId} with ${questions.length} questions`)
      } catch (error) {
        console.error('Failed to load contest:', error)
        socket.emit('admin:contestLoaded', {
          success: false,
          error: 'Failed to load contest',
        })
      }
    })

    // Admin: Get current contest
    socket.on('admin:getCurrentContest', () => {
      socket.emit('admin:currentContest', { contestId: currentContestId })
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      const player = players.get(socket.id)
      if (player) {
        player.connected = false
        console.log(`Player ${player.name} disconnected`)
        broadcastPlayerList(io)
      }
      console.log('Client disconnected:', socket.id)
    })
  })

  httpServer.listen(port, hostname, () => {
    console.log(`> Golden Friends server ready on http://${hostname}:${port}`)
    console.log(`> Local network: http://${localIP}:${port}`)
    console.log(`> TV: http://${localIP}:${port}/tv`)
    console.log(`> Admin: http://${localIP}:${port}/admin`)
    console.log(`> Buzzer: http://${localIP}:${port}/buzzer`)
  })
})
