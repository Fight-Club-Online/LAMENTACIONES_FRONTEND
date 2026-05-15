import { useCallback } from 'react';
import type { SpriteStyleVariables, AnimationFrameConfig } from '../types/animation.types';

/**
 * Hook para aplicar animaciones dinámicas a un sprite
 * Calcula y aplica todas las variables CSS necesarias basado en la configuración
 */
export const useSpriteAnimation = () => {
  /**
   * Calcula las variables CSS necesarias para una animación
   */
  const calculateSpriteVariables = useCallback(
    (config: AnimationFrameConfig & { sheetWidth?: number }): Partial<SpriteStyleVariables> => {
      // Usar sheetWidth real si está disponible, sino calcular
      const sheetWidth = config.sheetWidth ?? (config.frameWidth * config.frames);
      const animationOffset = `-${sheetWidth}px`;

      return {
        '--frames': String(config.frames),
        '--frame-width': `${config.frameWidth}px`,
        '--frame-height': `${config.frameHeight}px`,
        '--sheet-width': `${sheetWidth}px`,
        '--animation-offset': animationOffset,
        '--animation-duration': `${config.duration}s`,
      };
    },
    []
  );

  /**
   * Aplica las variables CSS a un elemento DOM
   */
  const applySpriteVariables = useCallback(
    (
      element: HTMLElement | null,
      config: AnimationFrameConfig & { sheetWidth?: number },
      additionalVars?: Partial<SpriteStyleVariables>
    ) => {
      if (!element) return;

      const variables = calculateSpriteVariables(config);

      // Aplicar variables base de animación
      Object.entries(variables).forEach(([key, value]) => {
        element.style.setProperty(key, value);
      });

      // Aplicar variables adicionales (glow, scale, dirección, etc)
      if (additionalVars) {
        Object.entries(additionalVars).forEach(([key, value]) => {
          element.style.setProperty(key, value);
        });
      }
    },
    [calculateSpriteVariables]
  );

  /**
   * Reestablece todas las variables CSS a valores por defecto
   */
  const resetSpriteVariables = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    const defaultVariables: Partial<SpriteStyleVariables> = {
      '--frames': '10',
      '--frame-width': '96px',
      '--frame-height': '96px',
      '--sheet-width': '960px',
      '--animation-offset': '-960px',
      '--animation-duration': '0.8s',
      '--sprite-glow': '#00ff00',
      '--sprite-scale': '1',
      '--sprite-direction': '1',
      '--sprite-offset-y': '0px',
    };

    Object.entries(defaultVariables).forEach(([key, value]) => {
      element.style.setProperty(key, value);
    });
  }, []);

  return {
    calculateSpriteVariables,
    applySpriteVariables,
    resetSpriteVariables,
  };
};
