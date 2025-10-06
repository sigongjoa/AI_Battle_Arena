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

// RLAgentController is now used inside GameScreen, so no need to import it here.

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

  // --- Game Mode Detection ---
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const gameMode = useMemo(() => urlParams.get('mode'), [urlParams]);

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
    // GameScreen itself will handle the RLAgentController.
    if (gameMode === 'rl_training') {
      return (
        <GameScreen
          localPlayerId={playerId}
          remotePlayerId="rl_agent" // Dummy ID for the opponent
          onNavigate={() => setCurrentScreen(Screen.MainMenu)}
        />
      );
    }

    // The rest of the navigation for non-RL modes
    switch (currentScreen) {
      case Screen.MainMenu:
        return <MainMenu onNavigate={navigateTo} />;
      case Screen.GameScreen:
         // This path is for non-RL game modes, which are not implemented with the new architecture yet.
         // We can show a placeholder or the main menu.
        console.warn("GameScreen in non-RL mode is not supported in this version.");
        return <MainMenu onNavigate={navigateTo} />;
      case Screen.CharacterSelect:
        // Assuming characters are fetched elsewhere or not needed for this simplified version
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
