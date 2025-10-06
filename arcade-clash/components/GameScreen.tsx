import React, { useEffect, useMemo, useRef, useState } from 'react';
import { WebRtcClient } from '../src/webrtc/client';
import { GameEngine } from '../src/shared_game_logic/engine';
import { GameState, CharacterState } from '../src/shared_game_logic/game_state';
import { PlayerInput } from '../src/shared_game_logic/input_data';
import { FixedPoint } from '../src/shared_game_logic/fixed_point';
import RLAgentController from '@/components/RLAgentController';

interface GameScreenProps {
    webRtcClient?: WebRtcClient; // Made optional for RL mode
    localPlayerId: string;
    remotePlayerId: string;
    onNavigate: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ webRtcClient, localPlayerId, remotePlayerId, onNavigate }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameEngine = useRef<GameEngine | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [keys, setKeys] = useState<Record<string, boolean>>({});

    // --- RL Mode Detection ---
    const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
    const isRLMode = useMemo(() => urlParams.get('mode') === 'rl_training', [urlParams]);
    const backendPeerId = useMemo(() => urlParams.get('backend_peer_id'), [urlParams]);

    // Helper to create initial game state
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
                action: 'idle',
                actionFrame: 0,
                hitbox: null,
                hurtbox: { x: FixedPoint.fromFloat(-0.5), y: FixedPoint.fromFloat(0), width: FixedPoint.fromFloat(1), height: FixedPoint.fromFloat(1) },
            },
            player2: {
                id: p2Id,
                position: { x: FixedPoint.fromFloat(5), y: FixedPoint.fromFloat(0) },
                velocity: { x: FixedPoint.fromFloat(0), y: FixedPoint.fromFloat(0) },
                health: FixedPoint.fromInt(100),
                isGrounded: true,
                action: 'idle',
                actionFrame: 0,
                hitbox: null,
                hurtbox: { x: FixedPoint.fromFloat(-0.5), y: FixedPoint.fromFloat(0), width: FixedPoint.fromFloat(1), height: FixedPoint.fromFloat(1) },
            },
        };
    };

    // Initialize Game Engine
    useEffect(() => {
        const p1 = isRLMode ? 'ai_player_1' : localPlayerId;
        const p2 = isRLMode ? 'ai_player_2' : remotePlayerId;
        const initialState = createInitialGameState(p1, p2);
        gameEngine.current = new GameEngine(
            initialState,
            FixedPoint.fromFloat(1 / 60),
            p1,
            p2,
            p1 // aiPlayerId: The player controlled by the AI (p1 in RL mode)
        );
        setGameState(initialState);
    }, [isRLMode, localPlayerId, remotePlayerId]);

    // Keyboard input handler (only for non-RL mode)
    useEffect(() => {
        if (isRLMode) return;

        const handleKeyDown = (e: KeyboardEvent) => setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }));
        const handleKeyUp = (e: KeyboardEvent) => setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false }));

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isRLMode]);

    // WebRTC message handler (only for non-RL mode)
    useEffect(() => {
        if (isRLMode) return;

        const handleMessage = ({ channel, data }: { channel: string, data: any }) => {
            if (channel === 'game_input' && gameEngine.current) {
                const remoteInput: PlayerInput = JSON.parse(data);
                gameEngine.current.receiveRemoteInput(remoteInput);
            }
        };

        webRtcClient.on('data', handleMessage);
        return () => {
            webRtcClient.off('dataChannelMessage', handleMessage);
        };
    }, [isRLMode, webRtcClient]);

    // Main game loop
    useEffect(() => {
        if (!gameEngine.current) return;

        let animationFrameId: number;

        const loop = () => {
            const engine = gameEngine.current!;

            // In non-RL mode, process local input and send it
            if (!isRLMode) {
                const localInput: PlayerInput = {
                    frame: engine.getGameState().frame + 1,
                    playerId: localPlayerId,
                    inputs: {
                        left: keys['a'] || false,
                        right: keys['d'] || false,
                        jump: keys['w'] || false,
                        attack: keys[' '] || false, // Space bar for attack
                        guard: keys['s'] || false, // 's' key for guarding
                    },
                };
                engine.update(localInput);
                webRtcClient.send(JSON.stringify(localInput));
            } else {
                // In RL mode, the engine is updated by RLAgentController.
                // We just need to advance the frame and render.
                // TODO: This assumes RLAgentController's applyExternalAction ticks the engine.
                // A better approach might be a separate engine.tick() method.
            }

            const newState = engine.getGameState();
            setGameState(newState);
            renderGame(newState);

            animationFrameId = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isRLMode, keys, webRtcClient, localPlayerId]);

    const renderGame = (state: GameState | null) => {
        const canvas = canvasRef.current;
        if (!canvas || !state) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const SCALE = 50;

        // Clear canvas
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // --- Health Bars ---
        const BAR_WIDTH = canvas.width / 2 - 40;
        // P1 Health
        ctx.fillStyle = '#555';
        ctx.fillRect(20, 20, BAR_WIDTH, 30);
        ctx.fillStyle = 'red';
        ctx.fillRect(20, 20, BAR_WIDTH * state.player1.health.toFloat() / 100, 30);
        // P2 Health
        ctx.fillStyle = '#555';
        ctx.fillRect(canvas.width / 2 + 20, 20, BAR_WIDTH, 30);
        ctx.fillStyle = 'red';
        ctx.fillRect(canvas.width / 2 + 20 + (BAR_WIDTH - BAR_WIDTH * state.player2.health.toFloat() / 100), 20, BAR_WIDTH * state.player2.health.toFloat() / 100, 30);


        // --- Player Rendering ---
        const renderPlayer = (player: CharacterState, defaultColor: string) => {
            const canvasX = (p: FixedPoint) => canvas.width / 2 + p.toFloat() * SCALE;
            const canvasY = (p: FixedPoint) => canvas.height - 50 - p.toFloat() * SCALE;

            const playerX = canvasX(player.position.x);
            const playerY = canvasY(player.position.y);

            // Draw Player Body
            if (player.action === 'hitstun') {
                ctx.fillStyle = 'yellow';
            } else if (player.action === 'guarding') {
                ctx.fillStyle = 'cyan';
            } else {
                ctx.fillStyle = defaultColor;
            }
            ctx.fillRect(playerX - 25, playerY - 50, 50, 50);

            // Draw Hurtbox (for debugging)
            const hurtbox = player.hurtbox;
            const hurtboxX = canvasX(player.position.x.add(hurtbox.x));
            const hurtboxY = canvasY(player.position.y.add(hurtbox.y));
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'; // Green transparent
            ctx.fillRect(hurtboxX, hurtboxY, hurtbox.width.toFloat() * SCALE, hurtbox.height.toFloat() * SCALE);

            // Draw Hitbox (if active)
            if (player.hitbox && player.hitbox.active) {
                const hitbox = player.hitbox;
                const hitboxX = canvasX(player.position.x.add(hitbox.x));
                const hitboxY = canvasY(player.position.y.add(hitbox.y));
                ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Red transparent
                ctx.fillRect(hitboxX, hitboxY, hitbox.width.toFloat() * SCALE, hitbox.height.toFloat() * SCALE);
            }
        };

        renderPlayer(state.player1, 'blue');
        renderPlayer(state.player2, 'red');
    };

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-primary-bg">
            {/* Conditionally render the RL Controller if in RL mode and peer ID is provided */}
            {isRLMode && backendPeerId && <RLAgentController backendPeerId={backendPeerId} gameEngine={gameEngine} />}

            <h1 className="text-white text-2xl mb-4">
                {isRLMode ? "RL Training In Progress" : "Game In Progress"}
            </h1>
            <canvas ref={canvasRef} width="800" height="400" className="bg-gray-800" />
            <div className="text-white mt-4">
                <p>P1 X: {gameState?.player1.position.x.toFloat().toFixed(2)} | P2 X: {gameState?.player2.position.x.toFloat().toFixed(2)}</p>
                <p>Frame: {gameState?.frame}</p>
                {isRLMode && <p className="text-green-400">AI AGENT CONNECTED</p>}
            </div>
            <button onClick={onNavigate} className="mt-4 text-highlight-yellow">Exit Game</button>
        </div>
    );
};

export default GameScreen;