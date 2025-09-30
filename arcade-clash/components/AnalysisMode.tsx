import React from 'react';
import { Screen, Character } from '../types';

interface AnalysisModeProps {
  character: Character;
  onNavigate: (screen: Screen) => void;
}

const AnalysisMode: React.FC<AnalysisModeProps> = ({ character, onNavigate }) => {
  return (
    <div className="relative min-h-screen w-full bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAHVBDvndSYFUfub8CuNsOqUvrrw4TelAXH3CV5EyKvUC-4EluqhtMPI1tj0AtolSfLEpWKaBU4x9q6vfu1Bdksmosh_76qCwKoGfkB-7xmfqnL1bNFDWJeJ6fEOV15AgRdVUCopFRgRa3Oq34665mtbw5YD1XusFBzTNyJgOGNJfIHTqWiUsih9QoERoAxEVjoJHuAaPOyFhPctIZUgB-RChqnlP-AkN7qjwdOe0ndCqgQOzgoMWaZ_9ZM-cUqtzm4-PHryq4kiWxL')" }}>
      <div className="absolute inset-0 bg-primary-bg/80"></div>
      <div className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="absolute top-4 sm:top-6 lg:top-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-highlight-yellow drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-wider">ANALYSIS MODE</h1>
          <p className="text-lg text-text-gray">{character.name.toUpperCase()} - SPECIAL MOVES</p>
        </div>
        <div className="flex items-center justify-center w-full grow">
          <div className="w-1/3 p-4">
            <div className="bg-surface-bg/80 border border-team-a/50 rounded-lg p-6 shadow-glow-blue backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-team-a mb-3">Hadoken</h3>
              <div className="space-y-3 text-text-light/90">
                <p><span className="font-semibold text-text-gray">Input:</span> ⬇️↘️➡️ + P</p>
                <p><span className="font-semibold text-text-gray">Description:</span> A projectile that travels across the screen. The speed varies with the punch button used.</p>
                <div>
                  <h4 className="font-semibold text-text-gray mb-1">Frame Data:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 text-text-light">
                    <li><span className="font-medium text-text-gray">Startup:</span> 14 frames</li>
                    <li><span className="font-medium text-text-gray">Recovery:</span> 33 frames</li>
                    <li><span className="font-medium text-text-gray">On Block:</span> -7</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 flex justify-center items-center">
            <img alt="Character" className="max-h-[60vh] object-contain drop-shadow-[0_10px_25px_rgba(250,204,21,0.3)]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDF0_jE4q2WjJ173RGYxG99j8JkGz9MvYn6Jp38v9KqWjH9cW5Qz3GzJ4JvX5W_y8b7kHjXz3yWz8HqW9xJ7Z_x5v4K3J_x4j_y5w4" />
          </div>
          <div className="w-1/3 p-4">
            <div className="bg-surface-bg/80 border border-team-b/50 rounded-lg p-6 shadow-glow-red backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-team-b mb-3">Shoryuken</h3>
              <div className="space-y-3 text-text-light/90">
                <p><span className="font-semibold text-text-gray">Input:</span> ➡️⬇️↘️ + P</p>
                <p><span className="font-semibold text-text-gray">Description:</span> An invincible rising uppercut. Excellent anti-air and reversal option.</p>
                <div>
                  <h4 className="font-semibold text-text-gray mb-1">Frame Data (Light Punch):</h4>
                   <ul className="list-disc list-inside text-sm space-y-1 text-text-light">
                    <li><span className="font-medium text-text-gray">Startup:</span> 3 frames</li>
                    <li><span className="font-medium text-text-gray">Active:</span> 14 frames</li>
                    <li><span className="font-medium text-text-gray">Recovery:</span> 20 + 9 landing</li>
                    <li><span className="font-medium text-text-gray">On Block:</span> -21</li>
                  </ul>
                </div>
              </div>
            </div>
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