import React, { useEffect } from 'react';
import { Character, Screen } from '../types';

interface VSScreenProps {
    player1: Character;
    player2: Character;
    onNavigate: (screen: Screen) => void;
}

const VSScreen: React.FC<VSScreenProps> = ({ player1, player2, onNavigate }) => {

    useEffect(() => {
        const timer = setTimeout(() => {
            onNavigate(Screen.HUD);
        }, 4000);

        return () => clearTimeout(timer);
    }, [onNavigate]);

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-primary-bg">
             <div className="absolute inset-0 z-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuD0q7ETiHtDZbMyH71MRO0nwvqbH1QcaJdYO2Yi88gP7ZYx7fnmDdjGFluUFiniYQ1iOPaRhFUOyf6I3WPXO7Fje5G51SbkbAK2VuVanYYneM-mqWK1CyHzQzCsysBkcY2WiJgCvxawa6bycC3AREbB-uCtYgrDMbWfxAXqSm8PIsJeD8F40VNsbRbngehL6vGfwQ7x07IOSEJdEhnxsaCDBXVjA-Dp5i89AoKor3lygSZJj27WTuAeQUJ2mHSEvCGvV2JWoIqIRAeS")` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-primary-bg via-primary-bg/50 to-transparent"></div>
            </div>
            <div className="relative z-10 flex h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8">
                <div className="grid w-full max-w-7xl grid-cols-1 items-center gap-8 md:grid-cols-5">
                    {/* Player 1 */}
                    <div className="relative col-span-1 flex flex-col items-center text-center md:col-span-2 md:items-start md:text-left">
                        <div className="relative w-full aspect-[4/5] max-w-sm overflow-hidden rounded-lg border-4 border-team-a shadow-glow-blue">
                            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url("${player1.vsImage}")` }}></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-primary-bg/80 via-transparent"></div>
                        </div>
                        <div className="mt-4 w-full max-w-sm rounded-lg bg-surface-bg/80 p-4 backdrop-blur-sm border border-border-color">
                            <h2 className="text-3xl font-bold uppercase tracking-wider text-text-light">{player1.name}</h2>
                            <p className="text-lg font-medium text-team-a">Player 1</p>
                        </div>
                    </div>
                    
                    {/* VS */}
                    <div className="col-span-1 flex justify-center animate-pulse">
                        <h1 className="font-display text-7xl font-black italic text-highlight-yellow drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] md:text-9xl">VS</h1>
                    </div>

                    {/* Player 2 */}
                    <div className="relative col-span-1 flex flex-col items-center text-center md:col-span-2 md:items-end md:text-right">
                        <div className="relative w-full aspect-[4/5] max-w-sm overflow-hidden rounded-lg border-4 border-team-b shadow-glow-red">
                            <div className="absolute inset-0 scale-x-[-1] bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url("${player2.vsImage}")` }}></div>
                             <div className="absolute inset-0 bg-gradient-to-t from-primary-bg/80 via-transparent"></div>
                        </div>
                        <div className="mt-4 w-full max-w-sm rounded-lg bg-surface-bg/80 p-4 backdrop-blur-sm border border-border-color">
                            <h2 className="text-3xl font-bold uppercase tracking-wider text-text-light">{player2.name}</h2>
                            <p className="text-lg font-medium text-team-b">Player 2</p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 transform text-center">
                    <p className="text-xl font-semibold tracking-widest text-text-gray">GET READY</p>
                    <div className="mt-2 h-1 w-32 animate-pulse rounded-full bg-highlight-yellow"></div>
                </div>
            </div>
        </div>
    );
};

export default VSScreen;