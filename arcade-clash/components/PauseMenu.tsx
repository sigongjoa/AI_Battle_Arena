import React from 'react';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

const buttonClass = "w-full py-3 px-6 text-lg font-semibold text-text-light bg-surface-bg border-2 border-border-color rounded-lg transition-all duration-200 ease-in-out hover:bg-neutral-secondary/40 hover:border-highlight-yellow focus:outline-none focus:ring-4 focus:ring-highlight-yellow/50";

const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onRestart, onQuit }) => {
  return (
    <div className="absolute inset-0 bg-primary-bg/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="pause-menu-title">
      <h2 id="pause-menu-title" className="text-6xl font-bold text-highlight-yellow tracking-widest mb-12 animate-pulse">ANALYSIS MODE</h2>
      <nav className="flex flex-col gap-4 w-full max-w-xs text-lg">
        <button onClick={onResume} className={buttonClass}>Resume</button>
        <button onClick={onRestart} className={buttonClass}>Restart Match</button>
        <button onClick={onQuit} className={buttonClass}>Quit to Main Menu</button>
      </nav>
      <p className="mt-12 text-text-gray text-lg">Press ESC to Resume</p>
    </div>
  );
};

export default PauseMenu;