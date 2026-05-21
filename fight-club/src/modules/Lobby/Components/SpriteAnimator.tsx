import React, { useEffect, useRef, useState } from 'react';
import { getSpriteConfig } from '../../Fight/Config/spriteConfig';

interface SpriteAnimatorProps {
  spriteUrl: string;
  characterName: string;
  animationType?: 'idle' | 'run' | 'attack' | 'hurt';
  scale?: number;
  className?: string;
}

/**
 * Componente de animación de sprites usando JavaScript (setInterval)
 * Usa la configuración de spriteConfig.ts para cada personaje
 */
export const SpriteAnimator: React.FC<SpriteAnimatorProps> = ({
  spriteUrl,
  characterName,
  animationType = 'idle',
  scale = 6,
  className = '',
}) => {
  const spriteRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [config, setConfig] = useState<{ frames: number; frameWidth: number; frameHeight: number } | null>(null);

  // Obtener configuración del personaje
  useEffect(() => {
    const spriteConfig = getSpriteConfig(characterName, animationType);
    
    if (spriteConfig) {
      setConfig(spriteConfig);
    } else {
      // Fallback: auto-detectar desde imagen
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const height = img.naturalHeight;
        const width = img.naturalWidth;
        // Asumir frames cuadrados
        const frames = Math.round(width / height);
        const frameWidth = Math.round(width / frames);
        setConfig({
          frames: Math.max(1, frames),
          frameWidth,
          frameHeight: height,
        });
      };
      img.src = spriteUrl;
    }
  }, [characterName, animationType, spriteUrl]);

  // Iniciar animación cuando tenemos config
  useEffect(() => {
    if (!config || !spriteRef.current) return;

    const { frames, frameWidth, frameHeight } = config;
    const totalWidth = frameWidth * frames;
    const frameTime = 100; // 100ms por frame

    // Configurar estilos iniciales
    const sprite = spriteRef.current;
    sprite.style.width = `${frameWidth}px`;
    sprite.style.height = `${frameHeight}px`;
    sprite.style.backgroundImage = `url(${spriteUrl})`;
    sprite.style.backgroundRepeat = 'no-repeat';
    sprite.style.backgroundSize = `${totalWidth}px ${frameHeight}px`;
    sprite.style.backgroundPosition = '0 0';

    // Resetear frame
    frameRef.current = 0;

    // Limpiar interval anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Iniciar animación frame por frame
    intervalRef.current = setInterval(() => {
      if (!spriteRef.current) return;

      frameRef.current = (frameRef.current + 1) % frames;
      const offsetX = -frameRef.current * frameWidth;
      spriteRef.current.style.backgroundPosition = `${offsetX}px 0`;
    }, frameTime);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [config, spriteUrl]);

  if (!config) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={spriteRef}
      className={className}
      style={{
        imageRendering: 'pixelated',
        transform: `scale(${scale})`,
        transformOrigin: 'bottom center',
      }}
    />
  );
};

export default SpriteAnimator;
