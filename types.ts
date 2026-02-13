
export interface Position {
  x: number;
  y: number;
}

export interface Entity extends Position {
  radius: number;
  speed: number;
  angle: number;
}

export interface Banana extends Position {
  id: string;
}

export interface Tree extends Position {
  radius: number;
}

export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}
