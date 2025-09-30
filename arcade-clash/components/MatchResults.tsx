import React from 'react';
import { Character, Screen } from '../types';

interface MatchResultsProps {
  winner: Character | null;
  loser: Character | null;
  onNavigate: (screen: Screen) => void;
}

const MatchResults: React.FC<MatchResultsProps> = ({ winner, loser, onNavigate }) => {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-primary-bg">
      <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBKFAjRIFw0QVlGai_eBym-RbIAO-E2b93eq55sh-DIL4olB_kJeOrexDx1KfGT7v9vgPlWB2FjqKyoCyBPDETPmTXLBD2994peJ1Krir1R3Eo1Z_KuGvAOp5VPQV3gtvqks9lZIkaF4roBlM_VZMcbf4CsvDHXEuYRcpGe0J__SCgU2hQ-osmm8KiHRqx2dHsyimEWGPUVmp_nbG88J9KOPtyc95fZaiPTK5I57LwVjcyh5xx16mnyFeMWKxDCYODR6GgUDjncAbZ4')" }}></div>
      <div className="absolute inset-0 bg-gradient-to-t from-primary-bg via-primary-bg/80 to-transparent"></div>
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
        <h1 className="text-6xl font-bold uppercase tracking-widest text-highlight-yellow mb-2 animate-pulse">
          {winner ? 'Victory' : 'Draw'}
        </h1>
        <h2 className="text-3xl font-medium text-text-light/80 mb-12">Match Results</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {winner && (
            <div className="relative flex flex-col items-center p-6 border-2 border-highlight-yellow rounded-xl bg-surface-bg/80 backdrop-blur-sm shadow-glow-yellow">
              <div className="absolute -top-5 bg-highlight-yellow text-primary-bg px-4 py-1 rounded-full text-lg font-bold uppercase tracking-wider">Winner</div>
              <div className="flex flex-col items-center gap-4 mt-8">
                <img alt={winner.name} className="w-36 h-36 rounded-full border-4 border-highlight-yellow" src={winner.profileImage} />
                <div className="text-center">
                  <p className="text-2xl font-bold text-text-light">{winner.name}</p>
                  <p className="text-highlight-yellow font-medium">Victor</p>
                </div>
              </div>
            </div>
          )}
           {loser && (
            <div className="relative flex flex-col items-center p-6 border-2 border-border-color rounded-xl bg-surface-bg/80 backdrop-blur-sm">
              <div className="absolute -top-5 bg-neutral-secondary text-text-light px-4 py-1 rounded-full text-lg font-bold uppercase tracking-wider">Loser</div>
              <div className="flex flex-col items-center gap-4 mt-8">
                <img alt={loser.name} className="w-36 h-36 rounded-full border-4 border-border-color" src={loser.profileImage} />
                <div className="text-center">
                  <p className="text-2xl font-bold text-text-gray">{loser.name}</p>
                  <p className="text-text-gray/70 font-medium">Defeated</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 w-full max-w-xl">
          <button
            onClick={() => onNavigate(Screen.VSScreen)}
            className="w-full h-12 px-6 bg-highlight-yellow text-primary-bg font-bold text-lg uppercase tracking-wider rounded-lg transition-transform hover:scale-105"
          >
            Rematch
          </button>
          <button
            onClick={() => onNavigate(Screen.CharacterSelect)}
            className="w-full h-12 px-6 bg-surface-bg text-text-light border-2 border-border-color font-bold text-lg uppercase tracking-wider rounded-lg transition-transform hover:scale-105 hover:border-highlight-yellow"
          >
            Character Select
          </button>
        </div>
        <div className="mt-4">
          <button
            onClick={() => onNavigate(Screen.MainMenu)}
            className="h-10 px-6 bg-transparent text-text-gray font-medium text-base uppercase tracking-wider rounded-lg transition-colors hover:text-text-light"
          >
            Exit to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchResults;