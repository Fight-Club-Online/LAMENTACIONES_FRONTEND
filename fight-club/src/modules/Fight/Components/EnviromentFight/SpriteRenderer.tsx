import React, { useEffect, useRef } from 'react';
import type { Fighter } from '../../types/fight';
import type { CharacterAssets } from '../../../Lobby/Config/axiosLobby';
import { useSpriteAnimation } from '../../Hooks/useSpriteAnimation';
import {
  mapActionToAnimationType,
  getAnimationConfigForFighter,
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

  const isDead = (fighter.health?.currentHealth ?? 0) <= 0;
  const animationType = mapActionToAnimationType(fighter.currentAction);
  const animationConfig = getAnimationConfigForFighter(fighter, animationType);
  const spriteUrl = getSpriteAssetUrl(characterAssets.get(spriteKey), fighter.currentAction, isDead);
  const glowColor = getSpriteGlowColor(fighter.currentAction, isDead);
  const direction = fighter.direction === 'RIGHT' ? 1 : -1;
  const animationClass = getAnimationClass(animationType);

  // Actualizar posición y variables del slot
  useEffect(() => {
    if (!slotRef.current) return;

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
    if (spriteUrl) {
      spriteRef.current.style.backgroundImage = `url(${spriteUrl})`;
    }
  }, [spriteUrl]);

  // Actualizar variables de animación dinámicamente
  useEffect(() => {
    if (!spriteRef.current || !animationConfig) return;

    const additionalVars = buildAdditionalSpriteVariables(glowColor, scale, direction, 0);
    applySpriteVariables(spriteRef.current, animationConfig, additionalVars);
  }, [animationConfig, glowColor, scale, direction, fighter.direction, applySpriteVariables]);

  // Aplicar/remover clase de animación y reiniciar animación CSS
  useEffect(() => {
    if (!spriteRef.current) return;

    const sprite = spriteRef.current;

    // Remover todas las clases de acción
    sprite.classList.remove('action-attack', 'action-hurt', 'action-run', 'action-idle');

    // Forzar reinicio de la animación CSS
    sprite.style.animation = 'none';
    // Disparar reflow para que el navegador procese el cambio
    void sprite.offsetHeight;
    sprite.style.animation = '';

    // Agregar clase actual
    sprite.classList.add(animationClass);
  }, [animationClass, spriteUrl]);

  // Manejar fin de animación para volver a idle en attack/hurt
  useEffect(() => {
    if (!spriteRef.current) return;

    const sprite = spriteRef.current;

    const handleAnimationEnd = () => {
      // Solo si la animación que terminó fue attack o hurt
      if (animationType === 'attack' || animationType === 'hurt') {
        // Remover las clases de animación
        sprite.classList.remove('action-attack', 'action-hurt');

        // Cambiar a idle
        sprite.classList.add('action-idle');

        // Forzar reinicio de la animación
        sprite.style.animation = 'none';
        void sprite.offsetHeight;
        sprite.style.animation = '';
      }
    };

    sprite.addEventListener('animationend', handleAnimationEnd);

    return () => {
      sprite.removeEventListener('animationend', handleAnimationEnd);
    };
  }, [animationType]);

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
