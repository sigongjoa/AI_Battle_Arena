import React, { useEffect, useMemo, useState } from 'react';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import CharacterSelect from './components/CharacterSelect';
import TrainingMode from './components/TrainingMode';
import DebugPage from './components/DebugPage';
import VSScreen from './components/VSScreen';
import MatchResults from './components/MatchResults';
import MatchupAnalysis from './components/MatchupAnalysis';
import AnalysisMode from './components/AnalysisMode';
import RLDemoPage from './components/RLDemoPage'; // Import RLDemoPage
import RLDashboardPage from './components/RLDashboardPage'; // Import RLDashboardPage
import { SignalingClient } from './src/webrtc/signaling';
import { WebRtcClient } from './src/webrtc/client';
import { CHARACTERS } from './constants';
import { Character, Screen } from './types';

// Re-export Screen for backwards compatibility
export { Screen };

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState(Screen.MainMenu);
  const [currentSubScreen, setCurrentSubScreen] = useState<'main' | 'lobby'>('main');
  const [playerId] = useState<string>(`player_${Math.random().toString(36).substr(2, 9)}`);
  const [webRtcClient, setWebRtcClient] = useState<WebRtcClient | null>(null);
  const [selectedPlayer1, setSelectedPlayer1] = useState<Character | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<Character | null>(null);

  // --- Game Mode Detection ---
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const gameMode = useMemo(() => urlParams.get('mode'), [urlParams]);
  const backendPeerId = useMemo(() => urlParams.get('backend_peer_id'), [urlParams]);

  // --- WebRTC Initialization Effect ---
  useEffect(() => {
    if (gameMode === 'rl_training' && backendPeerId) {
      const signalingClient = new SignalingClient('ws://localhost:8001/ws');
      const client = new WebRtcClient({
        signalingClient,
        localPlayerId: playerId,
        remotePlayerId: backendPeerId,
        initiator: true, // Frontend is the initiator in this scenario
      });
      setWebRtcClient(client);
      client.start();

      return () => {
        client.destroy();
      };
    }
  }, [gameMode, backendPeerId, playerId]);



  const navigateTo = (screen: Screen, subScreen?: 'main' | 'lobby') => {
    console.log(`Navigating from ${Screen[currentScreen]} to ${Screen[screen]}`);
    setCurrentScreen(screen);
    if (subScreen) {
      setCurrentSubScreen(subScreen);
    }
  };

  const handleCharacterSelectionComplete = (player1: Character, player2: Character) => {
    console.log(`[App] Character selection complete: ${player1.name} vs ${player2.name}`);
    console.log(`[App] Setting selectedPlayer1:`, player1);
    console.log(`[App] Setting selectedPlayer2:`, player2);
    setSelectedPlayer1(player1);
    setSelectedPlayer2(player2);
    setCurrentScreen(Screen.GameScreen);
  };

  const renderScreen = () => {
    console.log(`[App.renderScreen] currentScreen=${Screen[currentScreen]}`);

    // The rest of the navigation for non-RL modes
    switch (currentScreen) {
      case Screen.MainMenu:
        console.log(`[App.renderScreen] Rendering MainMenu`);
        return <MainMenu onNavigate={navigateTo} currentSubScreen={currentSubScreen} />;
      case Screen.GameScreen:
        console.log(`[App.renderScreen] CASE GameScreen - selectedPlayer1=${selectedPlayer1?.name}, selectedPlayer2=${selectedPlayer2?.name}`);
        if (selectedPlayer1 && selectedPlayer2) {
          console.log(`[App.renderScreen] RETURNING GameScreen component`);
          const component = (
            <GameScreen
              webRtcClient={webRtcClient}
              onNavigate={navigateTo}
              player1={selectedPlayer1}
              player2={selectedPlayer2}
            />
          );
          console.log(`[App.renderScreen] GameScreen component created:`, component);
          return component;
        }
        console.log(`[App.renderScreen] Players not selected, returning to MainMenu`);
        return <MainMenu onNavigate={navigateTo} currentSubScreen={currentSubScreen} />;
      case Screen.CharacterSelect:
        return (
          <CharacterSelect
            onNavigate={navigateTo}
            characters={CHARACTERS}
            onSelectionComplete={handleCharacterSelectionComplete}
          />
        );
      case Screen.TrainingMode:
        return <TrainingMode onNavigate={navigateTo} />;
      case Screen.DebugScreen:
        return <DebugPage onNavigate={navigateTo} />;
      case Screen.VSScreen:
        return <VSScreen onNavigate={navigateTo} />;
      case Screen.MatchResults:
        return <MatchResults onNavigate={navigateTo} />;
      case Screen.MatchupAnalysis:
        return <MatchupAnalysis onNavigate={navigateTo} />;
      case Screen.AnalysisMode:
        return <AnalysisMode onNavigate={navigateTo} />;
      case Screen.RLDemo:
        return <RLDemoPage />;
      case Screen.RLDashboard: // Add RLDashboard case
        return <RLDashboardPage />;
      default:
        return <MainMenu onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="app-container">
      {renderScreen()}
    </div>
  );
};

export default App;
