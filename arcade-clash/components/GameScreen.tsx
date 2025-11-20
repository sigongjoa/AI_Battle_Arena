import React, { useState, useEffect } from 'react';
import Game3D from './Game3D';
import GameArena from './GameArena';
import PauseMenu from './PauseMenu';
import { Screen, Character as CharacterType } from '../types';

interface GameScreenProps {
  webRtcClient: any;
  onNavigate: (screen: Screen) => void;
  player1?: CharacterType;
  player2?: CharacterType;
}

interface GamePlayer {
  id: number;
  character: string;
  x: number;
  y: number;
  health: number;
  action: 'idle' | 'walk' | 'punch';
  frame: number;
}

const GameScreen: React.FC<GameScreenProps> = ({ webRtcClient, onNavigate, player1: selectedPlayer1, player2: selectedPlayer2 }) => {
  const [isPaused, setIsPaused] = useState(false);

  // Initialize game state with character positions and actions
  const [gameState, setGameState] = useState(() => {
    const initialState = {
      timer: 99,
      players: [
        {
          id: selectedPlayer1?.id || 1,
          character: selectedPlayer1?.name.toLowerCase() || 'ryu',
          x: 300,
          y: 400,
          health: 100,
          action: 'idle' as const,
          frame: 0,
        },
        {
          id: selectedPlayer2?.id || 2,
          character: selectedPlayer2?.name.toLowerCase() || 'chun-li',
          x: 900,
          y: 400,
          health: 100,
          action: 'idle' as const,
          frame: 0,
        },
      ],
    };
    console.log('[GameScreen] Initial gameState:', initialState);
    return initialState;
  });

  // Handle keyboard input for character movement
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPaused) return;

      setGameState(prev => {
        const newPlayers = [...prev.players] as GamePlayer[];
        const moveDistance = 20;

        switch (event.key) {
          case 'ArrowLeft':
            // Move player 1 left
            newPlayers[0] = { ...newPlayers[0], x: Math.max(100, newPlayers[0].x - moveDistance), action: 'walk' };
            event.preventDefault();
            break;
          case 'ArrowRight':
            // Move player 1 right
            newPlayers[0] = { ...newPlayers[0], x: Math.min(1100, newPlayers[0].x + moveDistance), action: 'walk' };
            event.preventDefault();
            break;
          case ' ':
            // Jump or attack for player 1
            newPlayers[0] = { ...newPlayers[0], action: 'punch' };
            event.preventDefault();
            break;
          case 'a':
          case 'A':
            // Move player 2 left
            newPlayers[1] = { ...newPlayers[1], x: Math.max(100, newPlayers[1].x - moveDistance), action: 'walk' };
            break;
          case 'd':
          case 'D':
            // Move player 2 right
            newPlayers[1] = { ...newPlayers[1], x: Math.min(1100, newPlayers[1].x + moveDistance), action: 'walk' };
            break;
          case 'w':
          case 'W':
            // Jump or attack for player 2
            newPlayers[1] = { ...newPlayers[1], action: 'punch' };
            break;
          case 'Escape':
            // Pause game
            if (!isPaused) {
              setIsPaused(true);
            }
            event.preventDefault();
            break;
          default:
            return prev;
        }

        return { ...prev, players: newPlayers };
      });
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (isPaused) return;

      setGameState(prev => {
        const newPlayers = [...prev.players] as GamePlayer[];

        // Return to idle when key is released (except for punch)
        switch (event.key) {
          case 'ArrowLeft':
          case 'ArrowRight':
            if (newPlayers[0].action === 'walk') {
              newPlayers[0] = { ...newPlayers[0], action: 'idle' };
            }
            break;
          case 'a':
          case 'A':
          case 'd':
          case 'D':
            if (newPlayers[1].action === 'walk') {
              newPlayers[1] = { ...newPlayers[1], action: 'idle' };
            }
            break;
          default:
            return prev;
        }

        return { ...prev, players: newPlayers };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPaused]);

  // Game loop - update animation frames and reset actions
  useEffect(() => {
    const gameLoop = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        timer: Math.max(0, prev.timer - 0.016), // 60 FPS
        players: prev.players.map(player => {
          // Reset punch action after 1 frame
          let newAction = player.action;
          if (player.action === 'punch') {
            newAction = 'idle';
          }

          return {
            ...player,
            frame: (player.frame + 1) % 10, // Animate through frames
            action: newAction,
          };
        }),
      }));
    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, []);

  const handleResume = () => {
    setIsPaused(false);
  };

  // Use selected characters or fallback to dummy data
  const player1 = selectedPlayer1 || {
    id: 1,
    name: 'Player 1',
    description: 'Default fighter',
    image: '',
    profileImage: '',
    vsImage: '',
    thumbnail: '',
    color: 'emphasis-yellow'
  };

  const player2 = selectedPlayer2 || {
    id: 2,
    name: 'Player 2',
    description: 'Default fighter',
    image: '',
    profileImage: '',
    vsImage: '',
    thumbnail: '',
    color: 'emphasis-blue'
  };

  return (
    <div className="game-screen w-full h-screen bg-primary-bg flex flex-col">
      {/* Character Info Bar */}
      <div className="bg-surface-bg/80 border-b border-border-color px-6 py-4 flex justify-between items-center">
        {/* Player 1 Info */}
        <div className="flex items-center gap-4">
          {player1.thumbnail && (
            <img
              src={player1.thumbnail}
              alt={player1.name}
              className="w-12 h-12 rounded border border-border-color"
            />
          )}
          <div>
            <p className="text-sm text-text-gray">PLAYER 1</p>
            <p className="text-lg font-bold text-text-light">{player1.name}</p>
            <p className="text-xs text-text-gray">{player1.description}</p>
          </div>
        </div>

        {/* Timer */}
        <div className="text-center">
          <p className="text-4xl font-bold text-highlight-yellow">{Math.ceil(gameState.timer)}</p>
        </div>

        {/* Player 2 Info */}
        <div className="flex items-center gap-4 flex-row-reverse">
          {player2.thumbnail && (
            <img
              src={player2.thumbnail}
              alt={player2.name}
              className="w-12 h-12 rounded border border-border-color"
            />
          )}
          <div className="text-right">
            <p className="text-sm text-text-gray">PLAYER 2</p>
            <p className="text-lg font-bold text-text-light">{player2.name}</p>
            <p className="text-xs text-text-gray">{player2.description}</p>
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Use Game3D (Phase 8 3D rigging system) for 3D rendering */}
        {/* To use GameArena (2D sprite rendering) instead, comment out Game3D and uncomment GameArena below */}
        <Game3D
          gameState={gameState}
          player1={player1}
          player2={player2}
          characterFbxUrls={{
            'ryu': '/models/remy.fbx',
            'chun-li': '/models/remy.fbx',
            'remy': '/models/remy.fbx'
          }}
        />
        {/* <GameArena gameState={gameState} player1={player1} player2={player2} /> */}
      </div>

      {/* Pause Menu */}
      {isPaused && <PauseMenu onResume={handleResume} onExit={() => onNavigate(Screen.MainMenu)} />}

      {/* Press ESC to Pause hint */}
      <div className="absolute bottom-6 right-6 text-text-gray text-sm">
        Press <span className="font-bold text-highlight-yellow">ESC</span> to pause
      </div>
    </div>
  );
};

export default GameScreen;
