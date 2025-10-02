import React, { useEffect, useRef, useState } from 'react';
import { WebRtcClient } from '../src/webrtc/client';
import { GameEngine } from '../src/shared_game_logic/engine';
import { GameState, CharacterState } from '../src/shared_game_logic/game_state';
import { PlayerInput } from '../src/shared_game_logic/input_data';
import { FixedPoint } from '../src/shared_game_logic/fixed_point';
import { Screen } from '../types';

interface GameScreenProps {
    webRtcClient: WebRtcClient;
    localPlayerId: string;
    remotePlayerId: string;
    onNavigate: (screen: Screen) => void;
}

const createInitialGameState = (p1Id: string, p2Id: string): GameState => {
    return {
        frame: 0,
        randomSeed: 12345,
        player1: {
            id: p1Id,
            position: { x: FixedPoint.fromFloat(-5), y: FixedPoint.fromFloat(0) },
            velocity: { x: FixedPoint.fromFloat(0), y: FixedPoint.fromFloat(0) },
            health: FixedPoint.fromInt(100),
            isGrounded: true,
        },
        player2: {
            id: p2Id,
            position: { x: FixedPoint.fromFloat(5), y: FixedPoint.fromFloat(0) },
            velocity: { x: FixedPoint.fromFloat(0), y: FixedPoint.fromFloat(0) },
            health: FixedPoint.fromInt(100),
            isGrounded: true,
        },
    };
};

const GameScreen: React.FC<GameScreenProps> = ({ webRtcClient, localPlayerId, remotePlayerId, onNavigate }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameEngine = useRef<GameEngine | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [keys, setKeys] = useState<Record<string, boolean>>({});

    // Initialize Game Engine
    useEffect(() => {
        const initialState = createInitialGameState(localPlayerId, remotePlayerId);
        gameEngine.current = new GameEngine(
            initialState,
            FixedPoint.fromFloat(1 / 60),
            localPlayerId,
            remotePlayerId
        );
        setGameState(initialState);
    }, [localPlayerId, remotePlayerId]);

    // Keyboard input handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }));
        const handleKeyUp = (e: KeyboardEvent) => setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false }));

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // WebRTC message handler
    useEffect(() => {
        const handleMessage = ({ channel, data }: { channel: string, data: any }) => {
            if (channel === 'game_input' && gameEngine.current) {
                const remoteInput: PlayerInput = JSON.parse(data);
                gameEngine.current.receiveRemoteInput(remoteInput);
            }
        };

        webRtcClient.on('dataChannelMessage', handleMessage);
        return () => {
            webRtcClient.off('dataChannelMessage', handleMessage);
        };
    }, [webRtcClient]);

    // Main game loop
    useEffect(() => {
        if (!gameEngine.current) return;

        let animationFrameId: number;

        const loop = () => {
            const engine = gameEngine.current!;

            // 1. Create local input
            const localInput: PlayerInput = {
                frame: engine.getGameState().frame + 1,
                playerId: localPlayerId,
                inputs: {
                    left: keys['a'] || false,
                    right: keys['d'] || false,
                    jump: keys['w'] || false,
                    attack: keys[' '] || false, // Space bar for attack
                },
            };

            // 2. Update engine and send input
            engine.update(localInput);
            webRtcClient.sendData('game_input', JSON.stringify(localInput));

            // 3. Get new state and render
            const newState = engine.getGameState();
            setGameState(newState);
            renderGame(newState);

            animationFrameId = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [keys, webRtcClient, localPlayerId]);

    const renderGame = (state: GameState | null) => {
        const canvas = canvasRef.current;
        if (!canvas || !state) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Simple rendering (boxes for players)
        const renderPlayer = (player: CharacterState, color: string) => {
            const canvasX = canvas.width / 2 + player.position.x.toFloat() * 50;
            const canvasY = canvas.height - 50 - player.position.y.toFloat() * 50;
            ctx.fillStyle = color;
            ctx.fillRect(canvasX - 25, canvasY - 50, 50, 50);
        };

        renderPlayer(state.player1, 'blue');
        renderPlayer(state.player2, 'red');
    };

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-primary-bg">
            <h1 className="text-white text-2xl mb-4">Game In Progress</h1>
            <canvas ref={canvasRef} width="800" height="400" className="bg-gray-800" />
            <div className="text-white mt-4">
                <p>P1 X: {gameState?.player1.position.x.toFloat().toFixed(2)} | P2 X: {gameState?.player2.position.x.toFloat().toFixed(2)}</p>
                <p>Frame: {gameState?.frame}</p>
            </div>
            <button onClick={() => onNavigate(Screen.MainMenu)} className="mt-4 text-highlight-yellow">Exit Game</button>
        </div>
    );
};

export default GameScreen;
