import React, { useState, useEffect } from 'react';
import { Screen, Character, Move } from '../types';
import { CaretRight, Play } from './Icons';

interface MoveListProps {
  character: Character;
  onNavigate: (screen: Screen) => void;
}

const MoveList: React.FC<MoveListProps> = ({ character, onNavigate }) => {
  const [moves, setMoves] = useState<Move[]>([]);
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!character) return;
    setIsLoading(true);
    fetch(`http://localhost:8000/api/characters/${character.id}/moves`)
      .then(res => res.json())
      .then((data: Move[]) => {
        setMoves(data);
        if (data.length > 0) {
          setSelectedMove(data[0]);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Failed to fetch moves:", error);
        setIsLoading(false);
      });
  }, [character]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-border-color px-6 sm:px-10 py-4 z-10 bg-primary-bg/80 backdrop-blur-sm sticky top-0">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate(Screen.MainMenu)}>
              <svg className="h-8 w-8 text-highlight-yellow" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.44L19.36 8.35L12 12.26L4.64 8.35L12 4.44ZM4 9.69L11 13.5V19.9L4 16.2V9.69ZM13 19.9V13.5L20 9.69V16.2L13 19.9Z"></path>
              </svg>
              <h1 className="text-xl font-bold text-text-light tracking-wider">ARCADE CLASH</h1>
          </div>
        <nav className="hidden md:flex items-center gap-8">
            <a className="text-sm font-medium text-text-gray hover:text-highlight-yellow transition-colors" href="#" onClick={(e) => {e.preventDefault(); onNavigate(Screen.MainMenu)}}>Home</a>
            <a className="text-sm font-medium text-text-gray hover:text-highlight-yellow transition-colors" href="#" onClick={(e) => {e.preventDefault(); onNavigate(Screen.CharacterSelect)}}>Characters</a>
            <a className="text-sm font-medium text-highlight-yellow" href="#">Moves</a>
        </nav>
      </header>
      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-tight text-text-light">Character Move List</h2>
              <p className="text-text-gray mt-2">Explore the comprehensive move list for your chosen character.</p>
            </div>
            <div className="mb-8">
              <h3 className="text-2xl font-bold tracking-tight text-text-light mb-4">Character: {character.name}</h3>
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-cover bg-center border border-border-color" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAkW9P5O4M7FKUyEpupPaOs6gzLW1-ovazo8ajd-loHktGkqmejqHePSygi-RVcVmck-uMu-BhrH3id_Jvlyy9DJBXIKJDSGHx3B2agGq1SitpdJqa0Mg06wDslAHkUQwWAypl_7RCzxsDee0nOPOow694Yz_YnF18PnEX-6JLh8Yj9YZTLAOOWGG7tdh5izVEDfzUwEJVRvUenDLAeYbyapJEWSbdqBXW3hkjQ9nHNogKAUOmZAPNS4TalrhZL5CCumaYiTmaKxHVM")'}}>
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <button className="flex items-center justify-center rounded-full size-20 bg-black/50 text-text-light hover:bg-black/70 transition-colors"><Play /></button>
                </div>
              </div>
            </div>
            {selectedMove && (
              <div className="bg-surface-bg p-6 rounded-lg border border-border-color">
                <h3 className="text-2xl font-bold tracking-tight text-text-light mb-4">Move: {selectedMove.name}</h3>
                <div className="divide-y divide-border-color">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 py-4"><p className="text-text-gray font-medium">Description</p><p className="md:col-span-3 text-text-light">{selectedMove.description}</p></div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 py-4"><p className="text-text-gray font-medium">Input</p><p className="md:col-span-3 text-text-light font-mono">{selectedMove.input}</p></div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 py-4"><p className="text-text-gray font-medium">Frame Data</p><p className="md:col-span-3 text-text-light">{selectedMove.frameData}</p></div>
                </div>
              </div>
            )}
          </div>
          <aside className="lg:col-span-1">
            <div className="sticky top-28">
              <h3 className="text-2xl font-bold tracking-tight text-text-light mb-4">Move List</h3>
              <div className="flex flex-col space-y-2">
                {isLoading ? <p className="text-text-gray">Loading moves...</p> :
                  moves.map(move => (
                    <a key={move.name} href="#" onClick={(e) => { e.preventDefault(); setSelectedMove(move);}} 
                      className={`flex items-center justify-between p-4 rounded-lg transition-colors ${selectedMove?.name === move.name ? 'bg-team-a/20 text-team-a' : 'bg-surface-bg border border-border-color hover:bg-neutral-secondary/40 text-text-gray'}`}>
                      <span className="font-medium">{move.name}</span>
                      <CaretRight />
                    </a>
                  ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default MoveList;