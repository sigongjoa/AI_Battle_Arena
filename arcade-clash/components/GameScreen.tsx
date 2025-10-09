import React, { useState } from 'react';
import HUD from './HUD';
import Character from './Character';
import PauseMenu from './PauseMenu';
import { Screen } from '../App';

interface GameScreenProps {
  webRtcClient: any;
  onNavigate: (screen: Screen) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ webRtcClient, onNavigate }) => {
  const [isPaused, setIsPaused] = useState(false);

  const handleResume = () => {
    setIsPaused(false);
  };

  // Dummy player data for now, this will be replaced by data from the backend
  const player1 = { id: 'p1', name: 'Player 1' };
  const player2 = { id: 'p2', name: 'Player 2' };

  return (
    <div className="game-screen">
      <HUD 
        player1={player1} 
        player2={player2} 
        webRtcClient={webRtcClient} 
        onMatchEnd={() => onNavigate(Screen.MatchResults)} 
        onNavigate={onNavigate} 
      />
      {isPaused && <PauseMenu onResume={handleResume} onExit={() => onNavigate(Screen.MainMenu)} />}
    </div>
  );
};

export default GameScreen;