
import React, { useState, useCallback, useEffect } from 'react';
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


const App: React.FC = () => {
    const [screen, setScreen] = useState<Screen>(Screen.MainMenu);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [player1, setPlayer1] = useState<Character | null>(null);
    const [player2, setPlayer2] = useState<Character | null>(null);
    const [winner, setWinner] = useState<Character | null>(null);

    useEffect(() => {
        fetch('http://localhost:8000/api/characters')
            .then(res => res.json())
            .then((data: Character[]) => {
                setCharacters(data);
                // Set default players after fetching characters
                if (data.length > 2) {
                    setPlayer1(data[0]);
                    setPlayer2(data[1]);
                }
            })
            .catch(console.error);
    }, []);

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
    
    const renderScreen = () => {
        switch (screen) {
            case Screen.MainMenu:
                return <MainMenu onNavigate={handleNavigate} />;
            case Screen.CharacterSelect:
                return <CharacterSelect characters={characters} onSelectionComplete={handleCharacterSelection} onNavigate={handleNavigate} />;
            case Screen.VSScreen:
                if (!player1 || !player2) {
                    handleNavigate(Screen.CharacterSelect);
                    return null;
                }
                return <VSScreen player1={player1} player2={player2} onNavigate={handleNavigate} />;
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
            default:
                return <MainMenu onNavigate={handleNavigate} />;
        }
    };

    return (
        <div className="min-h-screen w-full bg-primary-bg">
            {characters.length > 0 ? renderScreen() : <div>Loading...</div>}
        </div>
    );
};

export default App;
