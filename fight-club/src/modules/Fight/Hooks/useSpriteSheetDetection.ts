import { useState, useEffect, useCallback, useRef } from 'react';
import type { AnimationFrameConfig } from '../types/animation.types';

interface SpriteSheetDimensions {
  width: number;
  height: number;
  frameWidth: number;
  frameHeight: number;
  frames: number;
}

interface DetectedConfig extends AnimationFrameConfig {
  sheetWidth: number;
}

interface UseSpriteSheetDetectionResult {
  /**
   * Configuración detectada para la URL actual
   */
  detectedConfig: DetectedConfig | null;
  /**
   * Indica si está cargando la imagen
   */
  isLoading: boolean;
  /**
   * Error si hubo algún problema al cargar
   */
  error: string | null;
}

// Cache global para evitar recargar imágenes
const dimensionsCache = new Map<string, SpriteSheetDimensions>();
const loadingPromises = new Map<string, Promise<SpriteSheetDimensions>>();

/**
 * Carga una imagen y obtiene sus dimensiones
 */
const loadImageDimensions = (url: string): Promise<SpriteSheetDimensions> => {
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
      // El frameHeight es el alto total del spritesheet
      const frameHeight = height;
      const frameWidth = frameHeight; // Frames cuadrados
      
      // Calculamos cantidad de frames
      const frames = Math.round(width / frameWidth);
      
      const dimensions: SpriteSheetDimensions = {
        width,
        height,
        frameWidth,
        frameHeight,
        frames: Math.max(1, frames), // Mínimo 1 frame
      };
      
      // Guardar en cache
      dimensionsCache.set(url, dimensions);
      loadingPromises.delete(url);
      
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
 * Obtiene las dimensiones desde el cache si existen
 */
const getCachedDimensions = (url: string): SpriteSheetDimensions | null => {
  return dimensionsCache.get(url) || null;
};

/**
 * Duración base por tipo de animación (segundos por frame)
 */
const BASE_FRAME_DURATION: Record<string, number> = {
  idle: 0.08,    // 80ms por frame - ritmo relajado
  run: 0.045,    // 45ms por frame - más rápido
  attack: 0.07,  // 70ms por frame - velocidad media-rápida
  hurt: 0.1,     // 100ms por frame - un poco más lento para que se note
};

/**
 * Hook para detectar automáticamente las dimensiones de un spritesheet
 * 
 * @param spriteUrl - URL del spritesheet a analizar
 * @param animationType - Tipo de animación para calcular duración apropiada
 * @param loop - Si la animación debe hacer loop
 */
export const useSpriteSheetDetection = (
  spriteUrl: string | undefined,
  animationType: 'idle' | 'run' | 'attack' | 'hurt' = 'idle',
  loop: boolean = true
): UseSpriteSheetDetectionResult => {
  const [detectedConfig, setDetectedConfig] = useState<DetectedConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastUrlRef = useRef<string | undefined>(undefined);

  const detectDimensions = useCallback(async (url: string) => {
    // Verificar cache primero
    const cached = getCachedDimensions(url);
    if (cached) {
      const frameDuration = BASE_FRAME_DURATION[animationType] || 0.08;
      const duration = cached.frames * frameDuration;
      
      setDetectedConfig({
        frames: cached.frames,
        frameWidth: cached.frameWidth,
        frameHeight: cached.frameHeight,
        duration,
        loop,
        sheetWidth: cached.width,
      });
      setIsLoading(false);
      setError(null);
      return;
    }

    // Cargar imagen y detectar
    setIsLoading(true);
    setError(null);

    try {
      const dimensions = await loadImageDimensions(url);
      const frameDuration = BASE_FRAME_DURATION[animationType] || 0.08;
      const duration = dimensions.frames * frameDuration;

      setDetectedConfig({
        frames: dimensions.frames,
        frameWidth: dimensions.frameWidth,
        frameHeight: dimensions.frameHeight,
        duration,
        loop,
        sheetWidth: dimensions.width,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setDetectedConfig(null);
    } finally {
      setIsLoading(false);
    }
  }, [animationType, loop]);

  useEffect(() => {
    if (!spriteUrl) {
      setDetectedConfig(null);
      setIsLoading(false);
      setError(null);
      lastUrlRef.current = undefined;
      return;
    }

    // Evitar re-detección si la URL no cambió
    if (spriteUrl === lastUrlRef.current) {
      return;
    }

    lastUrlRef.current = spriteUrl;
    detectDimensions(spriteUrl);
  }, [spriteUrl, detectDimensions]);

  return {
    detectedConfig,
    isLoading,
    error,
  };
};

/**
 * Función utilitaria para pre-cargar múltiples spritesheets
 * Útil para cargar todos los assets de un personaje de una vez
 */
export const preloadSpriteSheets = async (urls: string[]): Promise<void> => {
  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  await Promise.all(uniqueUrls.map(url => loadImageDimensions(url)));
};

/**
 * Limpia el cache de dimensiones (útil para testing o memory management)
 */
export const clearDimensionsCache = (): void => {
  dimensionsCache.clear();
};
