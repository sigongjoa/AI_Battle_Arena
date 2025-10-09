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
import { SignalingClient } from './src/webrtc/signaling';
import { WebRtcClient } from './src/webrtc/client';

// Define screen types
export enum Screen {
  MainMenu,
  CharacterSelect,
  GameScreen,
  TrainingMode,
  DebugScreen,
  VSScreen,
  MatchResults,
  MatchupAnalysis,
  AnalysisMode,
}

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState(Screen.MainMenu);
  const [playerId] = useState<string>(`player_${Math.random().toString(36).substr(2, 9)}`);
  const [webRtcClient, setWebRtcClient] = useState<WebRtcClient | null>(null);

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

  // --- Screen Navigation Effect ---
  useEffect(() => {
    if (gameMode === 'rl_training') {
      setCurrentScreen(Screen.GameScreen);
    }
  }, [gameMode]);

  const navigateTo = (screen: Screen) => {
    console.log(`Navigating from ${Screen[currentScreen]} to ${Screen[screen]}`);
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    // In RL Training mode, we directly render the GameScreen.
    if (gameMode === 'rl_training') {
      return (
        <GameScreen
          webRtcClient={webRtcClient}
          onNavigate={() => setCurrentScreen(Screen.MainMenu)}
        />
      );
    }

    // The rest of the navigation for non-RL modes
    switch (currentScreen) {
      case Screen.MainMenu:
        return <MainMenu onNavigate={navigateTo} />;
      case Screen.GameScreen:
        console.warn("GameScreen in non-RL mode is not supported in this version.");
        return <MainMenu onNavigate={navigateTo} />;
      case Screen.CharacterSelect:
        return <CharacterSelect onNavigate={navigateTo} characters={[]} />;
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
