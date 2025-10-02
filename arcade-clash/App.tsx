import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Screen, Character } from './types';
import MainMenu from './components/MainMenu';
import CharacterSelect from './components/CharacterSelect';
import VSScreen from './components/VSScreen';
import HUD from './components/HUD';
import MatchResults from './components/MatchResults';
import MoveList from './components/MoveList';
import MatchupAnalysis from './components/MatchupAnalysis';
import AnalysisMode from './components/AnalysisMode';
import TrainingMode from './components/TrainingMode';
import DebugPage from './components/DebugPage';
import GameScreen from './components/GameScreen';
import { SignalingClient } from './src/webrtc/signaling';
import { WebRtcClient } from './src/webrtc/client';

// --- Singleton Client Instance ---
const signalingClient = new SignalingClient('ws://localhost:8765');

// --- Type Definitions ---
interface Player {
    playerId: string;
    playerName: string;
    status: 'available' | 'in_match';
}

interface MatchRequest {
    requesterId: string;
    requesterName: string;
    sessionId: string;
}

export default function App() {
    // Screen and Character State
    const [screen, setScreen] = useState<Screen>(Screen.MainMenu);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [player1, setPlayer1] = useState<Character | null>(null);
    const [player2, setPlayer2] = useState<Character | null>(null);
    const [winner, setWinner] = useState<Character | null>(null);

    // Online State
    const [playerId, setPlayerId] = useState('');
    const [lobbyPlayers, setLobbyPlayers] = useState<Player[]>([]);
    const [matchRequest, setMatchRequest] = useState<MatchRequest | null>(null);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [remotePlayerId, setRemotePlayerId] = useState<string | null>(null);

    const webRtcClient = useRef<WebRtcClient | null>(null);

    // --- Effects ---

    // Fetch initial character data
    useEffect(() => {
        fetch('http://localhost:8001/api/characters')
            .then(res => res.json())
            .then((data: Character[]) => {
                setCharacters(data);
                if (data.length > 1) {
                    setPlayer1(data[0]);
                    setPlayer2(data[1]);
                }
            })
            .catch(console.error);
    }, []);

    // Initialize signaling client listeners
    useEffect(() => {
        console.log("App.tsx: Attaching listeners");
        const newPlayerId = `player_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        setPlayerId(newPlayerId);

        const sc = signalingClient;

        sc.on('lobbyUpdate', (message) => setLobbyPlayers(message.players));
        sc.on('matchRequestReceived', (request) => setMatchRequest(request));
        sc.on('disconnected', () => setConnectionStatus('Disconnected'));

        sc.on('matchRequestAccepted', (message) => {
            console.log('Match accepted by', message.accepterId);
            setConnectionStatus('Connecting...');
            setRemotePlayerId(message.accepterId);

            const rtc = new WebRtcClient({
                signalingClient: sc,
                localPlayerId: newPlayerId,
                remotePlayerId: message.accepterId,
            });
            webRtcClient.current = rtc;
            setupWebRtcListeners(rtc);
            rtc.startNegotiation();
        });

        // No cleanup needed as the client is a singleton
    }, []);

    // --- Handlers ---

    const setupWebRtcListeners = (rtc: WebRtcClient) => {
        rtc.on('connected', () => {
            setConnectionStatus('Connected!');
            setTimeout(() => handleNavigate(Screen.VSScreen), 500);
        });

        rtc.on('connectionStateChange', (state) => {
            if (state === 'failed' || state === 'disconnected' || state === 'closed') {
                setConnectionStatus('Connection Failed');
                webRtcClient.current?.close();
                webRtcClient.current = null;
            }
        });
    };

    const handleNavigate = useCallback((newScreen: Screen) => {
        setScreen(newScreen);
    }, []);

    const handleCharacterSelection = useCallback((p1: Character, p2: Character) => {
        setPlayer1(p1);
        setPlayer2(p2);
        setScreen(Screen.VSScreen);
    }, []);

    const handleMatchEnd = useCallback((winner: Character | null) => {
        setWinner(winner);
        setScreen(Screen.MatchResults);
    }, []);

    const handleJoinLobby = async (playerName: string) => {
        if (!playerName.trim()) return false;
        try {
            console.log('handleJoinLobby: Attempting to connect...');
            setConnectionStatus('Connecting...');
            await signalingClient.connect(playerId);

            console.log('handleJoinLobby: Connection successful. Joining lobby...');
            signalingClient.joinLobby(playerName);
            setConnectionStatus('Connected to Lobby');
            return true;
        } catch (error) {
            console.error("handleJoinLobby: Failed to connect or join lobby.", error);
            setConnectionStatus('Connection Failed');
            return false;
        }
    };

    const handleRequestMatch = (targetId: string) => {
        signalingClient.requestMatch(targetId);
        setConnectionStatus(`Match requested to ${targetId}`);
    };

    const handleAcceptMatch = () => {
        if (matchRequest) {
            signalingClient.acceptMatch(matchRequest.sessionId);
            setConnectionStatus('Accepting match...');
            setRemotePlayerId(matchRequest.requesterId);

            const rtc = new WebRtcClient({
                signalingClient: signalingClient,
                localPlayerId: playerId,
                remotePlayerId: matchRequest.requesterId,
            });
            webRtcClient.current = rtc;
            setupWebRtcListeners(rtc);
            
            setMatchRequest(null);
        }
    };

    const handleDeclineMatch = () => {
        if (matchRequest) {
            signalingClient.declineMatch(matchRequest.sessionId);
            setMatchRequest(null);
        }
    };

    // --- Screen Rendering ---

    const renderScreen = () => {
        switch (screen) {
            case Screen.MainMenu:
                return <MainMenu 
                    onNavigate={handleNavigate} 
                    playerId={playerId}
                    lobbyPlayers={lobbyPlayers}
                    matchRequest={matchRequest}
                    connectionStatus={connectionStatus}
                    onJoinLobby={handleJoinLobby}
                    onRequestMatch={handleRequestMatch}
                    onAcceptMatch={handleAcceptMatch}
                    onDeclineMatch={handleDeclineMatch}
                />;
            case Screen.VSScreen:
                if (!player1 || !player2) {
                    handleNavigate(Screen.CharacterSelect);
                    return null;
                }
                return <VSScreen player1={player1} player2={player2} onNavigate={handleNavigate} />;
            case Screen.GameScreen:
                if (!webRtcClient.current || !remotePlayerId) {
                    handleNavigate(Screen.MainMenu);
                    return <p>Connection error. Returning to main menu...</p>;
                }
                return <GameScreen 
                    webRtcClient={webRtcClient.current} 
                    localPlayerId={playerId} 
                    remotePlayerId={remotePlayerId} 
                    onNavigate={handleNavigate} 
                />;
            case Screen.CharacterSelect:
                return <CharacterSelect characters={characters} onSelectionComplete={handleCharacterSelection} onNavigate={handleNavigate} />;
            case Screen.HUD:
                 if (!player1 || !player2) {
                    handleNavigate(Screen.CharacterSelect);
                    return null;
                }
                return <HUD player1={player1} player2={player2} onMatchEnd={handleMatchEnd} onNavigate={handleNavigate} />;
            case Screen.MatchResults:
                if (!player1 || !player2) {
                    handleNavigate(Screen.CharacterSelect);
                    return null;
                }
                const loser = winner?.id === player1.id ? player2 : player1;
                return <MatchResults winner={winner} loser={loser} onNavigate={handleNavigate} />;
            case Screen.MoveList:
                 if (!player1) {
                    handleNavigate(Screen.CharacterSelect);
                    return null;
                }
                return <MoveList character={player1} onNavigate={handleNavigate} />;
            case Screen.MatchupAnalysis:
                if (!player1 || !player2) {
                    handleNavigate(Screen.CharacterSelect);
                    return null;
                }
                return <MatchupAnalysis player1={player1} player2={player2} onNavigate={handleNavigate} />;
            case Screen.AnalysisMode:
                 if (!player1) {
                    handleNavigate(Screen.CharacterSelect);
                    return null;
                }
                return <AnalysisMode character={player1} onNavigate={handleNavigate} />;
            case Screen.TrainingMode:
                if (!player1 || !player2) {
                    handleNavigate(Screen.CharacterSelect);
                    return null;
                }
                return <TrainingMode player1={player1} player2={player2} onNavigate={handleNavigate} />;
            case Screen.DebugScreen:
                return <DebugPage onNavigate={handleNavigate} />;
            default:
                return <MainMenu 
                    onNavigate={handleNavigate} 
                    playerId={playerId}
                    lobbyPlayers={lobbyPlayers}
                    matchRequest={matchRequest}
                    connectionStatus={connectionStatus}
                    onJoinLobby={handleJoinLobby}
                    onRequestMatch={handleRequestMatch}
                    onAcceptMatch={handleAcceptMatch}
                    onDeclineMatch={handleDeclineMatch}
                />;
        }
    };

    return (
        <div className="min-h-screen w-full bg-primary-bg">
            {characters.length > 0 ? renderScreen() : <div>Loading...</div>}
        </div>
    );
}