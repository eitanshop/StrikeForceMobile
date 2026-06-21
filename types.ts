export type WeaponType = 'RIFLE' | 'PISTOL';

export interface GameState {
  isPlaying: boolean;
  score: number;
  health: number;
  ammo: number;
  isGameOver: boolean;
  setPlaying: (playing: boolean) => void;
  addScore: (amount: number) => void;
  takeDamage: (amount: number) => void;
  shoot: () => void;
  reload: () => void;
  reset: () => void;
}

export type Controls = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  shoot: boolean;
};
