import type { CharacterAnimationConfig } from '../types/animation.types';

/**
 * Configuración de animaciones por personaje
 * Aquí defines los parámetros de cada spritesheet
 * Ajusta según las dimensiones reales de tus spritesheets
 */

export const CHARACTER_ANIMATION_CONFIGS: Record<string, CharacterAnimationConfig> = {
  default: {
    idle: {
      frames: 10,
      frameWidth: 96,
      frameHeight: 96,
      duration: 0.8,
      loop: true,
    },
    run: {
      frames: 16,
      frameWidth: 96,
      frameHeight: 96,
      duration: 0.7,
      loop: true,
    },
    attack: {
      frames: 7,
      frameWidth: 96,
      frameHeight: 96,
      duration: 0.8,
      loop: false,
    },
    hurt: {
      frames: 4,
      frameWidth: 96,
      frameHeight: 96,
      duration: 0.5,
      loop: false,
    },
  },

  // Ejemplo: Personaje B con diferentes dimensiones
  character_b: {
    idle: {
      frames: 6,
      frameWidth: 128,
      frameHeight: 128,
      duration: 0.6,
      loop: true,
    },
    run: {
      frames: 8,
      frameWidth: 128,
      frameHeight: 128,
      duration: 0.5,
      loop: true,
    },
    attack: {
      frames: 12,
      frameWidth: 128,
      frameHeight: 128,
      duration: 0.8,
      loop: false,
    },
    hurt: {
      frames: 3,
      frameWidth: 128,
      frameHeight: 128,
      duration: 0.25,
      loop: false,
    },
  },
};

/**
 * Obtiene la configuración de animaciones para un personaje
 * Si no existe configuración específica, retorna la configuración por defecto
 */
export const getCharacterAnimationConfig = (
  characterId: string | number | null | undefined
): CharacterAnimationConfig => {
  if (!characterId) return CHARACTER_ANIMATION_CONFIGS.default;

  const config = CHARACTER_ANIMATION_CONFIGS[String(characterId)];
  return config || CHARACTER_ANIMATION_CONFIGS.default;
};
