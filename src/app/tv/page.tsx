'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { GameProvider, useGame } from '@/context/GameContext'
import AnswerBoard from '@/components/tv/AnswerBoard'
import ScoreBoard from '@/components/tv/ScoreBoard'
import BuzzerIndicator from '@/components/tv/BuzzerIndicator'
import WrongX from '@/components/tv/WrongX'
import Timer from '@/components/tv/Timer'
import Confetti from '@/components/tv/Confetti'
import DrinkingRules from '@/components/tv/DrinkingRules'

// Host prompts for each phase
function getHostPrompt(phase: string, isBuzzerQuestion: boolean, teamName?: string): string {
  if (isBuzzerQuestion) {
    return "\"Look at this photo carefully... Buzz when you know the answer!\""
  }
  switch (phase) {
    case 'lobby':
      return "\"Welcome to Golden Friends! Join your team by scanning the QR code.\""
    case 'faceoff':
      return "\"[Read the question] First to buzz wins control!\""
    case 'play':
      return `\"${teamName || 'Team'}, give me an answer!\"`
    case 'steal':
      return `\"${teamName || 'Other team'}, you can steal! Discuss...\"`
    case 'reveal':
      return "\"Let's see the answers you missed...\""
    default:
      return ""
  }
}

function TVDisplay() {
  const { gameState, subscribeTV, isConnected } = useGame()
  const [hostMode, setHostMode] = useState(false)
  const [serverUrl, setServerUrl] = useState('')

  // Get server URL for QR code
  useEffect(() => {
    const protocol = window.location.protocol
    const host = window.location.hostname
    const port = window.location.port || '3000'
    setServerUrl(`${protocol}//${host}:${port}`)
  }, [])

  // Toggle host mode with 'H' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setHostMode(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    subscribeTV()
  }, [subscribeTV])

  if (!gameState) {
    return (
      <div className="min-h-screen tv-background flex items-center justify-center">
        <div className="text-2xl text-gray-400">
          {isConnected ? 'Loading...' : 'Connecting to server...'}
        </div>
      </div>
    )
  }

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex]

  // Lobby phase
  if (gameState.phase === 'lobby') {
    return (
      <main className="min-h-screen tv-background flex flex-col items-center justify-center p-8">
        <h1 className="text-7xl font-bold text-gold-400 mb-8">Golden Friends</h1>
        <p className="text-3xl text-gray-300 mb-12">Family Feud - Friends Edition</p>

        <div className="grid grid-cols-2 gap-16">
          <div className="text-center">
            <div
              className="text-4xl font-bold mb-4"
              style={{ color: gameState.teams.girls.color }}
            >
              {gameState.teams.girls.name}
            </div>
            <div className="text-6xl font-bold text-white">
              {gameState.teams.girls.players.length}
            </div>
            <div className="text-xl text-gray-400 mt-2">players</div>
          </div>

          <div className="text-center">
            <div
              className="text-4xl font-bold mb-4"
              style={{ color: gameState.teams.boys.color }}
            >
              {gameState.teams.boys.name}
            </div>
            <div className="text-6xl font-bold text-white">
              {gameState.teams.boys.players.length}
            </div>
            <div className="text-xl text-gray-400 mt-2">players</div>
          </div>
        </div>

        {/* QR Code */}
        {serverUrl && (
          <div className="mt-12 bg-white p-6 rounded-xl">
            <QRCodeSVG
              value={`${serverUrl}/buzzer`}
              size={200}
              level="M"
            />
            <p className="text-gray-800 text-center mt-4 font-medium">
              Scan to join
            </p>
          </div>
        )}

        <p className="text-xl text-gray-500 mt-8">
          Waiting for the game to start...
        </p>

        {/* Drinking rules */}
        <DrinkingRules
          show={gameState.showDrinkingRules}
          highlightRule={gameState.highlightDrinkingRule || undefined}
        />

        {/* Host mode indicator */}
        {hostMode && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/80 border-t border-indigo-500 p-3">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-indigo-400 font-bold">HOST:</span>
                <span className="text-yellow-300 italic">{getHostPrompt('lobby', false)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Press H to hide</div>
            </div>
          </div>
        )}
      </main>
    )
  }

  // Photo/buzzer question
  if (currentQuestion?.type === 'buzzer') {
    return (
      <main className="min-h-screen tv-background flex flex-col p-8">
        {/* Header with scores */}
        <ScoreBoard
          girls={gameState.teams.girls}
          boys={gameState.teams.boys}
          roundPoints={gameState.roundPoints}
        />

        {/* Question */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-lg text-gold-400 uppercase tracking-wider mb-2">
            {currentQuestion.category}
          </div>
          <h2 className="text-4xl font-bold text-center mb-8 max-w-3xl">
            {currentQuestion.question}
          </h2>

          {/* Photo */}
          {currentQuestion.mediaUrl && (
            <div className="mb-8">
              <img
                src={currentQuestion.mediaUrl}
                alt="Question"
                className="max-h-[50vh] rounded-xl border-4 border-gold-400"
              />
            </div>
          )}

          {/* Buzzer indicator */}
          <BuzzerIndicator
            buzzOrder={gameState.buzzOrder}
            teams={gameState.teams}
            showFirst={true}
          />

          {!gameState.isLocked && gameState.buzzOrder.length === 0 && (
            <div className="text-2xl text-green-400 animate-pulse mt-4">
              BUZZEZ!
            </div>
          )}
        </div>

        <WrongX show={gameState.showWrongX} />

        {/* Timer */}
        <Timer
          endTime={gameState.timerEndTime}
          isRunning={gameState.timerRunning}
          duration={gameState.timerDuration}
        />

        {/* Confetti */}
        <Confetti
          teamColor={gameState.showConfetti ? gameState.teams[gameState.showConfetti].color : '#FFD700'}
          show={!!gameState.showConfetti}
        />

        {/* Drinking rules */}
        <DrinkingRules
          show={gameState.showDrinkingRules}
          highlightRule={gameState.highlightDrinkingRule || undefined}
        />

        {/* Host mode indicator */}
        {hostMode && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/80 border-t border-indigo-500 p-3">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-indigo-400 font-bold">HOST:</span>
                <span className="text-yellow-300 italic">{getHostPrompt(gameState.phase, true)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Press H to hide</div>
            </div>
          </div>
        )}
      </main>
    )
  }

  // Regular multiple answer question - French TV style
  return (
    <main className="min-h-screen tv-background flex flex-col">
      {/* Header with scores and strikes */}
      <ScoreBoard
        girls={gameState.teams.girls}
        boys={gameState.teams.boys}
        roundPoints={gameState.roundPoints}
      />

      {/* Question - hidden during regular play, shown during faceoff */}
      {(gameState.phase === 'faceoff' || gameState.phase === 'reveal') && (
        <div className="text-center py-4 px-4">
          <div className="text-sm text-gold-400 uppercase tracking-wider mb-1">
            {currentQuestion?.category}
            {currentQuestion?.pointMultiplier && currentQuestion.pointMultiplier > 1 && (
              <span className="ml-2 bg-gold-400 text-gray-900 px-2 py-1 rounded text-xs font-bold">
                x{currentQuestion.pointMultiplier}
              </span>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-bold max-w-3xl mx-auto">
            {currentQuestion?.question}
          </h2>
        </div>
      )}

      {/* Phase indicator */}
      {gameState.phase === 'faceoff' && (
        <div className="text-center mb-4">
          <span className="text-xl text-yellow-400 animate-pulse">
            FACE-OFF - Buzz to answer first!
          </span>
          <BuzzerIndicator
            buzzOrder={gameState.buzzOrder}
            teams={gameState.teams}
            showFirst={true}
          />
        </div>
      )}

      {gameState.phase === 'steal' && (
        <div className="text-center py-2">
          <span
            className="text-xl font-bold animate-pulse px-6 py-2 rounded-lg"
            style={{
              backgroundColor: gameState.activeTeam
                ? gameState.teams[gameState.activeTeam].color + '40'
                : 'transparent',
              color: gameState.activeTeam
                ? gameState.teams[gameState.activeTeam].color
                : 'white',
            }}
          >
            {gameState.activeTeam
              ? `${gameState.teams[gameState.activeTeam].name} can steal!`
              : 'STEAL!'}
          </span>
        </div>
      )}

      {gameState.phase === 'play' && gameState.controllingTeam && (
        <div className="text-center py-2">
          <span
            className="text-lg px-4 py-1 rounded-lg"
            style={{
              backgroundColor: gameState.teams[gameState.controllingTeam].color + '40',
              color: gameState.teams[gameState.controllingTeam].color,
            }}
          >
            {gameState.teams[gameState.controllingTeam].name} plays
          </span>
        </div>
      )}

      {/* Answer board - French TV style */}
      <div className="flex-1 flex items-center justify-center py-4">
        {currentQuestion && <AnswerBoard answers={currentQuestion.answers} />}
      </div>

      {/* Wrong X overlay */}
      <WrongX show={gameState.showWrongX} />

      {/* Confetti */}
      <Confetti
        teamColor={gameState.showConfetti ? gameState.teams[gameState.showConfetti].color : '#FFD700'}
        show={!!gameState.showConfetti}
      />

      {/* Drinking rules */}
      <DrinkingRules
        show={gameState.showDrinkingRules}
        highlightRule={gameState.highlightDrinkingRule || undefined}
      />

      {/* Host mode indicator */}
      {hostMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 border-t border-indigo-500 p-3">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-indigo-400 font-bold">HOST:</span>
              <span className="text-yellow-300 italic">
                {getHostPrompt(
                  gameState.phase,
                  false,
                  gameState.phase === 'play' && gameState.controllingTeam
                    ? gameState.teams[gameState.controllingTeam].name
                    : gameState.phase === 'steal' && gameState.activeTeam
                    ? gameState.teams[gameState.activeTeam].name
                    : undefined
                )}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Press H to hide</div>
          </div>
        </div>
      )}
    </main>
  )
}

export default function TVPage() {
  return (
    <GameProvider>
      <TVDisplay />
    </GameProvider>
  )
}
