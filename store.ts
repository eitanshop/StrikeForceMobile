import { create } from 'zustand';

export type WeaponType = 'rifle' | 'laser' | 'plasma';

interface DecalData {
  id: number;
  position: [number, number, number];
  normal: [number, number, number];
  color?: string;
  size?: number;
}

interface BulletData {
  id: number;
  start: [number, number, number];
  end: [number, number, number];
  time: number;
  color?: string;
}

interface ExplosionData {
  id: number;
  position: [number, number, number];
  time: number;
}

interface BodyPartData {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  rotation: [number, number, number];
  time: number;
}

interface GameStore {
  isPlaying: boolean;
  isGameOver: boolean;
  score: number;
  health: number;
  ammo: number;
  weapon: WeaponType;
  level: number;
  enemiesTotal: number;
  enemiesKilled: number;
  decals: DecalData[];
  bullets: BulletData[];
  explosions: ExplosionData[];
  bodyParts: BodyPartData[];
  actions: {
    startGame: () => void;
    endGame: () => void;
    addScore: (points: number) => void;
    takeDamage: (damage: number) => void;
    decrementAmmo: () => void;
    reload: () => void;
    setWeapon: (weapon: WeaponType) => void;
    nextLevel: () => void;
    registerEnemy: () => void;
    killEnemy: () => void;
    reset: () => void;
    addDecal: (decal: Omit<DecalData, 'id'>) => void;
    addBullet: (bullet: Omit<BulletData, 'id'>) => void;
    addExplosion: (pos: Omit<ExplosionData, 'id'>) => void;
    addBodyPart: (part: Omit<BodyPartData, 'id'>) => void;
    updateBodyParts: (parts: BodyPartData[]) => void;
    clearEffects: () => void;
  };
}

let nextId = 0;

export const useGameStore = create<GameStore>((set) => ({
  isPlaying: false,
  isGameOver: false,
  score: 0,
  health: 100,
  ammo: 30,
  weapon: 'rifle',
  level: 1,
  enemiesTotal: 0,
  enemiesKilled: 0,
  decals: [],
  bullets: [],
  explosions: [],
  bodyParts: [],
  actions: {
    startGame: () => set({ isPlaying: true, isGameOver: false, health: 100, score: 0, ammo: 30, level: 1, enemiesTotal: 0, enemiesKilled: 0, decals: [], bullets: [], explosions: [], bodyParts: [] }),
    endGame: () => set({ isPlaying: false, isGameOver: true }),
    addScore: (points) => set((state) => ({ score: state.score + points })),
    takeDamage: (damage) => set((state) => {
      const newHealth = state.health - damage;
      if (newHealth <= 0) {
        return { health: 0, isPlaying: false, isGameOver: true };
      }
      return { health: newHealth };
    }),
    decrementAmmo: () => set((state) => ({ ammo: Math.max(0, state.ammo - 1) })),
    reload: () => set((state) => ({ ammo: state.weapon === 'rifle' ? 30 : state.weapon === 'laser' ? 100 : 5 })),
    setWeapon: (weapon) => set({ weapon, ammo: weapon === 'rifle' ? 30 : weapon === 'laser' ? 100 : 5 }),
    nextLevel: () => set((state) => ({ level: state.level + 1, enemiesTotal: 0, enemiesKilled: 0, health: 100, decals: [], bullets: [], explosions: [], bodyParts: [] })),
    registerEnemy: () => set((state) => ({ enemiesTotal: state.enemiesTotal + 1 })),
    killEnemy: () => set((state) => {
      const killed = state.enemiesKilled + 1;
      return { enemiesKilled: killed };
    }),
    reset: () => set({ isPlaying: false, isGameOver: false, score: 0, health: 100, ammo: 30, weapon: 'rifle', level: 1, enemiesTotal: 0, enemiesKilled: 0, decals: [], bullets: [], explosions: [], bodyParts: [] }),
    addDecal: (decal) => set((state) => ({ decals: [...state.decals, { ...decal, id: nextId++ }].slice(-50) })),
    addBullet: (bullet) => set((state) => ({ bullets: [...state.bullets, { ...bullet, id: nextId++ }].slice(-50) })),
    addExplosion: (exp) => set((state) => ({ explosions: [...state.explosions, { ...exp, id: nextId++ }].slice(-10) })),
    addBodyPart: (part) => set((state) => ({ bodyParts: [...state.bodyParts, { ...part, id: nextId++ }].slice(-30) })),
    updateBodyParts: (parts) => set({ bodyParts: parts }),
    clearEffects: () => set({ decals: [], bullets: [], explosions: [], bodyParts: [] }),
  },
}));

// Global ref for mobile controls to avoid re-renders
export const controlsRef = {
  current: {
    moveX: 0, // -1 to 1
    moveY: 0, // -1 to 1
    lookX: 0,
    lookY: 0,
    jump: false,
    shoot: false,
  }
};
