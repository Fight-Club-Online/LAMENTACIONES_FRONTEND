import type { Fighter } from '../types/fight';
import type { CharacterAssets } from '../../Lobby/Config/axiosLobby';
import type { SpriteStyleVariables } from '../types/animation.types';
import { ACTION_COLORS_HEX } from '../Components/EnviromentFight/ArenaVisuals';

/**
 * Mapea la acción del luchador a un tipo de animación
 */
export const mapActionToAnimationType = (
  action: Fighter['currentAction']
): 'idle' | 'run' | 'attack' | 'hurt' => {
  if (action === 'HURT') {
    return 'hurt';
  }
  if (action === 'MOVE_LEFT' || action === 'MOVE_RIGHT') {
    return 'run';
  }
  if (action === 'BASIC_ATTACK' || action === 'SPECIAL_ATTACK') {
    return 'attack';
  }
  return 'idle';
};

/**
 * Determina la URL del spritesheet según la acción del luchador
 */
export const getSpriteAssetUrl = (
  assets: CharacterAssets | undefined,
  action: Fighter['currentAction'],
  isDead: boolean
): string | undefined => {
  if (!assets) return undefined;

  if (isDead) {
    return assets.idle_url || assets.run_url || assets.attack_url || assets.hurt_url;
  }

  if (action === 'MOVE_LEFT' || action === 'MOVE_RIGHT') {
    return assets.run_url || assets.idle_url || assets.attack_url;
  }

  if (action === 'BASIC_ATTACK' || action === 'SPECIAL_ATTACK') {
    return assets.attack_url || assets.idle_url || assets.run_url;
  }

  if (action === 'HURT') {
    return assets.hurt_url || assets.idle_url;
  }

  return assets.idle_url || assets.run_url || assets.attack_url || assets.hurt_url;
};

/**
 * Obtiene el color de glow según la acción y estado del luchador
 */
export const getSpriteGlowColor = (
  action: Fighter['currentAction'],
  isDead: boolean
): string => {
  if (isDead) return ACTION_COLORS_HEX.DEAD;
  return ACTION_COLORS_HEX[action] || ACTION_COLORS_HEX.IDLE;
};

/**
 * Construye las variables CSS adicionales (no de animación)
 */
export const buildAdditionalSpriteVariables = (
  glowColor: string,
  scale: number,
  direction: number,
  offsetY: number
): Partial<SpriteStyleVariables> => {
  return {
    '--sprite-glow': glowColor,
    '--sprite-scale': String(scale),
    '--sprite-direction': String(direction),
    '--sprite-offset-y': `${offsetY}px`,
  };
};

/**
 * Genera la clave única para un sprite (para cachear assets)
 */
export const getSpriteKey = (fighter: Fighter): string => {
  return `${fighter.userId}:${fighter.characterId ?? 'no-character'}`;
};

/**
 * Calcula la dirección del sprite (1 o -1) basada en la posición relativa
 */
export const calculateSpriteDirection = (
  fighterX: number,
  canvasWidth: number
): 1 | -1 => {
  const centerX = canvasWidth / 2;
  return fighterX < centerX ? 1 : -1;
};

/**
 * Determina la clase CSS a aplicar según la animación
 */
export const getAnimationClass = (animationType: 'idle' | 'run' | 'attack' | 'hurt'): string => {
  return `action-${animationType}`;
};
