import React, { useEffect, useRef, useState } from 'react';
// import './index.css'; // Removed as it's already linked in index.html
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import CharacterSelect from './components/CharacterSelect';
import TrainingMode from './components/TrainingMode';
import DebugPage from './components/DebugPage';
import VSScreen from './components/VSScreen';
import MatchResults from './components/MatchResults';
import MatchupAnalysis from './components/MatchupAnalysis';
import AnalysisMode from './components/AnalysisMode';

import { SignalingClient } from './src/webrtc/signaling';
import { WebRtcClient } from './src/webrtc/client';

// Define screen types
export enum Screen {
  MainMenu,
  Lobby, // Added Lobby screen
  CharacterSelect,
  GameScreen,
  TrainingMode,
  DebugScreen,
  VSScreen,
  MatchResults,
  MatchupAnalysis,
  AnalysisMode,
}

// --- Type Definitions for App.tsx --- //
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

const SIGNALING_SERVER_URL = 'ws://localhost:8765'; // 시그널링 서버 URL

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState(Screen.MainMenu);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const signalingClient = useRef<SignalingClient | null>(null);
  const webRtcClient = useRef<WebRtcClient | null>(null);

  const [lobbyPlayers, setLobbyPlayers] = useState<Player[]>([]);
  const [matchRequest, setMatchRequest] = useState<MatchRequest | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  const [remotePlayerId, setRemotePlayerId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]); // New state for characters

  // --- Fetch Characters from Backend ---
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await fetch('http://localhost:8001/api/characters');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Character[] = await response.json();
        setCharacters(data);
      } catch (error) {
        console.error("Failed to fetch characters:", error);
      }
    };
    fetchCharacters();
  }, []);

  const gameMode = new URLSearchParams(window.location.search).get('mode');

  // --- Signaling Client Initialization and Event Handling ---
  useEffect(() => {
    // Only initialize signaling for non-RL modes
    if (gameMode === 'rl_training') {
      return;
    }

    // Generate a unique player ID if not already set
    if (!playerId) {
      setPlayerId(`player_${Math.random().toString(36).substr(2, 9)}`);
    }

    if (playerId && !signalingClient.current) {
      signalingClient.current = new SignalingClient(SIGNALING_SERVER_URL);

      signalingClient.current.on('registered', () => {
        setConnectionStatus('Connected to Signaling Server');
      });

      signalingClient.current.on('disconnected', () => {
        setConnectionStatus('Disconnected');
        setLobbyPlayers([]);
        setMatchRequest(null);
        setRemotePlayerId(null);
        setSessionId(null);
      });

      signalingClient.current.on('lobbyUpdate', (message: { players: Player[] }) => {
        setLobbyPlayers([...message.players]); // ✅ 새로운 배열로 복사해서 React가 변경 감지
        setConnectionStatus('Connected to Lobby');
      });

      signalingClient.current.on('matchRequestReceived', (message: MatchRequest) => {
        setMatchRequest(message);
        setSessionId(message.sessionId);
      });

      // For the user who sent the request
      signalingClient.current.on('matchRequestAccepted', (message: { accepterId: string, sessionId: string }) => {
        console.log('Match request accepted by', message.accepterId);
        setRemotePlayerId(message.accepterId);
        setSessionId(message.sessionId);
        setMatchRequest(null); // Clear modal

        // The requester is the initiator of the WebRTC connection
        if (playerId && message.accepterId) {
          console.log('Creating WebRTC client as initiator');
          webRtcClient.current = new WebRtcClient({
            signalingClient: signalingClient.current!,
            localPlayerId: playerId,
            remotePlayerId: message.accepterId,
            initiator: true,
          });

          // Listen for local PeerJS ID and send it to remote
          webRtcClient.current.on('peerIdReady', (localPeerJsId: string) => {
            console.log('Local PeerJS ID ready:', localPeerJsId);
            signalingClient.current!.sendPeerId(message.accepterId, localPeerJsId);
          });
        }
      });

      signalingClient.current.on('matchRequestDeclined', () => {
        setMatchRequest(null);
        setSessionId(null);
        alert('Match request declined.');
      });



      signalingClient.current.on('error', (error) => {
        console.error('Signaling error:', error);
        setConnectionStatus('Error');
      });

      // Connect to signaling server
      signalingClient.current.connect(playerId);
    }

    return () => {
      if (signalingClient.current) {
        signalingClient.current.disconnect();
      }
    };
  }, [playerId]);

  // --- WebRTC Client Event Handling ---
  useEffect(() => {
    if (webRtcClient.current) {
      webRtcClient.current.on('connected', () => {
        console.log('WebRTC P2P Connected!');
        setCurrentScreen(Screen.GameScreen);
      });
      
      webRtcClient.current.on('data', (data: any) => {
        console.log('Received data:', data.toString());
        // TODO: Decode with msgpack and update game state
      });

      webRtcClient.current.on('closed', () => {
        console.log('WebRTC connection closed.');
        if (currentScreen === Screen.GameScreen) {
          alert('WebRTC connection lost. Returning to lobby.');
          handleExitGame();
        }
      });

      webRtcClient.current.on('error', (err) => {
        console.error('WebRTC peer error:', err);
        if (currentScreen === Screen.GameScreen) {
          alert('WebRTC connection error. Returning to lobby.');
          handleExitGame();
        }
      });
    }
  }, [webRtcClient.current, currentScreen]);

  // --- Handlers for MainMenu ---
  const handleJoinLobby = async (playerName: string): Promise<boolean> => {
    if (signalingClient.current && playerId) {
      signalingClient.current.joinLobby(playerName);
      setConnectionStatus('Connecting...');
      setCurrentScreen(Screen.Lobby); // Explicitly navigate to Lobby screen after joining
      return true;
    }
    return false;
  };

  const handleRequestMatch = (targetId: string) => {
    if (signalingClient.current) {
      signalingClient.current.requestMatch(targetId);
    }
  };

  // For the user who accepts the request
  const handleAcceptMatch = () => {
    if (signalingClient.current && sessionId && matchRequest && playerId) {
      signalingClient.current.acceptMatch(sessionId);
      
      console.log('Creating WebRTC client as non-initiator');
      // The accepter is the non-initiator
      webRtcClient.current = new WebRtcClient({
        signalingClient: signalingClient.current!,
        localPlayerId: playerId,
        remotePlayerId: matchRequest.requesterId,
        initiator: false,
      });

      // Listen for local PeerJS ID and send it to remote
      webRtcClient.current.on('peerIdReady', (localPeerJsId: string) => {
        console.log('Local PeerJS ID ready:', localPeerJsId);
        signalingClient.current!.sendPeerId(matchRequest.requesterId, localPeerJsId);
      });

      setRemotePlayerId(matchRequest.requesterId);
      setMatchRequest(null);
    }
  };

  const handleDeclineMatch = () => {
    if (signalingClient.current && sessionId) {
      signalingClient.current.declineMatch(sessionId);
      setMatchRequest(null);
    }
  };

  // --- Handler for GameScreen ---
  const handleExitGame = () => {
    if (webRtcClient.current) {
      webRtcClient.current.destroy();
      webRtcClient.current = null; // Clear the ref
    }
    setRemotePlayerId(null);
    setSessionId(null);
    setCurrentScreen(Screen.MainMenu);
    // Re-join lobby after exiting game to update status
    if (signalingClient.current && playerId) {
      signalingClient.current.joinLobby(lobbyPlayers.find(p => p.playerId === playerId)?.playerName || 'Anonymous');
    }
  };

  const navigateTo = (screen: Screen) => {
    console.log(`Navigating from ${Screen[currentScreen]} to ${Screen[screen]}`);
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.MainMenu:
        return (
          <MainMenu
            onNavigate={navigateTo}
            playerId={playerId || ''}
            lobbyPlayers={lobbyPlayers}
            matchRequest={matchRequest}
            connectionStatus={connectionStatus}
            onJoinLobby={handleJoinLobby}
            onRequestMatch={handleRequestMatch}
            onAcceptMatch={handleAcceptMatch}
            onDeclineMatch={handleDeclineMatch}
            currentSubScreen={'main'}
          />
        );
      case Screen.Lobby: // Render MainMenu for both MainMenu and Lobby screens
        return (
          <MainMenu
            onNavigate={navigateTo}
            playerId={playerId || ''}
            lobbyPlayers={lobbyPlayers}
            matchRequest={matchRequest}
            connectionStatus={connectionStatus}
            onJoinLobby={handleJoinLobby}
            onRequestMatch={handleRequestMatch}
            onAcceptMatch={handleAcceptMatch}
            onDeclineMatch={handleDeclineMatch}
            currentSubScreen={'lobby'}
          />
        );
      case Screen.GameScreen:
        if (webRtcClient.current && playerId && remotePlayerId) {
          return (
            <GameScreen
              webRtcClient={webRtcClient.current}
              localPlayerId={playerId}
              remotePlayerId={remotePlayerId}
              onNavigate={handleExitGame} // Use handleExitGame for GameScreen navigation
            />
          );
        } else {
          // Fallback if WebRTC client or player IDs are not set (shouldn't happen if flow is correct)
          return <MainMenu onNavigate={navigateTo} />;
        }
      case Screen.CharacterSelect:
        return <CharacterSelect onNavigate={navigateTo} characters={characters} />;
      case Screen.TrainingMode:
        return <TrainingMode onNavigate={navigateTo} />;
      case Screen.DebugScreen:
        return <DebugPage onNavigate={navigateTo} />;
      case Screen.VSScreen:
        return <VSScreen onNavigate={navigateTo} />;
      case Screen.MatchResults:
        return <MatchResults onNavigate={navigateTo} />;
      case Screen.MatchupAnalysis:
        return <MatchupAnalysis onNavigate={navigateTo} />;
      case Screen.AnalysisMode:
        return <AnalysisMode onNavigate={navigateTo} />;
      default:
        return <MainMenu onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="app-container">
      {renderScreen()}
    </div>
  );
};

export default App;
