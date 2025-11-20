import React, { useState } from 'react';
import { Screen } from '../types';

// --- Type Definitions (Moved to App.tsx or global types) ---
// interface Player {
//     playerId: string;
//     playerName: string;
//     status: 'available' | 'in_match';
// }

// interface MatchRequest {
//     requesterId: string;
//     requesterName: string;
//     sessionId: string;
// }

interface MainMenuProps {
  onNavigate: (screen: Screen) => void;
  playerId?: string;
  lobbyPlayers?: any[]; // Use 'any' or define a global Player type
  matchRequest?: any | null; // Use 'any' or define a global MatchRequest type
  connectionStatus?: string;
  onJoinLobby?: (playerName: string) => Promise<boolean>;
  onRequestMatch?: (targetId: string) => void;
  onAcceptMatch?: () => void;
  onDeclineMatch?: () => void;
  currentSubScreen?: 'main' | 'lobby'; // Added prop
}

// --- Helper Components ---

const PrimaryButton: React.FC<{onClick: () => void, children: React.ReactNode, disabled?: boolean}> = ({ onClick, children, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="w-full py-3 px-6 text-lg font-semibold text-primary-bg bg-highlight-yellow rounded-lg transition-transform duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-highlight-yellow/50 disabled:bg-gray-500 disabled:cursor-not-allowed"
    >
        {children}
    </button>
);

const SecondaryButton: React.FC<{onClick: () => void, children: React.ReactNode}> = ({ onClick, children }) => (
     <button
        onClick={onClick}
        className="w-full py-3 px-6 text-lg font-semibold text-text-light bg-transparent border-2 border-border-color rounded-lg transition-all duration-200 ease-in-out hover:bg-surface-bg hover:border-highlight-yellow focus:outline-none focus:ring-4 focus:ring-highlight-yellow/50"
    >
        {children}
    </button>
);

const InputField: React.FC<{value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string}> = ({ value, onChange, placeholder }) => (
    <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-3 text-lg text-text-light bg-surface-bg border-2 border-border-color rounded-lg focus:outline-none focus:ring-4 focus:ring-highlight-yellow/50 focus:border-highlight-yellow"
    />
);

// --- MainMenu Component ---

export default function MainMenu(props: MainMenuProps) {
    const {
        onNavigate,
        playerId = '',
        lobbyPlayers = [],
        matchRequest = null,
        connectionStatus = 'Disconnected',
        onJoinLobby = async () => false,
        onRequestMatch = () => {},
        onAcceptMatch = () => {},
        onDeclineMatch = () => {},
        currentSubScreen = 'main'
    } = props;

    const [playerName, setPlayerName] = useState(''); // Keep local for input field

    const handleJoinLobbyClick = async () => {
        const success = await onJoinLobby(playerName);
        if (success) {
            // UI will be updated by connectionStatus prop
            // No need to set uiScreen here, App.tsx handles navigation
        }
    };

    const renderMainMenu = () => (
        <>
            <h1 className="text-6xl font-bold text-text-light uppercase tracking-widest mb-4">
                Arcade <span className="text-highlight-yellow">Clash</span>
            </h1>
            <p className="text-text-gray mb-12">The Ultimate Fighting Experience</p>
            <nav className="flex flex-col items-center space-y-4">
                <PrimaryButton onClick={() => onNavigate(Screen.MainMenu)}>
                    Online Lobby
                </PrimaryButton>
                <SecondaryButton onClick={() => onNavigate(Screen.CharacterSelect)}>
                    Offline Mode
                </SecondaryButton>
                <SecondaryButton onClick={() => onNavigate(Screen.TrainingMode)}>
                    Training Mode
                </SecondaryButton>
                <SecondaryButton onClick={() => onNavigate(Screen.DebugScreen)}>
                    Debug Screen
                </SecondaryButton>
                <SecondaryButton onClick={() => onNavigate(Screen.RLDemo)}>
                    RL Demo
                </SecondaryButton>
                <SecondaryButton onClick={() => onNavigate(Screen.RLDashboard)}>
                    RL Dashboard
                </SecondaryButton>
            </nav>
        </>
    );

    const renderLobby = () => (
        
        <div className="w-full max-w-md">
            <h2 className="text-4xl font-bold text-text-light mb-6">Online Lobby</h2>
            <p className="text-text-gray mb-4">Status: {connectionStatus}</p>
            
            {connectionStatus === 'Connected to Lobby' ? (
                <div>
                    <h3 className="text-2xl text-highlight-yellow mb-4">Available Players</h3>
                    <ul className="space-y-3 max-h-60 overflow-y-auto p-2 bg-surface-bg rounded-lg">
                        {lobbyPlayers.filter(p => p.playerId !== playerId).length > 0 ? (
                            lobbyPlayers.filter(p => p.playerId !== playerId).map(player => (
                                <li key={player.playerId} className="flex items-center justify-between p-3 bg-primary-bg rounded-md">
                                    <span className="text-text-light font-semibold">{player.playerName} ({player.status}) - ID: {player.playerId}</span>
                                    <button 
                                        onClick={() => onRequestMatch(player.playerId)}
                                        disabled={player.status !== 'available'}
                                        className="px-4 py-1 text-sm font-bold text-primary-bg bg-highlight-yellow rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed"
                                    >
                                        Request Match
                                    </button>
                                </li>
                            ))
                        ) : (
                            <p className="text-text-gray text-center p-4">No other players in the lobby.</p>
                        )}
                    </ul>
                </div>
            ) : (
                <div className="space-y-4">
                    <InputField
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Enter your name"
                    />
                    <PrimaryButton onClick={handleJoinLobbyClick} disabled={!playerName.trim() || connectionStatus === 'Connecting...'}>
                        {connectionStatus === 'Connecting...' ? 'Connecting...' : 'Join Lobby'}
                    </PrimaryButton>
                </div>
            )}
             <button onClick={() => onNavigate(Screen.MainMenu)} className="mt-6 text-highlight-yellow">
                &larr; Back to Main Menu
            </button>
        </div>
    );

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary-bg/80 backdrop-blur-sm"></div>
            <main className="relative z-10 w-full max-w-sm text-center">
                {currentSubScreen === 'main' ? renderMainMenu() : renderLobby()}
            </main>

            {/* Match Request Modal */}
            {matchRequest && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-surface-bg p-8 rounded-lg shadow-lg text-center">
                        <h3 className="text-2xl font-bold text-text-light mb-4">Match Request</h3>
                        <p className="text-text-gray mb-6 text-lg">
                            <span className="font-bold text-highlight-yellow">{matchRequest.requesterName}</span> wants to fight!
                        </p>
                        <div className="flex justify-center space-x-4">
                            <button onClick={onAcceptMatch} className="px-8 py-3 text-lg font-semibold text-primary-bg bg-green-500 rounded-lg hover:scale-105">
                                Accept
                            </button>
                            <button onClick={onDeclineMatch} className="px-8 py-3 text-lg font-semibold text-primary-bg bg-red-500 rounded-lg hover:scale-105">
                                Decline
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}