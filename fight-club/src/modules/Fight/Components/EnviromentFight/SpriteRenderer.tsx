import React, { useEffect, useRef, useCallback } from 'react';
import type { Fighter } from '../../types/fight';
import type { CharacterAssets } from '../../../Lobby/Config/axiosLobby';
import { useCharacterSprites } from '../../Hooks/useCharacterSprites';
import {
  mapActionToAnimationType,
  getSpriteAssetUrl,
  getSpriteGlowColor,
} from '../../utils/spriteUtils';

interface SpriteRendererProps {
  fighter: Fighter;
  position: { x: number; y: number };
  slotWidth: number;
  slotHeight: number;
  scale: number;
  characterAssets: Map<string, CharacterAssets>;
  canvasWidth: number;
  canvasHeight: number;
  spriteKey: string;
}

const SpriteRenderer: React.FC<SpriteRendererProps> = ({
  fighter,
  position,
  slotWidth,
  slotHeight,
  scale,
  characterAssets,
  canvasWidth,
  canvasHeight,
  spriteKey,
}) => {
  const slotRef = useRef<HTMLDivElement>(null);
  const spriteRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentAnimationRef = useRef<string | null>(null);
  const isLockedRef = useRef(false);
  const lockedTypeRef = useRef<'attack' | 'hurt' | null>(null);

  const isDead = (fighter.health?.currentHealth ?? 0) <= 0;
  const animationType = mapActionToAnimationType(fighter.currentAction);
  const assets = characterAssets.get(spriteKey);
  const spriteUrl = getSpriteAssetUrl(assets, fighter.currentAction, isDead);
  const glowColor = getSpriteGlowColor(fighter.currentAction, isDead);
  // Los sprites base miran a la IZQUIERDA, entonces:
  // - direction LEFT (mirar izquierda) = scaleX(1) sin voltear
  // - direction RIGHT (mirar derecha) = scaleX(-1) voltear horizontalmente
  const direction = fighter.direction === 'LEFT' ? 1 : -1;

  const { getConfig, isLoaded } = useCharacterSprites(assets);
  const detectedConfig = getConfig(animationType);

  // Funcion para iniciar la animacion con JavaScript (igual que el mini-proyecto)
  const startAnimation = useCallback((
    config: { frames: number; frameWidth: number; frameHeight: number; duration: number },
    url: string,
    isOneShot: boolean,
    onComplete?: () => void
  ) => {
    if (!spriteRef.current) return;

    // Limpiar interval anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const sprite = spriteRef.current;
    const { frames, frameWidth, frameHeight, duration } = config;
    const totalWidth = frameWidth * frames;
    const frameTime = (duration * 1000) / frames;

    // Configurar estilos iniciales
    sprite.style.backgroundImage = `url(${url})`;
    sprite.style.backgroundRepeat = 'no-repeat';
    sprite.style.backgroundSize = `${totalWidth}px ${frameHeight}px`;
    sprite.style.backgroundPosition = '0 0';
    sprite.style.width = `${frameWidth}px`;
    sprite.style.height = `${frameHeight}px`;
    
    // Resetear frame
    frameRef.current = 0;

    // Iniciar animacion frame por frame (igual que el mini-proyecto)
    intervalRef.current = setInterval(() => {
      if (!spriteRef.current) return;

      frameRef.current = frameRef.current + 1;

      // Si es one-shot y llego al ultimo frame
      if (isOneShot && frameRef.current >= frames) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onComplete?.();
        return;
      }

      // Loop normal
      frameRef.current = frameRef.current % frames;
      const offsetX = -frameRef.current * frameWidth;
      spriteRef.current.style.backgroundPosition = `${offsetX}px 0`;
    }, frameTime);
  }, []);

  // Funcion para volver a idle
  const returnToIdle = useCallback(() => {
    isLockedRef.current = false;
    lockedTypeRef.current = null;

    const idleConfig = getConfig('idle');
    const idleUrl = assets?.idle_url;

    if (idleConfig && idleUrl) {
      currentAnimationRef.current = 'idle';
      startAnimation(idleConfig, idleUrl, false);
    }
  }, [getConfig, assets, startAnimation]);

  // Actualizar posicion del slot
  useEffect(() => {
    if (!slotRef.current) return;

    const element = slotRef.current;
    element.style.left = `${(position.x / canvasWidth) * 100}%`;
    element.style.top = `${((position.y - 10) / canvasHeight) * 100}%`;
    element.style.width = `${(slotWidth / canvasWidth) * 100}%`;
    element.style.height = `${(slotHeight / canvasHeight) * 100}%`;
    element.style.opacity = isDead ? '0.9' : '1';
  }, [position.x, position.y, slotWidth, slotHeight, canvasWidth, canvasHeight, isDead]);

  // Manejar cambios de animacion
  useEffect(() => {
    if (!spriteRef.current || !detectedConfig || !spriteUrl) return;

    // Si esta bloqueado en attack/hurt, no cambiar
    if (isLockedRef.current) return;

    // Si es la misma animacion, no reiniciar
    if (currentAnimationRef.current === animationType) return;

    currentAnimationRef.current = animationType;

    const isOneShot = animationType === 'attack' || animationType === 'hurt';

    if (isOneShot) {
      isLockedRef.current = true;
      lockedTypeRef.current = animationType;
    }

    startAnimation(detectedConfig, spriteUrl, isOneShot, isOneShot ? returnToIdle : undefined);
  }, [animationType, detectedConfig, spriteUrl, startAnimation, returnToIdle]);

  // Aplicar escala y direccion (manteniendo el translate para centrar)
  useEffect(() => {
    if (!spriteRef.current) return;
    spriteRef.current.style.transform = `translate(-50%, -50%) scaleX(${direction}) scale(${scale})`;
  }, [direction, scale]);

  // Aplicar glow
  useEffect(() => {
    if (!spriteRef.current) return;
    if (glowColor) {
      spriteRef.current.style.filter = `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 0 16px ${glowColor})`;
    } else {
      spriteRef.current.style.filter = 'none';
    }
  }, [glowColor]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Iniciar animacion al cargar (si aun no ha empezado)
  useEffect(() => {
    if (!isLoaded || !detectedConfig || !spriteUrl) return;
    if (currentAnimationRef.current !== null) return; // ya empezo

    currentAnimationRef.current = animationType;
    startAnimation(detectedConfig, spriteUrl, false);
  }, [isLoaded, detectedConfig, spriteUrl, animationType, startAnimation]);

  return (
    <div
      ref={slotRef}
      className="fight-sprite-slot"
    >
      <div
        ref={spriteRef}
        className="fight-sprite-sheet"
        style={{
          imageRendering: 'pixelated',
          transformOrigin: 'center center',
        }}
      />
    </div>
  );
};

export default SpriteRenderer;
