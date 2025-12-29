// Question types
export type QuestionType = 'multiple' | 'buzzer' | 'fastmoney';
export type TeamId = 'girls' | 'boys';
export type GamePhase =
  | 'lobby'      // Waiting for players
  | 'faceoff'    // Two players face off to buzz first
  | 'play'       // Team is guessing answers
  | 'steal'      // Other team can steal
  | 'reveal'     // Show all answers
  | 'photo'      // Photo buzzer round
  | 'fastmoney'  // Fast money finale
  | 'complete';  // Game over

// Answer structure
export interface Answer {
  id: number;
  text: string;
  points: number;
  revealed: boolean;
}

// Question structure
export interface Question {
  id: number;
  type: QuestionType;
  question: string;
  category?: string;
  answers: Answer[];
  correctAnswer?: string;  // For buzzer questions
  mediaUrl?: string;       // For photo questions
  timeLimit?: number;      // Timer in seconds
  pointMultiplier?: number; // 1x, 2x, 3x
}

// Fast Money question (simpler structure)
export interface FastMoneyQuestion {
  id: number;
  question: string;
  answers: Array<{ text: string; points: number }>;
}

// Player structure
export interface Player {
  id: string;           // Socket ID
  name: string;
  team: TeamId;
  connected: boolean;
}

// Team structure
export interface Team {
  id: TeamId;
  name: string;
  color: string;
  score: number;
  roundPoints: number;    // Points accumulated this round
  strikes: number;        // Wrong answers (max 3)
  players: Player[];
}

// Buzz event
export interface BuzzEvent {
  playerId: string;
  playerName: string;
  team: TeamId;
  timestamp: number;
}

// Fast Money state
export interface FastMoneyState {
  currentPlayer: 1 | 2;
  player1Answers: Array<{ answer: string; points: number; duplicate: boolean }>;
  player2Answers: Array<{ answer: string; points: number; duplicate: boolean }>;
  timeRemaining: number;
  totalPoints: number;
}

// Main game state
export interface GameState {
  phase: GamePhase;
  currentQuestionIndex: number;
  currentRound: number;
  questions: Question[];
  teams: {
    girls: Team;
    boys: Team;
  };
  activeTeam: TeamId | null;      // Team currently playing
  controllingTeam: TeamId | null; // Team that won face-off
  buzzOrder: BuzzEvent[];
  isLocked: boolean;              // Prevent buzzing
  showWrongX: boolean;
  roundPoints: number;            // Points at stake this round
  fastMoney?: FastMoneyState;
  // Timer state
  timerRunning: boolean;
  timerEndTime: number | null;    // Unix timestamp when timer ends
  timerDuration: number;          // Timer duration in seconds
  // Confetti trigger
  showConfetti: TeamId | null;    // Which team to show confetti for
  // Drinking rules
  showDrinkingRules: boolean;     // Whether to display drinking rules on TV
  highlightDrinkingRule: string | null;  // Rule ID to highlight temporarily
}

// Socket event types
export interface ServerToClientEvents {
  'game:state': (state: GameState) => void;
  'game:stateUpdate': (state: Partial<GameState>) => void;
  'buzzer:accepted': (data: { playerId: string; position: number }) => void;
  'buzzer:rejected': (data: { reason: string }) => void;
  'player:list': (players: Player[]) => void;
  'sound:play': (soundId: SoundType) => void;
  'admin:contestLoaded': (data: { success: boolean; contestId?: string; questionCount?: number; error?: string }) => void;
  'admin:currentContest': (data: { contestId: string }) => void;
}

export interface ClientToServerEvents {
  // Player events
  'player:join': (data: { name: string; team: TeamId }) => void;
  'player:leave': () => void;
  'buzzer:press': () => void;

  // Admin events
  'admin:nextQuestion': () => void;
  'admin:prevQuestion': () => void;
  'admin:goToQuestion': (index: number) => void;
  'admin:revealAnswer': (answerId: number) => void;
  'admin:hideAnswer': (answerId: number) => void;
  'admin:revealAll': () => void;
  'admin:updateScore': (data: { team: TeamId; delta: number }) => void;
  'admin:setPhase': (phase: GamePhase) => void;
  'admin:setActiveTeam': (team: TeamId | null) => void;
  'admin:resetBuzzers': () => void;
  'admin:lockBuzzers': (locked: boolean) => void;
  'admin:showWrongX': () => void;
  'admin:hideWrongX': () => void;
  'admin:addStrike': () => void;
  'admin:awardPoints': (team: TeamId) => void;
  'admin:resetRound': () => void;
  'admin:correctAnswer': (isCorrect: boolean) => void;
  'admin:loadContest': (data: { contestId: string; resetScores: boolean }) => void;
  'admin:getCurrentContest': () => void;
  'admin:startTimer': (duration: number) => void;
  'admin:stopTimer': () => void;
  'admin:toggleDrinkingRules': (show: boolean) => void;

  // Subscriptions
  'subscribe:tv': () => void;
  'subscribe:admin': () => void;
}

export type SoundType =
  | 'buzzer'
  | 'correct'
  | 'wrong'
  | 'reveal'
  | 'applause'
  | 'timer'
  | 'ding'
  | 'strike';

// Initial state factory
export function createInitialGameState(questions: Question[]): GameState {
  return {
    phase: 'lobby',
    currentQuestionIndex: 0,
    currentRound: 1,
    questions,
    teams: {
      girls: {
        id: 'girls',
        name: 'Girls',
        color: '#FF69B4',
        score: 0,
        roundPoints: 0,
        strikes: 0,
        players: [],
      },
      boys: {
        id: 'boys',
        name: 'Boys',
        color: '#4169E1',
        score: 0,
        roundPoints: 0,
        strikes: 0,
        players: [],
      },
    },
    activeTeam: null,
    controllingTeam: null,
    buzzOrder: [],
    isLocked: true,
    showWrongX: false,
    roundPoints: 0,
    timerRunning: false,
    timerEndTime: null,
    timerDuration: 10,
    showConfetti: null,
    showDrinkingRules: true,
    highlightDrinkingRule: null,
  };
}
