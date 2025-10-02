import React from 'react';
import { Screen } from '../types';
import characterMetadata from '../src/components/characterMetadata.json';

interface DebugPageProps {
  onNavigate: (screen: Screen) => void;
}

const DebugPage: React.FC<DebugPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen w-full bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Debug Information</h1>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Character Metadata</h2>
        <pre className="bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
          {JSON.stringify(characterMetadata, null, 2)}
        </pre>
      </div>

      {/* Add more debug info here later */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Live Game State (TODO)</h2>
        <p className="text-gray-400">
          Implement fetching and displaying live game state from gRPC stream here.
        </p>
      </div>

      <button
        onClick={() => onNavigate(Screen.MainMenu)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Back to Main Menu
      </button>
    </div>
  );
};

export default DebugPage;
