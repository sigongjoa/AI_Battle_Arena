import React, { useState } from 'react';

const RLDemoPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>('PPO_Model_V1');
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  const availableModels = [
    'PPO_Model_V1',
    'A2C_Model_V1',
    'Custom_Rule_Based_AI',
  ];

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(event.target.value);
  };

  const handleStartGame = () => {
    console.log(`Starting game with model: ${selectedModel}`);
    setGameStarted(true);
    // In a real implementation, this would trigger a backend call
    // to load the model and start the game simulation.
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>RL Agent Live Demo</h1>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="model-select" style={{ marginRight: '10px' }}>Select AI Model:</label>
        <select id="model-select" value={selectedModel} onChange={handleModelChange}>
          {availableModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
        <button 
          onClick={handleStartGame} 
          disabled={gameStarted} 
          style={{ marginLeft: '20px', padding: '10px 20px', fontSize: '16px' }}
        >
          {gameStarted ? 'Game Running...' : 'Start Game'}
        </button>
      </div>

      {gameStarted ? (
        <div style={{ 
          border: '2px solid #ccc', 
          width: '800px', 
          height: '450px', 
          margin: '0 auto', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: '#f0f0f0'
        }}>
          <p>Game Simulation Area (Model: {selectedModel})</p>
          {/* This is where the actual game rendering component would go */}
        </div>
      ) : (
        <p>Select a model and click 'Start Game' to begin the simulation.</p>
      )}
    </div>
  );
};

export default RLDemoPage;
