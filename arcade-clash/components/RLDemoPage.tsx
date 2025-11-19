import React, { useState, useEffect, useRef } from 'react';

interface GameState {
  frame: number;
  player1: { x: number; y: number; hp: number; action: string; };
  player2: { x: number; y: number; hp: number; action: string; };
}

const RLDemoPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>('PPO_Model_V1');
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameData, setGameData] = useState<GameState[]>([]);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const availableModels = [
    'PPO_Model_V1',
    'A2C_Model_V1',
    'Custom_Rule_Based_AI',
  ];

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(event.target.value);
  };

  const handleStartGame = async () => {
    console.log(`Starting game with model: ${selectedModel}`);
    setGameStarted(true);
    setIsPlaying(true);
    setCurrentFrame(0);

    try {
      const response = await fetch('/mock_game_data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: GameState[] = await response.json();
      setGameData(data);
    } catch (error) {
      console.error("Failed to load game data:", error);
      setGameStarted(false);
      setIsPlaying(false);
    }
  };

  const handleStopGame = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    if (gameStarted && isPlaying && gameData.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame(prevFrame => {
          if (prevFrame < gameData.length - 1) {
            return prevFrame + 1;
          } else {
            setIsPlaying(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            return prevFrame; // Stay at the last frame
          }
        });
      }, 500); // Advance frame every 500ms
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [gameStarted, isPlaying, gameData]);

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

      {gameStarted && gameData.length > 0 ? (
        <div style={{ 
          border: '2px solid #ccc', 
          width: '800px', 
          height: '450px', 
          margin: '0 auto', 
          position: 'relative', 
          backgroundColor: '#f0f0f0',
          overflow: 'hidden'
        }}>
          {/* Player 1 */}
          <div style={{
            position: 'absolute',
            left: `${(gameData[currentFrame].player1.x + 5) * 10}%`,
            bottom: `${(gameData[currentFrame].player1.y + 5) * 10}%`,
            width: '50px',
            height: '50px',
            backgroundColor: 'blue',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontWeight: 'bold',
            borderRadius: '5px'
          }}>
            P1
          </div>
          <div style={{
            position: 'absolute',
            left: `${(gameData[currentFrame].player1.x + 5) * 10}%`,
            bottom: `${(gameData[currentFrame].player1.y + 5) * 10 + 60}px`,
            width: '50px',
            backgroundColor: 'red',
            height: '5px'
          }}>
            <div style={{ width: `${gameData[currentFrame].player1.hp}%`, backgroundColor: 'green', height: '100%' }}></div>
          </div>
          <div style={{
            position: 'absolute',
            left: `${(gameData[currentFrame].player1.x + 5) * 10}%`,
            bottom: `${(gameData[currentFrame].player1.y + 5) * 10 + 70}px`,
            color: 'blue',
            fontSize: '12px'
          }}>
            {gameData[currentFrame].player1.action}
          </div>

          {/* Player 2 */}
          <div style={{
            position: 'absolute',
            left: `${(gameData[currentFrame].player2.x + 5) * 10}%`,
            bottom: `${(gameData[currentFrame].player2.y + 5) * 10}%`,
            width: '50px',
            height: '50px',
            backgroundColor: 'red',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontWeight: 'bold',
            borderRadius: '5px'
          }}>
            P2
          </div>
          <div style={{
            position: 'absolute',
            left: `${(gameData[currentFrame].player2.x + 5) * 10}%`,
            bottom: `${(gameData[currentFrame].player2.y + 5) * 10 + 60}px`,
            width: '50px',
            backgroundColor: 'red',
            height: '5px'
          }}>
            <div style={{ width: `${gameData[currentFrame].player2.hp}%`, backgroundColor: 'green', height: '100%' }}></div>
          </div>
          <div style={{
            position: 'absolute',
            left: `${(gameData[currentFrame].player2.x + 5) * 10}%`,
            bottom: `${(gameData[currentFrame].player2.y + 5) * 10 + 70}px`,
            color: 'red',
            fontSize: '12px'
          }}>
            {gameData[currentFrame].player2.action}
          </div>

          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            color: '#333',
            fontSize: '14px'
          }}>
            Frame: {gameData[currentFrame].frame} / {gameData.length - 1}
          </div>

          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px'
          }}>
            <button onClick={() => setCurrentFrame(0)} disabled={currentFrame === 0}>Rewind</button>
            <button onClick={() => setIsPlaying(prev => !prev)}>{isPlaying ? 'Pause' : 'Play'}</button>
            <button onClick={() => setCurrentFrame(gameData.length - 1)} disabled={currentFrame === gameData.length - 1}>Fast Forward</button>
          </div>

        </div>
      ) : (
        <p>Select a model and click 'Start Game' to begin the simulation.</p>
      )}
    </div>
  );
};

export default RLDemoPage;
