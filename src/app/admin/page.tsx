'use client'

import { useEffect, useState, useCallback } from 'react'
import { GameProvider, useGame } from '@/context/GameContext'

interface ContestInfo {
  id: string
  name: string
  description?: string
  questionCount: number
}

function PasswordPrompt({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(false)

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        sessionStorage.setItem('adminAuth', 'true')
        onSuccess()
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gold-400 mb-6 text-center">Admin Panel</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-gold-400"
          autoFocus
        />
        {error && (
          <p className="text-red-500 text-sm mb-4">Incorrect password</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold-400 text-gray-900 font-bold py-3 rounded-lg hover:bg-gold-300 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Enter'}
        </button>
      </form>
    </div>
  )
}

// Helper: Get phase-specific help text
function getPhaseHelp(phase: string, isBuzzerQuestion: boolean): { action: string; say: string; next: string } {
  if (isBuzzerQuestion) {
    return {
      action: "Click 'Unlock' to open buzzers, then 'Correct' or 'Wrong' after the answer",
      say: "\"Look at the photo carefully... Buzz when you know!\"",
      next: "After answer: Correct (+10 pts) or Wrong (-5 pts, next player)"
    }
  }

  switch (phase) {
    case 'lobby':
      return {
        action: "Wait for all players to join via /buzzer, then click 'Face-off'",
        say: "\"Welcome to Golden Friends! Scan the QR code to join your team.\"",
        next: "When ready: Click 'Face-off' to start"
      }
    case 'faceoff':
      return {
        action: "1) One person from each team forward. 2) 'Show Question' (unlocks buzzers). 3) Read aloud. 4) Both buzz.",
        say: "\"Send one person from each team!\" → \"[Question] - Buzz!\"",
        next: "Higher answer wins. Ask winner: \"Play or pass?\" Click the team that will PLAY."
      }
    case 'play':
      return {
        action: "Team guesses answers. Click on an answer to reveal, or STRIKE if wrong.",
        say: "\"[Team], give me an answer!\" After answer: \"Let's see if it's there...\"",
        next: "Correct: Reveal. Wrong: STRIKE. 3 strikes: Steal. All revealed: 'Give pts' then 'Next'."
      }
    case 'steal':
      return {
        action: "Other team has ONE chance to steal all points. No strikes possible.",
        say: "\"[Other team], you can steal! Discuss... What's your answer?\"",
        next: "Correct: 'Give pts' to stealing team. Wrong: 'Give pts' to original team"
      }
    case 'reveal':
      return {
        action: "Show remaining answers. Points should already be awarded.",
        say: "\"Let's see the answers you missed...\"",
        next: "Click 'Next' to go to the next question."
      }
    default:
      return {
        action: "Select a phase to begin",
        say: "",
        next: ""
      }
  }
}

function AdminPanel() {
  const {
    gameState,
    players,
    isConnected,
    currentContestId,
    subscribeAdmin,
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
    addStrike,
    awardPoints,
    resetRound,
    markCorrect,
    loadContest,
    getCurrentContest,
    startTimer,
    stopTimer,
    toggleDrinkingRules,
    showQuestion,
  } = useGame()

  const [contests, setContests] = useState<ContestInfo[]>([])
  const [showLoadModal, setShowLoadModal] = useState<string | null>(null)
  const [resetScores, setResetScores] = useState(false)
  const [showHelp, setShowHelp] = useState(true)

  const fetchContests = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/contests')
      if (res.ok) {
        const data = await res.json()
        setContests(data.contests)
      }
    } catch (err) {
      console.error('Failed to fetch contests:', err)
    }
  }, [])

  useEffect(() => {
    subscribeAdmin()
    getCurrentContest()
    fetchContests()
  }, [subscribeAdmin, getCurrentContest, fetchContests])

  const handleLoadContest = (contestId: string) => {
    loadContest(contestId, resetScores)
    setShowLoadModal(null)
    setResetScores(false)
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-2xl text-gray-400">
          {isConnected ? 'Loading...' : 'Connecting to server...'}
        </div>
      </div>
    )
  }

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex]
  const isBuzzerQuestion = currentQuestion?.type === 'buzzer'
  const phaseHelp = getPhaseHelp(gameState.phase, isBuzzerQuestion)

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gold-400">Admin Panel</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => toggleDrinkingRules(!gameState.showDrinkingRules)}
            className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
              gameState.showDrinkingRules ? 'bg-yellow-600' : 'bg-gray-700'
            }`}
            title="Show/hide drinking rules on TV"
          >
            <span>🍺</span>
            <span>{gameState.showDrinkingRules ? 'ON' : 'OFF'}</span>
          </button>
          <span className={`px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <span className="text-gray-400">
            {players.length} players
          </span>
        </div>
      </div>

      {/* Contest Selector */}
      <div className="bg-gray-800 rounded-xl p-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-400">Contest:</span>
          {contests.map((contest) => (
            <button
              key={contest.id}
              onClick={() => setShowLoadModal(contest.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                currentContestId === contest.id
                  ? 'bg-gold-400 text-gray-900 font-bold'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {contest.name}
              <span className="ml-1 text-xs opacity-70">({contest.questionCount})</span>
            </button>
          ))}
          {contests.length === 0 && (
            <span className="text-gray-500 text-sm">Loading...</span>
          )}
        </div>
      </div>

      {/* Help Panel */}
      <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl mb-4">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="w-full p-3 flex items-center justify-between text-left"
        >
          <span className="text-sm font-bold text-indigo-300">
            Help - What to do now?
          </span>
          <span className="text-indigo-400">{showHelp ? '▼' : '▶'}</span>
        </button>
        {showHelp && (
          <div className="px-4 pb-4 space-y-3">
            <div className="flex gap-2">
              <span className="text-green-400 font-bold text-sm shrink-0">Action:</span>
              <span className="text-sm text-gray-200">{phaseHelp.action}</span>
            </div>
            {phaseHelp.say && (
              <div className="flex gap-2">
                <span className="text-yellow-400 font-bold text-sm shrink-0">Say:</span>
                <span className="text-sm text-gray-200 italic">{phaseHelp.say}</span>
              </div>
            )}
            {phaseHelp.next && (
              <div className="flex gap-2">
                <span className="text-blue-400 font-bold text-sm shrink-0">Next:</span>
                <span className="text-sm text-gray-200">{phaseHelp.next}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Load Contest Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gold-400 mb-4">Load a contest</h3>
            <p className="text-gray-300 mb-4">
              Do you want to load the contest &quot;{contests.find(c => c.id === showLoadModal)?.name}&quot;?
            </p>
            <label className="flex items-center gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={resetScores}
                onChange={(e) => setResetScores(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-gold-400 focus:ring-gold-400"
              />
              <span className="text-gray-300">Reset scores</span>
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLoadModal(null)
                  setResetScores(false)
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleLoadContest(showLoadModal)}
                className="flex-1 bg-gold-400 text-gray-900 font-bold py-2 rounded-lg hover:bg-gold-300"
              >
                Load
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Questions */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h2 className="text-lg font-bold mb-4 text-gold-400">Questions</h2>

          {/* Question navigation */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={prevQuestion}
              disabled={gameState.currentQuestionIndex === 0}
              className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 py-2 px-4 rounded-lg"
            >
              Previous
            </button>
            <button
              onClick={nextQuestion}
              disabled={gameState.currentQuestionIndex === gameState.questions.length - 1}
              className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 py-2 px-4 rounded-lg"
            >
              Next
            </button>
          </div>

          {/* Question list */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {gameState.questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => goToQuestion(index)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  index === gameState.currentQuestionIndex
                    ? 'bg-gold-400/20 border border-gold-400'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">#{index + 1}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    q.type === 'buzzer' ? 'bg-purple-600' : 'bg-blue-600'
                  }`}>
                    {q.type}
                  </span>
                  {q.pointMultiplier && q.pointMultiplier > 1 && (
                    <span className="text-xs px-2 py-0.5 rounded bg-gold-400 text-gray-900">
                      x{q.pointMultiplier}
                    </span>
                  )}
                </div>
                <div className="text-sm mt-1 truncate">{q.question}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Middle column: Game controls */}
        <div className="space-y-4">
          {/* Current question info */}
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">Question {gameState.currentQuestionIndex + 1}</div>
            <h3 className="text-xl font-bold mb-2">{currentQuestion?.question}</h3>
            {/* Show correct answer for buzzer questions */}
            {isBuzzerQuestion && currentQuestion?.correctAnswer && (
              <div className="mb-2 p-2 bg-green-900/50 border border-green-600 rounded-lg">
                <span className="text-xs text-green-400 uppercase">Answer: </span>
                <span className="text-green-300 font-bold">{currentQuestion.correctAnswer}</span>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              <span className={`text-xs px-2 py-1 rounded ${
                gameState.phase === 'faceoff' ? 'bg-yellow-600' :
                gameState.phase === 'play' ? 'bg-green-600' :
                gameState.phase === 'steal' ? 'bg-red-600' :
                gameState.phase === 'reveal' ? 'bg-purple-600' :
                'bg-gray-600'
              }`}>
                {gameState.phase.toUpperCase()}
              </span>
              <span className="text-xs px-2 py-1 rounded bg-gold-400 text-gray-900">
                {gameState.roundPoints} pts
              </span>
            </div>
          </div>

          {/* Phase controls */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-lg font-bold mb-3 text-gold-400">Phase</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPhase('lobby')}
                  className={`py-2 px-4 rounded-lg w-28 text-left ${
                    gameState.phase === 'lobby' ? 'bg-gray-600 ring-2 ring-white' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  1. Lobby
                </button>
                <span className="text-xs text-gray-400">Waiting for players</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPhase('faceoff')}
                  className={`py-2 px-4 rounded-lg w-28 text-left ${
                    gameState.phase === 'faceoff' ? 'bg-yellow-600 ring-2 ring-white' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  2. Face-off
                </button>
                <span className="text-xs text-gray-400">Buzzers open</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPhase('play')}
                  className={`py-2 px-4 rounded-lg w-28 text-left ${
                    gameState.phase === 'play' ? 'bg-green-600 ring-2 ring-white' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  3. Play
                </button>
                <span className="text-xs text-gray-400">Team guesses answers</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPhase('steal')}
                  className={`py-2 px-4 rounded-lg w-28 text-left ${
                    gameState.phase === 'steal' ? 'bg-red-600 ring-2 ring-white' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  4. Steal
                </button>
                <span className="text-xs text-gray-400">Other team can steal</span>
              </div>
            </div>
          </div>

          {/* Team controls */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-lg font-bold mb-3 text-gold-400">Active team</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setActiveTeam('girls')}
                className={`py-3 px-4 rounded-lg font-bold ${
                  gameState.controllingTeam === 'girls'
                    ? 'bg-pink-600'
                    : 'bg-pink-900 hover:bg-pink-800'
                }`}
              >
                Girls
              </button>
              <button
                onClick={() => setActiveTeam('boys')}
                className={`py-3 px-4 rounded-lg font-bold ${
                  gameState.controllingTeam === 'boys'
                    ? 'bg-blue-600'
                    : 'bg-blue-900 hover:bg-blue-800'
                }`}
              >
                Boys
              </button>
            </div>

            {/* Strike button */}
            <button
              onClick={addStrike}
              className="w-full bg-red-700 hover:bg-red-600 py-3 rounded-lg font-bold text-xl mb-2"
            >
              STRIKE! (X)
            </button>

            {/* Award points */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => awardPoints('girls')}
                className="bg-pink-700 hover:bg-pink-600 py-2 rounded-lg"
              >
                Give pts Girls
              </button>
              <button
                onClick={() => awardPoints('boys')}
                className="bg-blue-700 hover:bg-blue-600 py-2 rounded-lg"
              >
                Give pts Boys
              </button>
            </div>
          </div>

          {/* Buzzer controls */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-lg font-bold mb-3 text-gold-400">Buzzers</h3>

            {/* Show Question button for face-off and buzzer questions */}
            {(gameState.phase === 'faceoff' || isBuzzerQuestion) && (
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => showQuestion(!gameState.questionVisible)}
                  className={`flex-1 py-2 rounded-lg font-bold ${
                    gameState.questionVisible
                      ? 'bg-purple-600 hover:bg-purple-500'
                      : 'bg-purple-700 hover:bg-purple-600 animate-pulse'
                  }`}
                >
                  {gameState.questionVisible ? 'Hide Question' : isBuzzerQuestion ? 'Show Photo' : 'Show Question'}
                </button>
                {!isBuzzerQuestion && (
                  <button
                    onClick={showWrongX}
                    className="px-4 py-2 rounded-lg font-bold bg-red-700 hover:bg-red-600 text-xl"
                    title="Show X for wrong answer"
                  >
                    ✗
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-2 mb-3">
              <button
                onClick={resetBuzzers}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg"
              >
                Reset
              </button>
              <button
                onClick={() => lockBuzzers(!gameState.isLocked)}
                className={`flex-1 py-2 rounded-lg ${
                  gameState.isLocked
                    ? 'bg-red-700 hover:bg-red-600'
                    : 'bg-green-700 hover:bg-green-600'
                }`}
              >
                {gameState.isLocked ? 'Unlock' : 'Lock'}
              </button>
            </div>

            {/* Timer controls for buzzer questions */}
            {isBuzzerQuestion && (
              <div className="mb-3 p-2 bg-gray-700/50 rounded-lg">
                <div className="text-sm text-gray-400 mb-2">Timer</div>
                <div className="flex gap-2">
                  {!gameState.timerRunning ? (
                    <>
                      <button
                        onClick={() => startTimer(10)}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-500 py-2 rounded-lg text-sm font-bold"
                      >
                        10s
                      </button>
                      <button
                        onClick={() => startTimer(15)}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-500 py-2 rounded-lg text-sm font-bold"
                      >
                        15s
                      </button>
                      <button
                        onClick={() => startTimer(20)}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-500 py-2 rounded-lg text-sm font-bold"
                      >
                        20s
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={stopTimer}
                      className="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded-lg text-sm font-bold"
                    >
                      Stop Timer
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Buzz order */}
            {gameState.buzzOrder.length > 0 && (
              <div className="space-y-1">
                <div className="text-sm text-gray-400">Buzzer order:</div>
                {gameState.buzzOrder.map((buzz, index) => (
                  <div
                    key={buzz.playerId}
                    className={`text-sm px-2 py-1 rounded ${
                      buzz.team === 'girls' ? 'bg-pink-900' : 'bg-blue-900'
                    }`}
                  >
                    {index + 1}. {buzz.playerName}
                  </div>
                ))}
              </div>
            )}

            {/* For buzzer questions: correct/wrong */}
            {isBuzzerQuestion && gameState.buzzOrder.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={() => markCorrect(true)}
                  className="bg-green-700 hover:bg-green-600 py-2 rounded-lg"
                >
                  Correct (+10)
                </button>
                <button
                  onClick={() => markCorrect(false)}
                  className="bg-red-700 hover:bg-red-600 py-2 rounded-lg"
                >
                  Wrong (-5)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Answers & Scores */}
        <div className="space-y-4">
          {/* Answer controls (for multiple answer questions) */}
          {!isBuzzerQuestion && currentQuestion && (
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-lg font-bold mb-3 text-gold-400">Answers</h3>
              <div className="space-y-2 mb-4">
                {currentQuestion.answers.map((answer) => (
                  <button
                    key={answer.id}
                    onClick={() => answer.revealed ? hideAnswer(answer.id) : revealAnswer(answer.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      answer.revealed
                        ? 'bg-gold-400/30 border border-gold-400'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={answer.revealed ? 'text-gold-400' : ''}>
                        {answer.text}
                      </span>
                      <span className="font-bold">{answer.points} pts</span>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={revealAll}
                className="w-full bg-purple-700 hover:bg-purple-600 py-2 rounded-lg"
              >
                Reveal all
              </button>
            </div>
          )}

          {/* Score controls */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-lg font-bold mb-3 text-gold-400">Scores</h3>

            {/* Girls score */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-pink-400 font-bold">Girls</span>
                <span className="text-2xl font-bold">{gameState.teams.girls.score}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateScore('girls', -10)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-1 rounded"
                >
                  -10
                </button>
                <button
                  onClick={() => updateScore('girls', -5)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-1 rounded"
                >
                  -5
                </button>
                <button
                  onClick={() => updateScore('girls', 5)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-1 rounded"
                >
                  +5
                </button>
                <button
                  onClick={() => updateScore('girls', 10)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-1 rounded"
                >
                  +10
                </button>
              </div>
            </div>

            {/* Boys score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-400 font-bold">Boys</span>
                <span className="text-2xl font-bold">{gameState.teams.boys.score}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateScore('boys', -10)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-1 rounded"
                >
                  -10
                </button>
                <button
                  onClick={() => updateScore('boys', -5)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-1 rounded"
                >
                  -5
                </button>
                <button
                  onClick={() => updateScore('boys', 5)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-1 rounded"
                >
                  +5
                </button>
                <button
                  onClick={() => updateScore('boys', 10)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-1 rounded"
                >
                  +10
                </button>
              </div>
            </div>
          </div>

          {/* Reset round */}
          <button
            onClick={resetRound}
            className="w-full bg-orange-700 hover:bg-orange-600 py-3 rounded-xl font-bold"
          >
            Reset Round
          </button>

          {/* Players list */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-lg font-bold mb-3 text-gold-400">Players ({players.length})</h3>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`text-sm px-2 py-1 rounded flex items-center justify-between ${
                    player.team === 'girls' ? 'bg-pink-900/50' : 'bg-blue-900/50'
                  }`}
                >
                  <span>{player.name}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    player.connected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                </div>
              ))}
              {players.length === 0 && (
                <div className="text-gray-500 text-sm">No players</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const auth = sessionStorage.getItem('adminAuth')
    setIsAuthenticated(auth === 'true')
    setChecking(false)
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-2xl text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <PasswordPrompt onSuccess={() => setIsAuthenticated(true)} />
  }

  return (
    <GameProvider>
      <AdminPanel />
    </GameProvider>
  )
}
