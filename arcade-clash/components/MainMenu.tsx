
import React from 'react';
import { Screen } from '../types';

interface MainMenuProps {
  onNavigate: (screen: Screen) => void;
}

const PrimaryButton: React.FC<{onClick: () => void, children: React.ReactNode}> = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="w-full py-3 px-6 text-lg font-semibold text-primary-bg bg-highlight-yellow rounded-lg transition-transform duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-highlight-yellow/50"
    >
        {children}
    </button>
);

const SecondaryButton: React.FC<{onClick: () => void, children: React.ReactNode}> = ({ onClick, children }) => (
     <button
        onClick={onClick}
        className="w-full py-3 px-6 text-lg font-semibold text-text-light bg-transparent border-2 border-border-color rounded-lg transition-all duration-200 ease-in-out hover:bg-surface-bg hover:border-highlight-yellow focus:outline-none focus:ring-4 focus:ring-highlight-yellow/50"
    >
        {children}
    </button>
);


const MainMenu: React.FC<MainMenuProps> = ({ onNavigate }) => {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary-bg/80 backdrop-blur-sm"></div>
      <main className="relative z-10 w-full max-w-sm text-center">
        <h1 className="text-6xl font-bold text-text-light uppercase tracking-widest mb-4">
          Arcade <span className="text-highlight-yellow">Clash</span>
        </h1>
        <p className="text-text-gray mb-12">The Ultimate Fighting Experience</p>
        <nav className="flex flex-col items-center space-y-4">
          <PrimaryButton onClick={() => onNavigate(Screen.CharacterSelect)}>
            Start Game
          </PrimaryButton>
          <SecondaryButton onClick={() => onNavigate(Screen.MoveList)}>
            Move List
          </SecondaryButton>
           <SecondaryButton onClick={() => onNavigate(Screen.MatchupAnalysis)}>
            Matchup Analysis
          </SecondaryButton>
          <SecondaryButton onClick={() => onNavigate(Screen.AnalysisMode)}>
            Analysis Mode
          </SecondaryButton>
          <SecondaryButton onClick={() => onNavigate(Screen.TrainingMode)}>
            Training Mode
          </SecondaryButton>
        </nav>
      </main>
    </div>
  );
};

export default MainMenu;
