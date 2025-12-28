import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import next from 'next'
import { parse } from 'url'
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
import questionsData from '../src/data/questions.json'

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Game state
let gameState: GameState = createInitialGameState(questionsData.questions as Question[])
let players: Map<string, Player> = new Map()

// Helper functions
function broadcastState(io: Server) {
  io.emit('game:state', gameState)
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

  // Reset all answers to hidden
  const question = getCurrentQuestion()
  if (question) {
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
        broadcastSound(io, 'strike')
        broadcastState(io)

        // Auto-hide X
        setTimeout(() => {
          gameState.showWrongX = false
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
      broadcastSound(io, 'correct')
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
          gameState.teams[winner.team].score += 10 // +10 for photo questions
          broadcastSound(io, 'correct')
        }
      } else {
        // Wrong answer: -5 points, let next person try
        if (gameState.buzzOrder.length > 0) {
          const wrong = gameState.buzzOrder[0]
          gameState.teams[wrong.team].score -= 5
          gameState.buzzOrder.shift() // Remove first person
          broadcastSound(io, 'wrong')
        }
      }
      broadcastState(io)
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
    console.log(`> TV: http://localhost:${port}/tv`)
    console.log(`> Admin: http://localhost:${port}/admin`)
    console.log(`> Buzzer: http://localhost:${port}/buzzer`)
  })
})
