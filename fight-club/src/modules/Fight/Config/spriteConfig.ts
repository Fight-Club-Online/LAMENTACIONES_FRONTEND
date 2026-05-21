/**
 * Configuración manual de sprites por personaje.
 */
export interface ManualSpriteConfig {
  idle:   { frames: number; frameWidth: number; frameHeight: number };
  run:    { frames: number; frameWidth: number; frameHeight: number };
  attack: { frames: number; frameWidth: number; frameHeight: number };
  hurt:   { frames: number; frameWidth: number; frameHeight: number };
  /** 
   * Dirección a la que mira el sprite por defecto (sin transformar).
   * 'LEFT' = el sprite mira hacia la izquierda
   * 'RIGHT' = el sprite mira hacia la derecha
   */
  defaultFacing: 'LEFT' | 'RIGHT';
}

export const SPRITE_CONFIGS: Record<string, ManualSpriteConfig> = {
  // Caballero: 672x84
  // Usando 7 frames de 96px (como en mini-proyecto) para evitar deslizamiento
  // El sprite del caballero mira hacia la DERECHA por defecto
  caballero: {
    idle:   { frames: 7, frameWidth: 96,  frameHeight: 84 },
    run:    { frames: 8, frameWidth: 96,  frameHeight: 84 },
    attack: { frames: 6, frameWidth: 96,  frameHeight: 84 },
    hurt:   { frames: 4, frameWidth: 96,  frameHeight: 84 },
    defaultFacing: 'RIGHT',
  },
  // Samurai: basado en dimensiones reales de los archivos
  // IDLE: 960x96 -> 10 frames de 96px
  // RUN: 1536x96 -> 16 frames de 96px
  // ATTACK: 672x96 -> 7 frames de 96px
  // HURT: 384x96 -> 4 frames de 96px
  // El sprite del samurai mira hacia la DERECHA por defecto
  samurai: {
    idle:   { frames: 10, frameWidth: 96, frameHeight: 96 },
    run:    { frames: 16, frameWidth: 96, frameHeight: 96 },
    attack: { frames: 7,  frameWidth: 96, frameHeight: 96 },
    hurt:   { frames: 4,  frameWidth: 96, frameHeight: 96 },
    defaultFacing: 'RIGHT',
  },
  // Golem: 720x64
  // 720/8 = 90px de ancho por frame
  // El sprite del golem mira hacia la DERECHA por defecto
  golem: {
    idle:   { frames: 8,  frameWidth: 90, frameHeight: 64 },
    run:    { frames: 10, frameWidth: 90, frameHeight: 64 },
    attack: { frames: 11, frameWidth: 90, frameHeight: 64 },
    hurt:   { frames: 4,  frameWidth: 90, frameHeight: 64 },
    defaultFacing: 'RIGHT',
  },
  // Esqueleto: 768x64
  // Ya tiene frames de 96px, mantenemos
  // El sprite del esqueleto mira hacia la DERECHA por defecto
  esqueleto: {
    idle:   { frames: 8,  frameWidth: 96, frameHeight: 64 },
    run:    { frames: 10, frameWidth: 96, frameHeight: 64 },
    attack: { frames: 10, frameWidth: 96, frameHeight: 64 },
    hurt:   { frames: 5,  frameWidth: 96, frameHeight: 64 },
    defaultFacing: 'RIGHT',
  },
  // Demonio: basado en dimensiones reales de los archivos
  // IDLE: 324x71 -> 4 frames de 81px
  // RUN: 324x71 -> 4 frames de 81px  
  // ATTACK: 648x71 -> 8 frames de 81px
  // HURT: 324x71 -> 4 frames de 81px
  // El sprite del demonio mira hacia la IZQUIERDA por defecto
  demonio: {
    idle:   { frames: 4, frameWidth: 81, frameHeight: 71 },
    run:    { frames: 4, frameWidth: 81, frameHeight: 71 },
    attack: { frames: 8, frameWidth: 81, frameHeight: 71 },
    hurt:   { frames: 4, frameWidth: 81, frameHeight: 71 },
    defaultFacing: 'LEFT',
  },
};

export const getSpriteConfig = (
  characterName: string,
  animationType: 'idle' | 'run' | 'attack' | 'hurt'
) => {
  const name = characterName.toLowerCase().trim();
  return SPRITE_CONFIGS[name]?.[animationType] ?? null;
};

/**
 * Obtiene la dirección predeterminada del sprite de un personaje.
 * @param characterName Nombre del personaje
 * @returns 'LEFT' o 'RIGHT' dependiendo de hacia dónde mira el sprite sin transformar
 */
export const getSpriteDefaultFacing = (characterName: string): 'LEFT' | 'RIGHT' => {
  const name = characterName.toLowerCase().trim();
  return SPRITE_CONFIGS[name]?.defaultFacing ?? 'LEFT';
};
