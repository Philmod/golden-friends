# Architecture

Golden Friends is a real-time multiplayer game built with Next.js and Socket.IO.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTTP Server                              │
│                      (server/index.ts)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Next.js    │    │  Socket.IO   │    │ Game State   │       │
│  │   Handler    │    │   Server     │    │  Manager     │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   │                │
└─────────┼───────────────────┼───────────────────┼────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
    ┌──────────┐       ┌──────────┐        ┌──────────┐
    │  REST    │       │ WebSocket│        │  File    │
    │  APIs    │       │ Clients  │        │  System  │
    └──────────┘       └──────────┘        └──────────┘
```

## Components

### Server (`server/index.ts`)

The custom server combines Next.js and Socket.IO into a single process:

- **HTTP Server**: Handles both Next.js page requests and Socket.IO connections
- **Game State**: In-memory game state with file persistence (`.game-state.json`)
- **Player Management**: Tracks connected players via Socket.ID
- **Event Handlers**: Processes all player and admin commands

### Client Interfaces

| Interface | Path | Purpose |
|-----------|------|---------|
| Landing | `/` | Welcome page with QR code for players |
| TV Display | `/tv` | Game show display for large screen |
| Admin Panel | `/admin` | Game control panel (password protected) |
| Buzzer | `/buzzer` | Mobile buzzer for players |

### Shared Context (`src/context/GameContext.tsx`)

React context providing:
- Real-time game state synchronization
- Socket.IO client management
- Action dispatchers for all game operations
- Sound effect triggers

## Data Flow

### Player Buzzing

```
Player Press → Socket.IO → Server Validates → Adds to buzzOrder → Broadcasts State
     ↓              ↓            ↓                    ↓                ↓
  Haptic      'buzzer:press'  Check locked?    Sort by timestamp   'game:state'
  Feedback                    Check already?   Calculate position   to all clients
                              Check player?
```

### Answer Reveal

```
Admin Click → Socket.IO → Server Updates → Calculate Points → Broadcast
     ↓            ↓             ↓               ↓              ↓
  UI Update  'admin:revealAnswer'  Mark revealed   Apply multiplier   'game:state'
                                   Play sound      Update roundPoints  'sound:play'
```

## State Management

### Server-Side State

```typescript
// In-memory state
let gameState: GameState          // Current game state
const players: Map<string, Player> // Connected players by socket ID
let currentContestId: string      // Active contest file

// Persisted to .game-state.json on every state change
{
  contestId: string
  gameState: GameState
  savedAt: string  // ISO timestamp
}
```

### Client-Side State

- **GameContext**: Synced with server via `game:state` events
- **localStorage**: Player name/team persistence on buzzer page
- **sessionStorage**: Admin authentication status

## File Structure

```
golden-friends/
├── server/
│   └── index.ts              # Combined Next.js + Socket.IO server
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── page.tsx          # Landing page
│   │   ├── tv/page.tsx       # TV display
│   │   ├── admin/page.tsx    # Admin panel
│   │   ├── buzzer/page.tsx   # Player buzzer
│   │   └── api/              # REST API routes
│   ├── components/tv/        # TV display components
│   ├── context/              # React context
│   ├── lib/                  # Utility functions
│   ├── types/                # TypeScript definitions
│   └── data/contests/        # Question JSON files
└── public/
    ├── sounds/               # Audio files
    └── data/                 # Game photos (gitignored)
```

## Key Design Decisions

### Server-Side Buzzer Timing

Buzzer presses are timestamped on the server using `performance.now()` to ensure fair ordering regardless of network latency. The `buzzOrder` array is sorted by timestamp after each press.

### Game State Persistence

Game state is saved to `.game-state.json` after every change, allowing recovery if the server restarts mid-game. On startup, the server restores state but clears player lists (they must reconnect).

### Single Server Process

Next.js and Socket.IO run in the same process to:
- Share game state without external dependencies
- Simplify deployment
- Enable server-side rendering with real-time data

### Point Multipliers

Questions can have `pointMultiplier` (1x, 2x, 3x) that scales all point calculations. This creates increasing stakes in later rounds.
