/**
 * Configuración de una animación de spritesheet específica
 */
export interface AnimationFrameConfig {
  /**
   * Cantidad de frames en la animación
   */
  frames: number;

  /**
   * Ancho de cada frame en píxeles
   */
  frameWidth: number;

  /**
   * Alto de cada frame en píxeles
   */
  frameHeight: number;

  /**
   * Duración total de la animación en segundos
   */
  duration: number;

  /**
   * Si la animación debe repetirse (loop)
   * @default true
   */
  loop?: boolean;
}

/**
 * Todas las animaciones disponibles para un personaje
 */
export interface CharacterAnimationConfig {
  idle: AnimationFrameConfig;
  run: AnimationFrameConfig;
  attack: AnimationFrameConfig;
  hurt?: AnimationFrameConfig;
  [key: string]: AnimationFrameConfig | undefined;
}

/**
 * Variables CSS que serán aplicadas al sprite
 */
export interface SpriteStyleVariables {
  '--frames': string;
  '--frame-width': string;
  '--frame-height': string;
  '--sheet-width': string;
  '--animation-offset': string;
  '--animation-duration': string;
  '--sprite-glow': string;
  '--sprite-scale': string;
  '--sprite-direction': string;
  '--sprite-offset-y': string;
  [key: string]: string;
}

/**
 * Estado de la animación en un momento dado
 */
export interface AnimationState {
  animationType: 'idle' | 'run' | 'attack' | 'hurt';
  config: AnimationFrameConfig;
  isPlaying: boolean;
}
