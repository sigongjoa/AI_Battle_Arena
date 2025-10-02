
export enum Screen {
    MainMenu,
    CharacterSelect,
    VSScreen,
    HUD,
    MatchResults,
    MoveList,
    MatchupAnalysis,
    AnalysisMode,
    TrainingMode,
    DebugScreen,
    GameScreen, // Added for the main online game view
}

export interface Character {
    id: number;
    name: string;
    description: string;
    image: string; // For sprite sheet
    profileImage: string;
    vsImage: string;
    thumbnail: string; // For character select screen
    color: string;
}

export interface Move {
    name: string;
    description: string;
    input: string;
    frameData: string;
}
