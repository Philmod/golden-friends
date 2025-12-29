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
          placeholder="Mot de passe"
          className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-gold-400"
          autoFocus
        />
        {error && (
          <p className="text-red-500 text-sm mb-4">Mot de passe incorrect</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold-400 text-gray-900 font-bold py-3 rounded-lg hover:bg-gold-300 disabled:opacity-50"
        >
          {loading ? 'Verification...' : 'Entrer'}
        </button>
      </form>
    </div>
  )
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
    revealAll,
    updateScore,
    setPhase,
    setActiveTeam,
    resetBuzzers,
    lockBuzzers,
    addStrike,
    awardPoints,
    resetRound,
    markCorrect,
    loadContest,
    getCurrentContest,
  } = useGame()

  const [contests, setContests] = useState<ContestInfo[]>([])
  const [showLoadModal, setShowLoadModal] = useState<string | null>(null)
  const [resetScores, setResetScores] = useState(false)

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
          {isConnected ? 'Chargement...' : 'Connexion au serveur...'}
        </div>
      </div>
    )
  }

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex]
  const isBuzzerQuestion = currentQuestion?.type === 'buzzer'

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gold-400">Admin Panel</h1>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {isConnected ? 'Connecte' : 'Deconnecte'}
          </span>
          <span className="text-gray-400">
            {players.length} joueurs
          </span>
        </div>
      </div>

      {/* Contest Selector */}
      <div className="bg-gray-800 rounded-xl p-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-400">Concours:</span>
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
            <span className="text-gray-500 text-sm">Chargement...</span>
          )}
        </div>
      </div>

      {/* Load Contest Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gold-400 mb-4">Charger un concours</h3>
            <p className="text-gray-300 mb-4">
              Voulez-vous charger le concours &quot;{contests.find(c => c.id === showLoadModal)?.name}&quot;?
            </p>
            <label className="flex items-center gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={resetScores}
                onChange={(e) => setResetScores(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-gold-400 focus:ring-gold-400"
              />
              <span className="text-gray-300">Reinitialiser les scores</span>
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLoadModal(null)
                  setResetScores(false)
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={() => handleLoadContest(showLoadModal)}
                className="flex-1 bg-gold-400 text-gray-900 font-bold py-2 rounded-lg hover:bg-gold-300"
              >
                Charger
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
              Precedente
            </button>
            <button
              onClick={nextQuestion}
              disabled={gameState.currentQuestionIndex === gameState.questions.length - 1}
              className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 py-2 px-4 rounded-lg"
            >
              Suivante
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
                    q.type === 'buzzer' ? 'bg-purple-600' :
                    q.type === 'fastmoney' ? 'bg-red-600' : 'bg-blue-600'
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
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPhase('lobby')}
                className={`py-2 px-3 rounded-lg ${
                  gameState.phase === 'lobby' ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Lobby
              </button>
              <button
                onClick={() => setPhase('faceoff')}
                className={`py-2 px-3 rounded-lg ${
                  gameState.phase === 'faceoff' ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Face-off
              </button>
              <button
                onClick={() => setPhase('play')}
                className={`py-2 px-3 rounded-lg ${
                  gameState.phase === 'play' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Play
              </button>
              <button
                onClick={() => setPhase('steal')}
                className={`py-2 px-3 rounded-lg ${
                  gameState.phase === 'steal' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Steal
              </button>
            </div>
          </div>

          {/* Team controls */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-lg font-bold mb-3 text-gold-400">Equipe active</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setActiveTeam('girls')}
                className={`py-3 px-4 rounded-lg font-bold ${
                  gameState.controllingTeam === 'girls'
                    ? 'bg-pink-600'
                    : 'bg-pink-900 hover:bg-pink-800'
                }`}
              >
                Filles
              </button>
              <button
                onClick={() => setActiveTeam('boys')}
                className={`py-3 px-4 rounded-lg font-bold ${
                  gameState.controllingTeam === 'boys'
                    ? 'bg-blue-600'
                    : 'bg-blue-900 hover:bg-blue-800'
                }`}
              >
                Garcons
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
                Donner pts Filles
              </button>
              <button
                onClick={() => awardPoints('boys')}
                className="bg-blue-700 hover:bg-blue-600 py-2 rounded-lg"
              >
                Donner pts Garcons
              </button>
            </div>
          </div>

          {/* Buzzer controls */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-lg font-bold mb-3 text-gold-400">Buzzers</h3>
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
                {gameState.isLocked ? 'Debloquer' : 'Bloquer'}
              </button>
            </div>

            {/* Buzz order */}
            {gameState.buzzOrder.length > 0 && (
              <div className="space-y-1">
                <div className="text-sm text-gray-400">Ordre des buzzers:</div>
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
                  Faux (-5)
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
              <h3 className="text-lg font-bold mb-3 text-gold-400">Reponses</h3>
              <div className="space-y-2 mb-4">
                {currentQuestion.answers.map((answer) => (
                  <button
                    key={answer.id}
                    onClick={() => revealAnswer(answer.id)}
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
                Reveler tout
              </button>
            </div>
          )}

          {/* Score controls */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-lg font-bold mb-3 text-gold-400">Scores</h3>

            {/* Girls score */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-pink-400 font-bold">Filles</span>
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
                <span className="text-blue-400 font-bold">Garcons</span>
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
            <h3 className="text-lg font-bold mb-3 text-gold-400">Joueurs ({players.length})</h3>
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
                <div className="text-gray-500 text-sm">Aucun joueur</div>
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
        <div className="text-2xl text-gray-400">Chargement...</div>
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
