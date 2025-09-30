import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Character, Screen } from '../types';
import PauseMenu from './PauseMenu';

// Import generated gRPC code
import { GameServiceClientImpl, GameState, GameStateRequest } from '../src/grpc/game';
import * as grpcWeb from 'grpc-web'; // For gRPC-Web client

interface HUDProps {
  player1: Character;
  player2: Character;
  onMatchEnd: (winner: Character | null) => void;
  onNavigate: (screen: Screen) => void;
}

const HUD: React.FC<HUDProps> = ({ player1, player2, onMatchEnd, onNavigate }) => {
  const [p1Health, setP1Health] = useState(100);
  const [p2Health, setP2Health] = useState(100);
  const [p1Super, setP1Super] = useState(0);
  const [p2Super, setP2Super] = useState(0);
  const [timer, setTimer] = useState(99);
  const [isPaused, setIsPaused] = useState(false); // For frontend-only pause

  // const socketRef = useRef<WebSocket | null>(null); // Removed

  useEffect(() => {
    const matchId = `match_${Date.now()}`;
    const client = new GameServiceClientImpl('http://localhost:8080'); // gRPC-Web proxy address

    const request = new GameStateRequest();
    request.setMatchId(matchId);
    request.setPlayer1Id(player1.id);
    request.setPlayer2Id(player2.id);

    console.log('gRPC: Starting StreamGameState');
    const stream = client.streamGameState(request, {});

    stream.on('data', (response: GameState) => {
      // Assuming GameState protobuf message matches the backend
      setTimer(response.getTimer());
      setP1Health(response.getPlayer1()?.getHealth() || 0);
      setP1Super(response.getPlayer1()?.getSuperGauge() || 0);
      setP2Health(response.getPlayer2()?.getHealth() || 0);
      setP2Super(response.getPlayer2()?.getSuperGauge() || 0); // Corrected to getSuperGauge()

      if (response.getWinnerId() !== 0) { // Assuming 0 means no winner yet, or null/undefined
        const winner = response.getWinnerId() === player1.id ? player1 : (response.getWinnerId() === player2.id ? player2 : null);
        setTimeout(() => onMatchEnd(winner), 1000); // Delay for final animation
        stream.cancel(); // Cancel the stream
      }
    });

    stream.on('end', () => {
      console.log('gRPC: StreamGameState ended');
    });

    stream.on('status', (status: grpcWeb.StatusCode) => {
      console.log('gRPC: StreamGameState status:', status);
      if (status.code !== grpcWeb.StatusCode.OK) {
        console.error('gRPC: StreamGameState error:', status.details);
      }
    });

    // Cleanup on component unmount
    return () => {
      stream.cancel();
      console.log('gRPC: StreamGameState cancelled on unmount');
    };
  }, [player1, player2, onMatchEnd]);

  // The pause functionality is now frontend-only for simplicity.
  // A more robust implementation would send pause/resume events to the backend.
  const handleRestart = () => {
      // For a real restart, we'd need to re-establish the WebSocket connection
      // or send a 'restart' message. For now, we can just reload the screen.
      onNavigate(Screen.CharacterSelect);
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') setIsPaused(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAHVBDvndSYFUfub8CuNsOqUvrrw4TelAXH3CV5EyKvUC-4EluqhtMPI1tj0AtolSfLEpWKaBU4x9q6vfu1Bdksmosh_76qCwKoGfkB-7xmfqnL1bNFDWJeJ6fEOV15AgRdVUCopFRgRa3Oq34665mtbw5YD1XusFBzTNyJgOGNJfIHTqWiUsih9QoERoAxEVjoJHuAaPOyFhPctIZUgB-RChqnlP-AkN7qjwdOe0ndCqgQOzgoMWaZ_9ZM-cUqtzm4-PHryq4kiWxL')" }}>
      {isPaused && <PauseMenu onResume={() => setIsPaused(false)} onRestart={handleRestart} onQuit={() => onNavigate(Screen.MainMenu)} />}
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative flex h-full grow flex-col p-4 sm:p-6 lg:p-8">
        {/* Top HUD */}
        <div className="flex items-start justify-between gap-4">
          {/* Player 1 */}
          <div className="flex-1">
            <div className="flex justify-between items-baseline mb-1">
              <h2 className="text-2xl font-bold text-text-light drop-shadow-md">{player1.name.toUpperCase()}</h2>
            </div>
            <div className="w-full bg-neutral-secondary/50 p-1 rounded-lg health-bar-clip border-2 border-border-color">
              <div className="bg-team-a h-8 rounded health-bar-clip transition-all duration-300" style={{ width: `${p1Health}%` }}></div>
            </div>
          </div>
          {/* Timer */}
          <div className="flex flex-col items-center pt-2 w-48">
            <div className="bg-primary-bg border-2 border-highlight-yellow rounded-xl px-8 py-3 shadow-glow-yellow">
              <p className="text-6xl font-bold text-highlight-yellow tracking-widest">{timer}</p>
            </div>
          </div>
          {/* Player 2 */}
          <div className="flex-1">
            <div className="flex justify-between items-baseline mb-1 text-right">
              <h2 className="text-2xl font-bold text-text-light drop-shadow-md ml-auto">{player2.name.toUpperCase()}</h2>
            </div>
            <div className="w-full bg-neutral-secondary/50 p-1 rounded-lg health-bar-clip-rev border-2 border-border-color transform -scale-x-100">
              <div className="bg-team-b h-8 rounded health-bar-clip-rev transition-all duration-300" style={{ width: `${p2Health}%` }}></div>
            </div>
          </div>
        </div>
        
        {/* Bottom HUD */}
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
          {/* Player 1 Super */}
          <div className="flex-1">
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="text-lg font-semibold text-text-gray drop-shadow-md">SUPER</h3>
              <span className={`font-medium ${p1Super === 100 ? 'text-highlight-yellow animate-pulse' : 'text-text-gray'}`}>{p1Super === 100 ? 'MAX' : `${p1Super.toFixed(0)}%`}</span>
            </div>
            <div className="w-full bg-neutral-secondary/50 p-0.5 rounded-full border border-border-color">
              <div className="bg-highlight-yellow h-4 rounded-full transition-all duration-300" style={{ width: `${p1Super}%` }}></div>
            </div>
          </div>
          <div className="w-1/3"></div>
          {/* Player 2 Super */}
          <div className="flex-1">
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="text-lg font-semibold text-text-gray drop-shadow-md ml-auto">SUPER</h3>
              <span className={`font-medium ml-4 ${p2Super === 100 ? 'text-highlight-yellow animate-pulse' : 'text-text-gray'}`}>{p2Super === 100 ? 'MAX' : `${p2Super.toFixed(0)}%`}</span>
            </div>
            <div className="w-full bg-neutral-secondary/50 p-0.5 rounded-full transform -scale-x-100 border border-border-color">
              <div className="bg-highlight-yellow h-4 rounded-full transition-all duration-300" style={{ width: `${p2Super}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HUD;