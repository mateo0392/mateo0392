
export interface Position {
  x: number;
  y: number;
}

export interface Entity extends Position {
  radius: number;
  speed: number;
  angle: number;
  isStunned?: boolean;
  stunTimer?: number;
}

export interface Snake extends Entity {
  health: number;
  maxHealth: number;
  segments: Position[];
}

export interface Banana extends Position {
  id: string;
}

export interface Tree extends Position {
  radius: number;
}

export interface Staff extends Position {
  id: string;
  isPickedUp: boolean;
}

export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}
