'use client'

import { useEffect } from 'react'
import { GameProvider, useGame } from '@/context/GameContext'
import AnswerBoard from '@/components/tv/AnswerBoard'
import ScoreBoard from '@/components/tv/ScoreBoard'
import BuzzerIndicator from '@/components/tv/BuzzerIndicator'
import WrongX from '@/components/tv/WrongX'

function TVDisplay() {
  const { gameState, subscribeTV, isConnected } = useGame()

  useEffect(() => {
    subscribeTV()
  }, [subscribeTV])

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-400">
          {isConnected ? 'Chargement...' : 'Connexion au serveur...'}
        </div>
      </div>
    )
  }

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex]

  // Lobby phase
  if (gameState.phase === 'lobby') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <h1 className="text-7xl font-bold text-gold-400 mb-8">Golden Friends</h1>
        <p className="text-3xl text-gray-300 mb-12">Une Famille en Or - Edition Amis</p>

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
            <div className="text-xl text-gray-400 mt-2">joueurs</div>
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
            <div className="text-xl text-gray-400 mt-2">joueurs</div>
          </div>
        </div>

        <p className="text-xl text-gray-500 mt-12">
          En attente du debut du jeu...
        </p>
      </main>
    )
  }

  // Photo/buzzer question
  if (currentQuestion?.type === 'buzzer') {
    return (
      <main className="min-h-screen flex flex-col p-8">
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
      </main>
    )
  }

  // Regular multiple answer question
  return (
    <main className="min-h-screen flex flex-col p-6 md:p-8">
      {/* Header with scores */}
      <ScoreBoard
        girls={gameState.teams.girls}
        boys={gameState.teams.boys}
        roundPoints={gameState.roundPoints}
      />

      {/* Question */}
      <div className="text-center my-6 md:my-8">
        <div className="text-lg text-gold-400 uppercase tracking-wider mb-2">
          {currentQuestion?.category}
          {currentQuestion?.pointMultiplier && currentQuestion.pointMultiplier > 1 && (
            <span className="ml-2 bg-gold-400 text-gray-900 px-2 py-1 rounded text-sm font-bold">
              x{currentQuestion.pointMultiplier}
            </span>
          )}
        </div>
        <h2 className="text-3xl md:text-4xl font-bold max-w-4xl mx-auto">
          {currentQuestion?.question}
        </h2>
      </div>

      {/* Phase indicator */}
      {gameState.phase === 'faceoff' && (
        <div className="text-center mb-4">
          <span className="text-xl text-yellow-400 animate-pulse">
            FACE-OFF - Buzzez pour repondre en premier!
          </span>
          <BuzzerIndicator
            buzzOrder={gameState.buzzOrder}
            teams={gameState.teams}
            showFirst={true}
          />
        </div>
      )}

      {gameState.phase === 'steal' && (
        <div className="text-center mb-4">
          <span
            className="text-2xl font-bold animate-pulse px-6 py-2 rounded-lg"
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
              ? `${gameState.teams[gameState.activeTeam].name} peut voler!`
              : 'STEAL!'}
          </span>
        </div>
      )}

      {gameState.phase === 'play' && gameState.controllingTeam && (
        <div className="text-center mb-4">
          <span
            className="text-xl px-4 py-2 rounded-lg"
            style={{
              backgroundColor: gameState.teams[gameState.controllingTeam].color + '40',
              color: gameState.teams[gameState.controllingTeam].color,
            }}
          >
            {gameState.teams[gameState.controllingTeam].name} joue
          </span>
        </div>
      )}

      {/* Answer board */}
      <div className="flex-1 flex items-center">
        {currentQuestion && <AnswerBoard answers={currentQuestion.answers} />}
      </div>

      {/* Wrong X overlay */}
      <WrongX show={gameState.showWrongX} />
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
