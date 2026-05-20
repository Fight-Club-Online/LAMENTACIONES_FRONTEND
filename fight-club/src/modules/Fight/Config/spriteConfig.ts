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
  caballero: {
    idle:   { frames: 8, frameWidth: 84,  frameHeight: 84 },
    run:    { frames: 8, frameWidth: 96,  frameHeight: 84 },
    attack: { frames: 6, frameWidth: 96,  frameHeight: 84 },
    hurt:   { frames: 4, frameWidth: 96,  frameHeight: 84 },
  },
  samurai: {
    idle:   { frames: 10, frameWidth: 96, frameHeight: 96 },
    run:    { frames: 16, frameWidth: 96, frameHeight: 96 },
    attack: { frames: 7,  frameWidth: 96, frameHeight: 96 },
    hurt:   { frames: 4,  frameWidth: 96, frameHeight: 96 },
  },
};

export const getSpriteConfig = (
  characterName: string,
  animationType: 'idle' | 'run' | 'attack' | 'hurt'
) => {
  const name = characterName.toLowerCase().trim();
  return SPRITE_CONFIGS[name]?.[animationType] ?? null;
};