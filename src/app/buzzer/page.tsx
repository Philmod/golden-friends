'use client'

import { useEffect, useState } from 'react'
import { GameProvider, useGame } from '@/context/GameContext'
import type { TeamId } from '@/types/game'

function TeamSelector({ onSelect }: { onSelect: (name: string, team: TeamId) => void }) {
  const [name, setName] = useState('')

  const handleSelect = (team: TeamId) => {
    if (name.trim()) {
      onSelect(name.trim(), team)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-900">
      <h1 className="text-4xl font-bold text-gold-400 mb-8">Golden Friends</h1>

      <div className="w-full max-w-sm space-y-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Your name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg focus:outline-none focus:border-gold-400"
            autoFocus
          />
        </div>

        <div className="text-center text-gray-400">Choose your team</div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleSelect('girls')}
            disabled={!name.trim()}
            className="py-8 rounded-xl font-bold text-xl transition-all disabled:opacity-50"
            style={{
              backgroundColor: '#FF69B4',
              boxShadow: name.trim() ? '0 0 30px rgba(255, 105, 180, 0.5)' : 'none'
            }}
          >
            Girls
          </button>

          <button
            onClick={() => handleSelect('boys')}
            disabled={!name.trim()}
            className="py-8 rounded-xl font-bold text-xl transition-all disabled:opacity-50"
            style={{
              backgroundColor: '#4169E1',
              boxShadow: name.trim() ? '0 0 30px rgba(65, 105, 225, 0.5)' : 'none'
            }}
          >
            Boys
          </button>
        </div>
      </div>
    </div>
  )
}

function BuzzerButton() {
  const {
    gameState,
    isConnected,
    myTeam,
    myBuzzerPosition,
    pressBuzzer,
    leaveGame,
  } = useGame()

  const canBuzz = gameState && !gameState.isLocked && myBuzzerPosition === null
  const hasBuzzed = myBuzzerPosition !== null
  const currentQuestion = gameState?.questions[gameState.currentQuestionIndex]

  const teamColor = myTeam === 'girls' ? '#FF69B4' : '#4169E1'
  const teamName = myTeam === 'girls' ? 'Girls' : 'Boys'

  // Determine button state
  let buttonText = 'BUZZ!'
  let buttonStyle = 'opacity-100'

  if (!isConnected) {
    buttonText = 'Connecting...'
    buttonStyle = 'opacity-50'
  } else if (gameState?.isLocked) {
    buttonText = 'WAIT...'
    buttonStyle = 'opacity-50'
  } else if (hasBuzzed) {
    buttonText = myBuzzerPosition === 1 ? 'FIRST!' : `#${myBuzzerPosition}`
    buttonStyle = 'opacity-100'
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: teamColor + '20' }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-400">Team</div>
          <div className="font-bold" style={{ color: teamColor }}>
            {teamName}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <button
            onClick={leaveGame}
            className="text-sm text-gray-400 hover:text-white"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Game info */}
      {gameState && (
        <div className="px-4 py-2 text-center">
          <div className="text-sm text-gray-400">
            {gameState.phase === 'lobby' && 'Waiting for game...'}
            {gameState.phase === 'faceoff' && 'Face-off! Buzz first!'}
            {gameState.phase === 'play' && `${gameState.teams[gameState.controllingTeam || 'girls'].name} plays`}
            {gameState.phase === 'steal' && `${gameState.teams[gameState.activeTeam || 'girls'].name} can steal!`}
          </div>

          {/* Scores */}
          <div className="flex justify-center gap-8 mt-2">
            <div>
              <span className="text-pink-400 text-sm">Girls</span>
              <span className="ml-2 font-bold">{gameState.teams.girls.score}</span>
            </div>
            <div>
              <span className="text-blue-400 text-sm">Boys</span>
              <span className="ml-2 font-bold">{gameState.teams.boys.score}</span>
            </div>
          </div>

          {/* Question display */}
          {gameState.questionVisible && currentQuestion && (
            <div className="mt-4 px-4 py-3 mx-4 bg-gray-800/50 rounded-xl">
              {currentQuestion.category && (
                <div className="text-xs text-gold-400 uppercase tracking-wider mb-1">
                  {currentQuestion.category}
                </div>
              )}
              <div className="text-sm font-medium text-white">
                {currentQuestion.question}
              </div>
              {/* Photo for buzzer questions */}
              {currentQuestion.type === 'buzzer' && currentQuestion.mediaUrl && (
                <div className="mt-3 flex justify-center">
                  <img
                    src={currentQuestion.mediaUrl}
                    alt="Question"
                    className="max-h-32 rounded-lg border-2 border-gold-400"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Big buzzer button */}
      <div className="flex-1 flex items-center justify-center p-6">
        <button
          onClick={pressBuzzer}
          disabled={!canBuzz}
          className={`w-full max-w-sm aspect-square rounded-full font-bold text-5xl transition-all ${
            canBuzz ? 'buzzer-ready active:scale-95' : ''
          } ${buttonStyle}`}
          style={{
            backgroundColor: teamColor,
            boxShadow: canBuzz
              ? `0 0 60px ${teamColor}, 0 10px 40px rgba(0,0,0,0.5)`
              : `0 5px 20px rgba(0,0,0,0.3)`,
          }}
        >
          {buttonText}
        </button>
      </div>

      {/* Position indicator */}
      {hasBuzzed && (
        <div className="p-6 text-center">
          <div
            className={`inline-block px-8 py-4 rounded-xl font-bold text-2xl ${
              myBuzzerPosition === 1 ? 'animate-pulse' : ''
            }`}
            style={{
              backgroundColor: myBuzzerPosition === 1 ? '#22c55e' : '#6b7280',
            }}
          >
            {myBuzzerPosition === 1 ? 'You are FIRST!' : `Position: #${myBuzzerPosition}`}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes buzzer-pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 60px ${teamColor}, 0 10px 40px rgba(0,0,0,0.5);
          }
          50% {
            transform: scale(1.03);
            box-shadow: 0 0 80px ${teamColor}, 0 15px 50px rgba(0,0,0,0.5);
          }
        }
        .buzzer-ready {
          animation: buzzer-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

function BuzzerPage() {
  const { joinGame, myTeam, isConnected } = useGame()
  const [hasJoined, setHasJoined] = useState(false)

  // Check localStorage for saved player
  useEffect(() => {
    const saved = localStorage.getItem('goldenFriends_player')
    if (saved && isConnected) {
      try {
        const { name, team } = JSON.parse(saved)
        joinGame(name, team)
        setHasJoined(true)
      } catch {
        localStorage.removeItem('goldenFriends_player')
      }
    }
  }, [isConnected, joinGame])

  const handleSelect = (name: string, team: TeamId) => {
    joinGame(name, team)
    setHasJoined(true)
  }

  if (!hasJoined || !myTeam) {
    return <TeamSelector onSelect={handleSelect} />
  }

  return <BuzzerButton />
}

export default function BuzzerPageWrapper() {
  return (
    <GameProvider>
      <BuzzerPage />
    </GameProvider>
  )
}
