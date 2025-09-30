import React, { useState } from 'react';
import { Character, Screen } from '../types';

interface CharacterSelectProps {
  characters: Character[];
  onSelectionComplete: (player1: Character, player2: Character) => void;
  onNavigate: (screen: Screen) => void;
}

const CharacterSelect: React.FC<CharacterSelectProps> = ({ characters, onSelectionComplete, onNavigate }) => {
  const [player1, setPlayer1] = useState<Character | null>(null);
  const status = player1 ? 'Select Player 2' : 'Select Player 1';

  const handleSelect = (character: Character) => {
    if (!player1) {
      setPlayer1(character);
    } else {
      onSelectionComplete(player1, character);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-border-color px-6 sm:px-10 py-4 z-10 bg-primary-bg/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate(Screen.MainMenu)}>
              <svg className="h-8 w-8 text-highlight-yellow" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.44L19.36 8.35L12 12.26L4.64 8.35L12 4.44ZM4 9.69L11 13.5V19.9L4 16.2V9.69ZM13 19.9V13.5L20 9.69V16.2L13 19.9Z"></path>
              </svg>
              <h1 className="text-xl font-bold text-text-light tracking-wider">ARCADE CLASH</h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-xl font-bold text-highlight-yellow animate-pulse">{status}</p>
          </div>
      </header>
       <main className="flex-1 px-4 sm:px-8 md:px-16 lg:px-24 py-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold uppercase tracking-widest text-text-light mb-2">Select Your Fighter</h2>
          <div className="h-1 w-24 bg-highlight-yellow mb-12"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {characters.map((char) => (
              <div
                key={char.id}
                onClick={() => handleSelect(char)}
                className={`group relative overflow-hidden character-card bg-surface-bg border-2 border-border-color hover:border-highlight-yellow transition-all duration-300 cursor-pointer 
                  ${player1?.id === char.id ? 'border-team-a ring-4 ring-team-a shadow-glow-blue' : ''}`}
              >
                <div className={`absolute inset-0 bg-highlight-yellow opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className="relative p-2">
                  <div className="aspect-square w-full overflow-hidden">
                    <div
                      className="w-full h-full bg-cover bg-center character-image transition-transform duration-300 ease-in-out"
                      style={{ backgroundImage: `url("${char.image}")` }}
                    ></div>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="font-bold text-lg text-text-light">{char.name}</p>
                    <p className="text-xs text-text-gray px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-8">
                      {char.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CharacterSelect;
