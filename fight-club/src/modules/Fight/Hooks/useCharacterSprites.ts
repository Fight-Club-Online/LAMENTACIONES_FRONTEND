import { useState, useEffect, useMemo } from 'react';
import type { CharacterAssets } from '../../Lobby/Config/axiosLobby';
import type { AnimationFrameConfig } from '../types/animation.types';

interface SpriteSheetDimensions {
  width: number;
  height: number;
  frameWidth: number;
  frameHeight: number;
  frames: number;
}

export interface DetectedAnimationConfig extends AnimationFrameConfig {
  sheetWidth: number;
}

type AnimationType = 'idle' | 'run' | 'attack' | 'hurt';

interface CharacterSpriteConfigs {
  idle: DetectedAnimationConfig | null;
  run: DetectedAnimationConfig | null;
  attack: DetectedAnimationConfig | null;
  hurt: DetectedAnimationConfig | null;
}

interface UseCharacterSpritesResult {
  /**
   * Configuraciones detectadas para cada tipo de animación
   */
  configs: CharacterSpriteConfigs;
  /**
   * Indica si todas las animaciones están cargadas
   */
  isLoaded: boolean;
  /**
   * Obtiene la configuración para un tipo de animación específico
   */
  getConfig: (type: AnimationType) => DetectedAnimationConfig | null;
}

// Cache global para evitar recargar imágenes
const dimensionsCache = new Map<string, SpriteSheetDimensions>();
const loadingPromises = new Map<string, Promise<SpriteSheetDimensions>>();

/**
 * Duración base por tipo de animación (segundos por frame)
 */
const BASE_FRAME_DURATION: Record<AnimationType, number> = {
  idle: 0.08,    // 80ms por frame - ritmo relajado
  run: 0.045,    // 45ms por frame - más rápido
  attack: 0.07,  // 70ms por frame - velocidad media-rápida
  hurt: 0.1,     // 100ms por frame - un poco más lento para que se note
};

/**
 * Carga una imagen y obtiene sus dimensiones
 */
const loadImageDimensions = (url: string): Promise<SpriteSheetDimensions> => {
  // Verificar cache primero
  const cached = dimensionsCache.get(url);
  if (cached) {
    return Promise.resolve(cached);
  }

  // Si ya hay una promesa en curso para esta URL, reutilizarla
  const existingPromise = loadingPromises.get(url);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = new Promise<SpriteSheetDimensions>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      
      // Asumimos que los frames son cuadrados (ancho = alto de cada frame)
      const frameHeight = height;
      const frameWidth = frameHeight;
      
      // Calculamos cantidad de frames
      const frames = Math.round(width / frameWidth);
      
      const dimensions: SpriteSheetDimensions = {
        width,
        height,
        frameWidth,
        frameHeight,
        frames: Math.max(1, frames),
      };
      
      // Guardar en cache
      dimensionsCache.set(url, dimensions);
      loadingPromises.delete(url);
      
      console.log('[v0] Sprite dimensions detected:', { url, dimensions });
      
      resolve(dimensions);
    };
    
    img.onerror = () => {
      loadingPromises.delete(url);
      reject(new Error(`Failed to load sprite sheet: ${url}`));
    };
    
    img.src = url;
  });

  loadingPromises.set(url, promise);
  return promise;
};

/**
 * Convierte dimensiones en configuración de animación
 */
const createAnimationConfig = (
  dimensions: SpriteSheetDimensions,
  animationType: AnimationType,
  loop: boolean
): DetectedAnimationConfig => {
  const frameDuration = BASE_FRAME_DURATION[animationType];
  const duration = dimensions.frames * frameDuration;

  return {
    frames: dimensions.frames,
    frameWidth: dimensions.frameWidth,
    frameHeight: dimensions.frameHeight,
    duration,
    loop,
    sheetWidth: dimensions.width,
  };
};

/**
 * Hook para pre-cargar todos los sprites de un personaje
 * y proveer configuraciones detectadas automáticamente
 */
export const useCharacterSprites = (
  assets: CharacterAssets | undefined
): UseCharacterSpritesResult => {
  const [configs, setConfigs] = useState<CharacterSpriteConfigs>({
    idle: null,
    run: null,
    attack: null,
    hurt: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // URLs de los assets
  const urls = useMemo(() => ({
    idle: assets?.idle_url,
    run: assets?.run_url,
    attack: assets?.attack_url,
    hurt: assets?.hurt_url,
  }), [assets?.idle_url, assets?.run_url, assets?.attack_url, assets?.hurt_url]);

  useEffect(() => {
    if (!assets) {
      setConfigs({ idle: null, run: null, attack: null, hurt: null });
      setIsLoaded(false);
      return;
    }

    const loadAll = async () => {
      const newConfigs: CharacterSpriteConfigs = {
        idle: null,
        run: null,
        attack: null,
        hurt: null,
      };

      const animationTypes: AnimationType[] = ['idle', 'run', 'attack', 'hurt'];
      const loopAnimations = new Set(['idle', 'run']);

      // Cargar todas las animaciones en paralelo
      const loadPromises = animationTypes.map(async (type) => {
        const url = urls[type];
        if (!url) return;

        try {
          const dimensions = await loadImageDimensions(url);
          newConfigs[type] = createAnimationConfig(
            dimensions,
            type,
            loopAnimations.has(type)
          );
        } catch (error) {
          console.error(`[v0] Failed to load ${type} sprite:`, error);
        }
      });

      await Promise.all(loadPromises);

      console.log('[v0] All sprite configs loaded:', newConfigs);
      
      setConfigs(newConfigs);
      setIsLoaded(true);
    };

    loadAll();
  }, [assets, urls]);

  const getConfig = (type: AnimationType): DetectedAnimationConfig | null => {
    return configs[type];
  };

  return {
    configs,
    isLoaded,
    getConfig,
  };
};
