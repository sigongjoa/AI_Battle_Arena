import React, { useState, useEffect } from 'react';
import { Character as CharacterType, Screen } from '../types'; // Renaming to avoid conflict
import PauseMenu from './PauseMenu';
import Character from './Character'; // The new Character component
import { gameClient } from '../src/grpc/client';
import { GameState, GameStateRequest, PlayerState } from '../src/grpc/game';

interface HUDProps {
  player1: CharacterType;
  player2: CharacterType;
  onMatchEnd: (winner: CharacterType | null) => void;
  onNavigate: (screen: Screen) => void;
}

// Create a default empty game state
const defaultGameState: GameState = {
  matchId: '',
  timer: 99,
  players: [],
  winnerId: undefined,
};

const HUD: React.FC<HUDProps> = ({ player1, player2, onMatchEnd, onNavigate }) => {
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Initialize with player data for immediate feedback
    const p1Initial: PlayerState = {
        id: player1.id,
        character: player1.name,
        x: 200, // Initial placeholder position
        y: 450,
        action: 'idle',
        frame: 0,
        health: 100,
        superGauge: 0,
    };
    const p2Initial: PlayerState = {
        id: player2.id,
        character: player2.name,
        x: 600, // Initial placeholder position
        y: 450,
        action: 'idle',
        frame: 0,
        health: 100,
        superGauge: 0,
    };
    setGameState(prev => ({ ...prev, players: [p1Initial, p2Initial] }));


    const matchId = `match_${Date.now()}`;
    const request = GameStateRequest.create({
      matchId: matchId,
      player1Id: player1.id,
      player2Id: player2.id,
    });

    const controller = new AbortController();
    const stream = gameClient.streamGameState(request, {
      signal: controller.signal,
    });

    const consumeStream = async () => {
      try {
        for await (const response of stream) {
          setGameState(response);

          if (response.winnerId !== undefined && response.winnerId !== 0) {
            const winner = response.winnerId === player1.id ? player1 : (response.winnerId === player2.id ? player2 : null);
            setTimeout(() => onMatchEnd(winner), 1000);
            break; // Exit loop on match end
          }
        }
      } catch (error: any) {
        if (error.code === 'CANCELLED') {
          console.log('gRPC stream cancelled gracefully.');
        } else {
          console.error('gRPC stream error:', error);
        }      }
    };

    consumeStream();

    return () => {
      console.log('gRPC stream: Unmounting component, cancelling stream.');
      controller.abort();
    };
  }, [player1, player2, onMatchEnd]);

  const handleRestart = () => {
    onNavigate(Screen.CharacterSelect);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPaused(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const p1State = gameState.players.find(p => p.id === player1.id);
  const p2State = gameState.players.find(p => p.id === player2.id);

  return (
    <div className="relative min-h-screen w-full bg-cover bg-center" style={{ backgroundImage: "url('/assets/backgrounds/background1.png')" }}>
      {isPaused && <PauseMenu onResume={() => setIsPaused(false)} onRestart={handleRestart} onQuit={() => onNavigate(Screen.MainMenu)} />}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Render Characters */}
      {gameState.players.map(player => (
        <Character
          key={player.id}
          name={player.character}
          x={player.x}
          y={player.y}
          action={player.action}
          frame={player.frame}
        />
      ))}

      <div className="relative flex h-full grow flex-col p-4 sm:p-6 lg:p-8">
        {/* Top HUD */}
        <div className="flex items-start justify-between gap-4">
          {/* Player 1 */}
          <div className="flex-1">
            <div className="flex justify-between items-baseline mb-1">
              <h2 className="text-2xl font-bold text-text-light drop-shadow-md">{player1.name.toUpperCase()}</h2>
            </div>
            <div className="w-full bg-neutral-secondary/50 p-1 rounded-lg health-bar-clip border-2 border-border-color">
              <div className="bg-team-a h-8 rounded health-bar-clip transition-all duration-300" style={{ width: `${p1State?.health ?? 100}%` }}></div>
            </div>
          </div>
          {/* Timer */}
          <div className="flex flex-col items-center pt-2 w-48">
            <div className="bg-primary-bg border-2 border-highlight-yellow rounded-xl px-8 py-3 shadow-glow-yellow">
              <p className="text-6xl font-bold text-highlight-yellow tracking-widest">{gameState.timer}</p>
            </div>
          </div>
          {/* Player 2 */}
          <div className="flex-1">
            <div className="flex justify-between items-baseline mb-1 text-right">
              <h2 className="text-2xl font-bold text-text-light drop-shadow-md ml-auto">{player2.name.toUpperCase()}</h2>
            </div>
            <div className="w-full bg-neutral-secondary/50 p-1 rounded-lg health-bar-clip-rev border-2 border-border-color transform -scale-x-100">
              <div className="bg-team-b h-8 rounded health-bar-clip-rev transition-all duration-300" style={{ width: `${p2State?.health ?? 100}%` }}></div>
            </div>
          </div>
        </div>
        
        {/* Bottom HUD */}
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
          {/* Player 1 Super */}
          <div className="flex-1">
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="text-lg font-semibold text-text-gray drop-shadow-md">SUPER</h3>
              <span className={`font-medium ${p1State?.superGauge === 100 ? 'text-highlight-yellow animate-pulse' : 'text-text-gray'}`}>{p1State?.superGauge === 100 ? 'MAX' : `${(p1State?.superGauge ?? 0).toFixed(0)}%`}</span>
            </div>
            <div className="w-full bg-neutral-secondary/50 p-0.5 rounded-full border border-border-color">
              <div className="bg-highlight-yellow h-4 rounded-full transition-all duration-300" style={{ width: `${p1State?.superGauge ?? 0}%` }}></div>
            </div>
          </div>
          <div className="w-1/3"></div>
          {/* Player 2 Super */}
          <div className="flex-1">
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="text-lg font-semibold text-text-gray drop-shadow-md ml-auto">SUPER</h3>
              <span className={`font-medium ml-4 ${p2State?.superGauge === 100 ? 'text-highlight-yellow animate-pulse' : 'text-text-gray'}`}>{p2State?.superGauge === 100 ? 'MAX' : `${(p2State?.superGauge ?? 0).toFixed(0)}%`}</span>
            </div>
            <div className="w-full bg-neutral-secondary/50 p-0.5 rounded-full transform -scale-x-100 border border-border-color">
              <div className="bg-highlight-yellow h-4 rounded-full transition-all duration-300" style={{ width: `${p2State?.superGauge ?? 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HUD;
