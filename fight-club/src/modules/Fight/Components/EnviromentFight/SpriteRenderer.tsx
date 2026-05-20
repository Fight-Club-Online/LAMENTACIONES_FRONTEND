import React, { useEffect, useRef } from 'react';
import type { Fighter } from '../../types/fight';
import type { CharacterAssets } from '../../../Lobby/Config/axiosLobby';
import { useSpriteAnimation } from '../../Hooks/useSpriteAnimation';
import { useCharacterSprites } from '../../Hooks/useCharacterSprites';
import {
  mapActionToAnimationType,
  getSpriteAssetUrl,
  getSpriteGlowColor,
  buildAdditionalSpriteVariables,
  getAnimationClass,
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
  const { applySpriteVariables } = useSpriteAnimation();
  const isLockedRef   = useRef(false);
  const lockedTypeRef = useRef<'attack' | 'hurt' | null>(null);

  const isDead = (fighter.health?.currentHealth ?? 0) <= 0;
  const animationType = mapActionToAnimationType(fighter.currentAction);
  const assets = characterAssets.get(spriteKey);
  const spriteUrl = getSpriteAssetUrl(assets, fighter.currentAction, isDead);
  const glowColor = getSpriteGlowColor(fighter.currentAction, isDead);
  const direction = fighter.direction === 'RIGHT' ? 1 : -1;
  const animationClass = getAnimationClass(animationType);

  // Pre-cargar TODOS los sprites del personaje de una vez
  // Esto evita delays cuando se cambia de animación
  const { getConfig, isLoaded } = useCharacterSprites(assets);
  
  // Obtener la config para el tipo de animación actual
  const detectedConfig = getConfig(animationType);

  // Debug: ver qué valores está detectando
  useEffect(() => {
    if (animationType === 'attack') {
      console.log('[v0] Attack animation debug:', {
        spriteUrl,
        animationType,
        detectedConfig,
        isLoaded,
      });
    }
  }, [spriteUrl, animationType, detectedConfig, isLoaded]);

  // Actualizar posición y variables del slot
  useEffect(() => {
    if (!slotRef.current) return;
    if (isLockedRef.current) return;

    const element = slotRef.current;
    element.style.left = `${(position.x / canvasWidth) * 100}%`;
    element.style.top = `${((position.y - 10) / canvasHeight) * 100}%`;
    element.style.width = `${(slotWidth / canvasWidth) * 100}%`;
    element.style.height = `${(slotHeight / canvasHeight) * 100}%`;
    element.style.opacity = isDead ? '0.9' : '1';
  }, [position.x, position.y, slotWidth, slotHeight, canvasWidth, canvasHeight, isDead]);

  // Actualizar sprite URL
  useEffect(() => {
    if (!spriteRef.current) return;
    if (isLockedRef.current) return;
    if (spriteUrl) {
      spriteRef.current.style.backgroundImage = `url(${spriteUrl})`;
    }
  }, [spriteUrl]);

  // Actualizar variables de animación Y reiniciar animación CSS
  // Combinamos ambas operaciones para asegurar que las variables se apliquen antes del reinicio
  useEffect(() => {
    if (!spriteRef.current || !detectedConfig) return;

    const sprite = spriteRef.current;

    console.log('[v0] Applying animation config:', {
      animationType,
      detectedConfig,
      spriteUrl,
    });

    if (isLockedRef.current) return;

    // Activar lock cuando empieza una animación one-shot 
    if (animationType === 'attack' || animationType === 'hurt') {
      isLockedRef.current   = true;
      lockedTypeRef.current = animationType;
    }

    // 1. Primero aplicar las variables CSS
    const additionalVars = buildAdditionalSpriteVariables(glowColor, scale, direction, 0);
    applySpriteVariables(sprite, detectedConfig, additionalVars);

    // Debug: Verificar que las variables CSS se aplicaron correctamente
    const computedStyle = getComputedStyle(sprite);
    console.log('[v0] CSS Variables after apply:', {
      frames: computedStyle.getPropertyValue('--frames'),
      frameWidth: computedStyle.getPropertyValue('--frame-width'),
      frameHeight: computedStyle.getPropertyValue('--frame-height'),
      sheetWidth: computedStyle.getPropertyValue('--sheet-width'),
      animationOffset: computedStyle.getPropertyValue('--animation-offset'),
      animationDuration: computedStyle.getPropertyValue('--animation-duration'),
    });

    // 2. Remover todas las clases de acción
    sprite.classList.remove('action-attack', 'action-hurt', 'action-run', 'action-idle');

    sprite.style.animation = 'none';
void sprite.offsetHeight;

const iterCount = (animationType === 'attack' || animationType === 'hurt') ? '1' : 'infinite';
const delay = animationType === 'attack'
  ? `-${(detectedConfig.duration / detectedConfig.frames) * 3}s`
  : '0s';

sprite.style.animation = [
  `spriteAnimation`,
  `${detectedConfig.duration}s`,
  `steps(${detectedConfig.frames}, end)`,
  `${delay}`,
  `${iterCount}`,
  `normal`,
  `forwards`,
].join(' ');

sprite.classList.add(animationClass);
  }, [detectedConfig, animationClass, glowColor, scale, direction, applySpriteVariables, animationType]);

  // Manejar fin de animación para volver a idle en attack/hurt
  useEffect(() => {
    if (!spriteRef.current) return;

    const sprite = spriteRef.current;

    const handleAnimationEnd = () => {
      if (lockedTypeRef.current === null) return;   // no hay lock activo
        // Liberar lock
        isLockedRef.current   = false;
        lockedTypeRef.current = null;

        // Restaurar spritesheet de idle y aplicar su config
        const idleConfig = getConfig('idle');
        if (idleConfig && spriteRef.current) {
          const idleUrl = assets?.idle_url;
          if (idleUrl) spriteRef.current.style.backgroundImage = `url(${idleUrl})`;
          const additionalVars = buildAdditionalSpriteVariables(glowColor, scale, direction, 0);
          applySpriteVariables(spriteRef.current, idleConfig, additionalVars);
        }
        
        sprite.classList.remove('action-attack', 'action-hurt', 'action-run');
sprite.classList.add('action-idle');
sprite.style.animation = 'none';
void sprite.offsetHeight;

if (idleConfig) {
  sprite.style.animation = [
    `spriteAnimation`,
    `${idleConfig.duration}s`,
    `steps(${idleConfig.frames}, end)`,
    `0s`,
    `infinite`,
    `normal`,
    `forwards`,
  ].join(' ');
} else {
  sprite.style.animation = '';
}
      };


    sprite.addEventListener('animationend', handleAnimationEnd);

    return () => {
      sprite.removeEventListener('animationend', handleAnimationEnd);
    };
  }, [getConfig, assets, glowColor, scale, direction, applySpriteVariables]);

  return (
    <div
      ref={slotRef}
      className="fight-sprite-slot"
    >
      <div
        ref={spriteRef}
        className="fight-sprite-sheet"
      />
    </div>
  );
};

export default SpriteRenderer;
