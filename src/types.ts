import { Ball } from "./entities/ball";

export enum GameState {
    Start = 0,
    Play = 1,
    End = 2
}

export enum PlayerSide {
    Left,
    Right
}

export enum PaddleDirection {
    None = 0,
    Up = 1,
    Down = 2
}

export enum BallState {
    Middle = 0,
    Left = 1,
    Right = 2,
    Moving = 3
}

export const PlayerSpeed = 0.1;
export const BallInitialSpeed = 0.1;

// Shared game state 
export interface IGameState {
    leftPlayerScore: number;
    rightPlayerScore: number;
    gameBall: Ball | undefined;
    goalScored(sideScored: PlayerSide): Promise<void>;
    goToState(state: GameState): Promise<void>;
}

// Interface implemented by all game entities
export interface IGameEntity {
    load(state: IGameState): Promise<void>;
    update(): void;
    reset(): void;
    dispose(): void;
}

// Interface implemented by all game scenes
export interface IGameScene {
    load(state: IGameState): Promise<void>;
    activate(): void;
    deactivate(): void;
    dispose(): void;
    render(): void;
}