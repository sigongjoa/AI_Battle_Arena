
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
}

export interface Character {
    id: number;
    name: string;
    description: string;
    image: string;
    profileImage: string;
    vsImage: string;
    color: string;
}

export interface Move {
    name: string;
    description: string;
    input: string;
    frameData: string;
}
