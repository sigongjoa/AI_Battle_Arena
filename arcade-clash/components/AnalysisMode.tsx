import React, { useState, useEffect } from 'react';
import { Screen, Character } from '../types';
import BattleRhythmVisualizer from './BattleRhythmVisualizer';

interface AnalysisModeProps {
  character: Character;
  onNavigate: (screen: Screen) => void;
}

const AnalysisMode: React.FC<AnalysisModeProps> = ({ character, onNavigate }) => {
  // State to hold the match log data
  const [player1Log, setPlayer1Log] = useState([]);
  const [player2Log, setPlayer2Log] = useState([]);
  const [totalFrames, setTotalFrames] = useState(0);

  // useEffect to fetch match data when the component mounts
  useEffect(() => {
    // MOCK DATA: In a real implementation, this would be fetched from the backend
    // via a WebRTC data channel request.
    const mockP1Log = [
      { action: 'MOVE', frame: 10, duration: 30 },
      { action: 'PUNCH', frame: 50, duration: 15 },
      { action: 'GUARD', frame: 80, duration: 40 },
      { action: 'KICK', frame: 150, duration: 20 },
      { action: 'MOVE', frame: 200, duration: 50 },
    ];
    const mockP2Log = [
      { action: 'GUARD', frame: 20, duration: 20 },
      { action: 'MOVE', frame: 60, duration: 40 },
      { action: 'PUNCH', frame: 110, duration: 15 },
      { action: 'PUNCH', frame: 140, duration: 15 },
      { action: 'GUARD', frame: 180, duration: 60 },
    ];
    const mockTotalFrames = 300; // Example: 5 seconds at 60 FPS

    setPlayer1Log(mockP1Log);
    setPlayer2Log(mockP2Log);
    setTotalFrames(mockTotalFrames);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAHVBDvndSYFUfub8CuNsOqUvrrw4TelAXH3CV5EyKvUC-4EluqhtMPI1tj0AtolSfLEpWKaBU4x9q6vfu1Bdksmosh_76qCwKoGfkB-7xmfqnL1bNFDWJeJ6fEOV15AgRdVUCopFRgRa3Oq34665mtbw5YD1XusFBzTNyJgOGNJfIHTqWiUsih9QoERoAxEVjoJHuAaPOyFhPctIZUgB-RChqnlP-AkN7qjwdOe0ndCqgQOzgoMWaZ_9ZM-cUqtzm4-PHryq4kiWxL')" }}>
      <div className="absolute inset-0 bg-primary-bg/80"></div>
      <div className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="absolute top-4 sm:top-6 lg:top-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-highlight-yellow drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-wider">ANALYSIS MODE</h1>
          <p className="text-lg text-text-gray">BATTLE RHYTHM</p>
        </div>
        
        <div className="w-full max-w-4xl my-auto">
          <div className="bg-surface-bg/80 border border-team-a/50 rounded-lg p-6 shadow-glow-blue backdrop-blur-sm">
            <BattleRhythmVisualizer 
              player1Log={player1Log}
              player2Log={player2Log}
              totalFrames={totalFrames}
            />
          </div>
        </div>

        <div className="absolute bottom-4 sm:bottom-6 lg:bottom-8 text-center w-full">
          <button
            onClick={() => onNavigate(Screen.MainMenu)}
            className="bg-highlight-yellow text-primary-bg font-bold py-3 px-8 rounded-lg transition-transform duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-highlight-yellow/50"
          >
            RETURN
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisMode;