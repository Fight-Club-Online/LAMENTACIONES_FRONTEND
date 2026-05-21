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
  // Caballero: 672x84
  // Usando 7 frames de 96px (como en mini-proyecto) para evitar deslizamiento
  caballero: {
    idle:   { frames: 7, frameWidth: 96,  frameHeight: 84 },
    run:    { frames: 8, frameWidth: 96,  frameHeight: 84 },
    attack: { frames: 6, frameWidth: 96,  frameHeight: 84 },
    hurt:   { frames: 4, frameWidth: 96,  frameHeight: 84 },
  },
  // Samurai: configuración basada en el mini-proyecto
  // IDLE usa 9 frames de 96x64 (según el documento de prueba)
  samurai: {
    idle:   { frames: 9, frameWidth: 96, frameHeight: 64 },
    run:    { frames: 14, frameWidth: 128, frameHeight: 64 },
    attack: { frames: 8,  frameWidth: 84, frameHeight: 64 },
    hurt:   { frames: 4,  frameWidth: 96, frameHeight: 64 },
  },
  // Golem: 720x64
  // Usando 8 frames de 96px (como en mini-proyecto)
  golem: {
    idle:   { frames: 8,  frameWidth: 96, frameHeight: 64 },
    run:    { frames: 10, frameWidth: 90, frameHeight: 64 },
    attack: { frames: 11, frameWidth: 90, frameHeight: 64 },
    hurt:   { frames: 4,  frameWidth: 90, frameHeight: 64 },
  },
  // Esqueleto: 768x64
  // Ya tiene frames de 96px, mantenemos
  esqueleto: {
    idle:   { frames: 8,  frameWidth: 96, frameHeight: 64 },
    run:    { frames: 10, frameWidth: 96, frameHeight: 64 },
    attack: { frames: 10, frameWidth: 96, frameHeight: 64 },
    hurt:   { frames: 5,  frameWidth: 96, frameHeight: 64 },
  },
  // Demonio: 324x71
  // Usando 4 frames de 80px (como en mini-proyecto)
  demonio: {
    idle:   { frames: 4, frameWidth: 80, frameHeight: 71 },
    run:    { frames: 4, frameWidth: 80, frameHeight: 71 },
    attack: { frames: 8, frameWidth: 80, frameHeight: 71 },
    hurt:   { frames: 4, frameWidth: 80, frameHeight: 71 },
  },
};

export const getSpriteConfig = (
  characterName: string,
  animationType: 'idle' | 'run' | 'attack' | 'hurt'
) => {
  const name = characterName.toLowerCase().trim();
  return SPRITE_CONFIGS[name]?.[animationType] ?? null;
};
