/**
 * Configuración manual de sprites por personaje.
 */
export interface ManualSpriteConfig {
  idle:   { frames: number; frameWidth: number; frameHeight: number };
  run:    { frames: number; frameWidth: number; frameHeight: number };
  attack: { frames: number; frameWidth: number; frameHeight: number };
  hurt:   { frames: number; frameWidth: number; frameHeight: number };
}

export const SPRITE_CONFIGS: Record<string, ManualSpriteConfig> = {
  // Caballero: height 84px
  // IDLE: 672x84 = 8 frames * 84px
  // RUN: 768x84 = 8 frames * 96px
  // ATTACK: 576x84 = 6 frames * 96px
  // HURT: 384x84 = 4 frames * 96px
  caballero: {
    idle:   { frames: 8, frameWidth: 84,  frameHeight: 84 },
    run:    { frames: 8, frameWidth: 96,  frameHeight: 84 },
    attack: { frames: 6, frameWidth: 96,  frameHeight: 84 },
    hurt:   { frames: 4, frameWidth: 96,  frameHeight: 84 },
  },
  // Samurai: height 96px
  // IDLE: 960x96 = 10 frames * 96px
  // RUN: 1536x96 = 16 frames * 96px
  // ATTACK: 672x96 = 7 frames * 96px
  // HURT: 384x96 = 4 frames * 96px
  samurai: {
    idle:   { frames: 10, frameWidth: 96, frameHeight: 96 },
    run:    { frames: 16, frameWidth: 96, frameHeight: 96 },
    attack: { frames: 7,  frameWidth: 96, frameHeight: 96 },
    hurt:   { frames: 4,  frameWidth: 96, frameHeight: 96 },
  },
  // Golem: height 64px
  // IDLE: 720x64 = 8 frames * 90px
  // RUN: 900x64 = 10 frames * 90px
  // ATTACK: 990x64 = 11 frames * 90px
  // HURT: 360x64 = 4 frames * 90px
  golem: {
    idle:   { frames: 8,  frameWidth: 90, frameHeight: 64 },
    run:    { frames: 10, frameWidth: 90, frameHeight: 64 },
    attack: { frames: 11, frameWidth: 90, frameHeight: 64 },
    hurt:   { frames: 4,  frameWidth: 90, frameHeight: 64 },
  },
  // Esqueleto: height 64px
  // IDLE: 768x64 = 8 frames * 96px
  // RUN: 960x64 = 10 frames * 96px
  // ATTACK: 960x64 = 10 frames * 96px (o 12*80)
  // HURT: 480x64 = 5 frames * 96px
  esqueleto: {
    idle:   { frames: 8,  frameWidth: 96, frameHeight: 64 },
    run:    { frames: 10, frameWidth: 96, frameHeight: 64 },
    attack: { frames: 10, frameWidth: 96, frameHeight: 64 },
    hurt:   { frames: 5,  frameWidth: 96, frameHeight: 64 },
  },
  // Demonio: height 71px
  // IDLE: 324x71 = 4 frames * 81px
  // RUN: 324x71 = 4 frames * 81px
  // ATTACK: 648x71 = 8 frames * 81px
  // HURT: 324x71 = 4 frames * 81px
  demonio: {
    idle:   { frames: 4, frameWidth: 81, frameHeight: 71 },
    run:    { frames: 4, frameWidth: 81, frameHeight: 71 },
    attack: { frames: 8, frameWidth: 81, frameHeight: 71 },
    hurt:   { frames: 4, frameWidth: 81, frameHeight: 71 },
  },
};

export const getSpriteConfig = (
  characterName: string,
  animationType: 'idle' | 'run' | 'attack' | 'hurt'
) => {
  const name = characterName.toLowerCase().trim();
  return SPRITE_CONFIGS[name]?.[animationType] ?? null;
};
