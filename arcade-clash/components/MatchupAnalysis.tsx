import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import { Character, Screen } from '../types';

// Define an interface for the MatchupResponse from the backend
interface MatchupResponse {
    player1_analysis: string;
    player2_analysis: string;
}

interface MatchupAnalysisProps {
    player1: Character;
    player2: Character;
    onNavigate: (screen: Screen) => void;
}

const MatchupAnalysis: React.FC<MatchupAnalysisProps> = ({ player1, player2, onNavigate }) => {
    const [analysis, setAnalysis] = useState<MatchupResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('http://localhost:8000/api/analysis', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        player1_name: player1.name,
                        player2_name: player2.name,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data: MatchupResponse = await response.json();
                setAnalysis(data);
            } catch (e: any) {
                setError(`Failed to fetch analysis: ${e.message}`);
                console.error("Failed to fetch matchup analysis:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalysis();
    }, [player1, player2]); // Re-fetch if players change

    return (
        <div className="flex flex-col min-h-screen">
            <header className="flex items-center justify-between whitespace-nowrap border-b border-border-color px-6 sm:px-10 py-4 z-10 bg-primary-bg/80 backdrop-blur-sm sticky top-0">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate(Screen.MainMenu)}>
                    <svg className="h-8 w-8 text-highlight-yellow" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.44L19.36 8.35L12 12.26L4.64 8.35L12 4.44ZM4 9.69L11 13.5V19.9L4 16.2V9.69ZM13 19.9V13.5L20 9.69V16.2L13 19.9Z"></path>
                    </svg>
                    <h1 className="text-xl font-bold text-text-light tracking-wider">ARCADE CLASH</h1>
                </div>
                 <nav className="hidden md:flex items-center gap-8">
                    <a className="text-sm font-medium text-text-gray hover:text-highlight-yellow transition-colors" href="#" onClick={(e)=>{e.preventDefault(); onNavigate(Screen.MainMenu)}}>Home</a>
                    <a className="text-sm font-medium text-text-gray hover:text-highlight-yellow transition-colors" href="#" onClick={(e)=>{e.preventDefault(); onNavigate(Screen.CharacterSelect)}}>Characters</a>
                    <a className="text-highlight-yellow text-sm font-bold" href="#">Matchups</a>
                </nav>
            </header>
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Matchup Analysis</h2>
                        <p className="mt-2 text-lg text-text-gray">Analyzing {player1.name} vs. {player2.name}</p>
                    </div>
                    {isLoading && (
                        <div className="text-center text-text-light text-xl">Loading analysis...</div>
                    )}
                    {error && (
                        <div className="text-center text-red-500 text-xl">{error}</div>
                    )}                    {analysis && !isLoading && !error && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            {/* Player 1 Analysis */}
                            <div className="lg:col-span-1 bg-surface-bg p-6 rounded-lg border border-border-color space-y-4">
                                <h3 className="text-2xl font-bold text-team-a">{player1.name}'s Analysis</h3>
                                <div className="space-y-4">
                                    <p className="text-text-gray">{analysis.player1_analysis}</p>
                                </div>
                            </div>

                            {/* VS Image */}
                            <div className="lg:col-span-1 relative rounded-lg overflow-hidden border-2 border-border-color aspect-w-16 aspect-h-9">
                                <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD5Vb0wJ-t_r-1-Q4wO6m9C9q7Z6aJ2j-L_g8n1yM1w7m1n5o9-Q4-Z9Z-y-J-h8n1-J-y-O6Z-r-2-U4-Q4-L8-k-g-9-F4-w-Q-j-h-y-n-m-j-o-Q-h-o-g-h-g-s-p-s-q-t-u-v-w-x-y-z-1-2-3-4-5-6-7-8-9-0")'}}>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end p-4">
                                    <img alt={player1.name} className="h-48 md:h-64 object-contain character-image-left" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB71HcSYa_WTvfEFeASpp-FyRgzEbBTdOuDlohCkMORdsqlYJnRSzQ8cbgZOxp0D5tYUbdwTM1sYVhV0CzWrN5IFh2vCabrQF4YvzM_o9Mp9yArpji-9OvwFX-vZa2iGxZGs6tRYZKc1zSfZ8foo23CDCWMEi7tUMBKLw5G84jv34wOP7sK6FunCoQbocgmSwvdpJL6HrO3bFZNtmLKweFlzxjii7PQz9Cn2PKku7kYGZGo1IH0qWmiAgcjkSXMklgZYwjf7XsLJYI" />
                                    <img alt={player2.name} className="h-48 md:h-64 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnLsOJEzoFAJ0BVJ3Y1gwSGaBDCN8ioiMkQLsT5emGeTaVtQmO4ovUj_wOeIEdCdByhoI9iysBzWLzj5IvwA6sss4YskwQu-JZU7PXIcl4r5QosATImrtyfrnoJIVlj2Rtk_-q-ProsC3POB0nl0QfPpZuayRmISb5aqmy7anAr6hdpJQn-e_COLog0mWQuoK3UxNqFkv3zHh9wY9QVfs1IM4ErgJ7yXiGcLFdxH5ELcg1E9Efy9LGBbj7AGtXJF78ZfWqEFLnN3vE" />
                                </div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-highlight-yellow font-bold text-6xl opacity-80 animate-pulse">VS</div>
                            </div>

                            {/* Player 2 Analysis */}
                            <div className="lg:col-span-1 bg-surface-bg p-6 rounded-lg border border-border-color space-y-4">
                                <h3 className="text-2xl font-bold text-team-b">{player2.name}'s Analysis</h3>
                                <div className="space-y-4">
                                    <p className="text-text-gray">{analysis.player2_analysis}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default MatchupAnalysis;