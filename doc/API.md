# API Documentation

Golden Friends uses a combination of REST API endpoints and real-time Socket.IO events for communication between clients and the server.

## REST API Endpoints

### GET /api/server-info

Returns server network information for QR code generation.

**Response:**
```json
{
  "ip": "192.168.1.100",
  "port": "3000"
}
```

### POST /api/admin/verify

Verifies admin password for access to the admin panel.

**Request:**
```json
{
  "password": "string"
}
```

**Response (Success - 200):**
```json
{
  "success": true
}
```

**Response (Unauthorized - 401):**
```json
{
  "success": false
}
```

### GET /api/admin/contests

Lists all available contest files.

**Response:**
```json
{
  "contests": [
    {
      "id": "example",
      "name": "Example Contest",
      "description": "Sample Family Feud questions",
      "questionCount": 7
    }
  ]
}
```

## Socket.IO Events

The game uses Socket.IO for real-time communication. Events are categorized by direction.

### Server to Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `game:state` | `GameState` | Full game state broadcast to all clients |
| `game:stateUpdate` | `Partial<GameState>` | Partial state update |
| `buzzer:accepted` | `{ playerId: string, position: number }` | Confirms buzzer press with position |
| `buzzer:rejected` | `{ reason: string }` | Buzzer press rejected with reason |
| `player:list` | `Player[]` | List of all connected players |
| `sound:play` | `SoundType` | Trigger sound effect on clients |
| `admin:contestLoaded` | `{ success: boolean, contestId?: string, questionCount?: number, error?: string }` | Contest load result |
| `admin:currentContest` | `{ contestId: string }` | Current contest ID |

### Client to Server Events

#### Player Events

| Event | Payload | Description |
|-------|---------|-------------|
| `player:join` | `{ name: string, team: TeamId }` | Join the game with name and team |
| `player:leave` | - | Leave the game |
| `buzzer:press` | - | Press the buzzer |

#### Admin Events

| Event | Payload | Description |
|-------|---------|-------------|
| `admin:nextQuestion` | - | Go to next question |
| `admin:prevQuestion` | - | Go to previous question |
| `admin:goToQuestion` | `number` | Jump to specific question index |
| `admin:revealAnswer` | `number` | Reveal answer by ID |
| `admin:hideAnswer` | `number` | Hide answer by ID |
| `admin:revealAll` | - | Reveal all answers |
| `admin:updateScore` | `{ team: TeamId, delta: number }` | Adjust team score |
| `admin:setPhase` | `GamePhase` | Set game phase |
| `admin:setActiveTeam` | `TeamId \| null` | Set active/controlling team |
| `admin:resetBuzzers` | - | Clear buzz order and unlock |
| `admin:lockBuzzers` | `boolean` | Lock/unlock buzzers |
| `admin:showWrongX` | - | Display wrong X animation |
| `admin:hideWrongX` | - | Hide wrong X |
| `admin:addStrike` | - | Add strike to controlling team |
| `admin:awardPoints` | `TeamId` | Award round points to team |
| `admin:resetRound` | - | Reset current round state |
| `admin:correctAnswer` | `boolean` | Mark buzzer answer correct/wrong |
| `admin:loadContest` | `{ contestId: string, resetScores: boolean }` | Load a contest file |
| `admin:getCurrentContest` | - | Request current contest ID |
| `admin:startTimer` | `number` | Start timer (seconds) |
| `admin:stopTimer` | - | Stop timer |
| `admin:toggleDrinkingRules` | `boolean` | Show/hide drinking rules |
| `admin:showQuestion` | `boolean` | Show/hide question on TV |

#### Subscription Events

| Event | Payload | Description |
|-------|---------|-------------|
| `subscribe:tv` | - | Subscribe to TV updates |
| `subscribe:admin` | - | Subscribe to admin updates |

## Type Definitions

### TeamId
```typescript
type TeamId = 'girls' | 'boys'
```

### GamePhase
```typescript
type GamePhase = 'lobby' | 'faceoff' | 'play' | 'steal' | 'reveal' | 'complete'
```

### SoundType
```typescript
type SoundType = 'buzzer' | 'correct' | 'wrong' | 'reveal' | 'applause' | 'timer' | 'ding' | 'strike'
```

### Player
```typescript
interface Player {
  id: string       // Socket ID
  name: string
  team: TeamId
  connected: boolean
}
```

### BuzzEvent
```typescript
interface BuzzEvent {
  playerId: string
  playerName: string
  team: TeamId
  timestamp: number
}
```

### GameState
```typescript
interface GameState {
  phase: GamePhase
  currentQuestionIndex: number
  currentRound: number
  questions: Question[]
  teams: { girls: Team; boys: Team }
  activeTeam: TeamId | null
  controllingTeam: TeamId | null
  buzzOrder: BuzzEvent[]
  isLocked: boolean
  showWrongX: boolean
  roundPoints: number
  timerRunning: boolean
  timerEndTime: number | null
  timerDuration: number
  showConfetti: TeamId | null
  showDrinkingRules: boolean
  highlightDrinkingRule: string | null
  questionVisible: boolean
}
```

See `src/types/game.ts` for complete type definitions.
