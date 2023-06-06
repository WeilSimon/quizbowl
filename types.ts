export interface GameStateData {
    team1: TeamData;
    team2: TeamData;
    teamNull: {[index:string]: PlayerData};
    buzzedList: {[index:string]: PlayerData};
}

export interface PlayerData {
    points: number;
    timesBuzzed: number;
    negFives: number;
    power: number;
    id: string;
    name: string;
    isLocked: boolean;
    isBuzzed: boolean;
    roomId: number;
    teamNumber: 0|1|2;
    latency:number;
}

export interface TeamData {
    teamNumber:0|1|2;
    points: number;
    playerList: {[index:string]: PlayerData};
    isLocked: boolean;
}

export type TeamEntry = {key:string, name:string, team:number}

export type BuzzerState = "clear"|"locked"|"buzzed"

export interface Settings{
    shouldLock:boolean;
    autoClear:boolean
}