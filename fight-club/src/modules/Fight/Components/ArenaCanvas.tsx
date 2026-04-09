import React, { useRef, useEffect, useCallback } from 'react';
import type { Fight, Fighter, FighterAction } from '../types/fight';
import backgroundImage from '../../../assets/Background.jpeg'; 

interface Props {
    gameState: Fight | null;
}

// Configuración del canvas y fighters
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const FIGHTER_WIDTH = 60;
const FIGHTER_HEIGHT = 120;
const GROUND_Y = CANVAS_HEIGHT - 50; // Línea del suelo

// Interpolación config
const LERP_SPEED = 0.25; // 0.1 = suave, 0.5 = rápido, 1 = sin interpolación

// Colores para cada acción
const ACTION_COLORS: Record<FighterAction, string> = {
    IDLE: '#3b82f6',        // Azul
    MOVE_LEFT: '#06b6d4',   // Cyan
    MOVE_RIGHT: '#06b6d4',  // Cyan
    JUMP: '#8b5cf6',        // Violeta
    BLOCK: '#f59e0b',       // Ámbar
    BASIC_ATTACK: '#ef4444', // Rojo
    SPECIAL_ATTACK: '#ec4899', // Rosa
    HURT: '#dc2626',        // Rojo oscuro
    DEAD: '#4b5563',        // Gris
};

// Tipo para posiciones interpoladas
interface InterpolatedPosition {
    x: number;
    y: number;
}

// Función de interpolación lineal
const lerp = (current: number, target: number, speed: number): number => {
    return current + (target - current) * speed;
};

const ArenaCanvas: React.FC<Props> = ({ gameState }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);
    const backgroundRef = useRef<HTMLImageElement | null>(null);
    
    // Posiciones visuales interpoladas (separadas del estado del servidor)
    const visualPositionsRef = useRef<{
        player1: InterpolatedPosition;
        player2: InterpolatedPosition;
        initialized: boolean;
    }>({
        player1: { x: 100, y: GROUND_Y - FIGHTER_HEIGHT },
        player2: { x: CANVAS_WIDTH - 160, y: GROUND_Y - FIGHTER_HEIGHT },
        initialized: false
    });

    /**
     * Dibuja un fighter con indicadores visuales de su estado
     * Usa posiciones interpoladas para movimiento suave
     */
    const drawFighter = useCallback((
        ctx: CanvasRenderingContext2D, 
        fighter: Fighter, 
        visualPos: InterpolatedPosition,
        isPlayer1: boolean
    ) => {
        const x = visualPos.x;
        const y = visualPos.y;
        const baseColor = isPlayer1 ? '#3b82f6' : '#ef4444';
        const actionColor = ACTION_COLORS[fighter.currentAction] || baseColor;

        // Sombra del fighter
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(
            x + FIGHTER_WIDTH / 2, 
            GROUND_Y + 5, 
            FIGHTER_WIDTH / 2, 
            10, 
            0, 0, Math.PI * 2
        );
        ctx.fill();

        // Cuerpo del fighter
        ctx.fillStyle = actionColor;
        ctx.fillRect(x, y, FIGHTER_WIDTH, FIGHTER_HEIGHT);

        // Borde del fighter
        ctx.strokeStyle = isPlayer1 ? '#1d4ed8' : '#b91c1c';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, FIGHTER_WIDTH, FIGHTER_HEIGHT);

        // Indicador de dirección (flecha)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        if (fighter.direction === 'RIGHT') {
            ctx.moveTo(x + FIGHTER_WIDTH - 10, y + FIGHTER_HEIGHT / 2);
            ctx.lineTo(x + FIGHTER_WIDTH - 20, y + FIGHTER_HEIGHT / 2 - 10);
            ctx.lineTo(x + FIGHTER_WIDTH - 20, y + FIGHTER_HEIGHT / 2 + 10);
        } else {
            ctx.moveTo(x + 10, y + FIGHTER_HEIGHT / 2);
            ctx.lineTo(x + 20, y + FIGHTER_HEIGHT / 2 - 10);
            ctx.lineTo(x + 20, y + FIGHTER_HEIGHT / 2 + 10);
        }
        ctx.fill();

        // Indicador de bloqueo
        if (fighter.isBlocking) {
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(x + FIGHTER_WIDTH / 2, y + FIGHTER_HEIGHT / 2, 40, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Indicador de ataque (flash)
        if (fighter.currentAction === 'BASIC_ATTACK' || fighter.currentAction === 'SPECIAL_ATTACK') {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            const attackX = fighter.direction === 'RIGHT' ? x + FIGHTER_WIDTH : x - 30;
            ctx.fillRect(attackX, y + 20, 30, 30);
        }

        // Indicador de daño (efecto de parpadeo)
        if (fighter.currentAction === 'HURT') {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
            ctx.fillRect(x - 5, y - 5, FIGHTER_WIDTH + 10, FIGHTER_HEIGHT + 10);
        }

        // Nombre del personaje encima
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(fighter.characterName || (isPlayer1 ? 'P1' : 'P2'), x + FIGHTER_WIDTH / 2, y - 10);

        // Indicador de acción actual
        ctx.font = '10px Arial';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(fighter.currentAction, x + FIGHTER_WIDTH / 2, y - 25);
    }, []);

    /**
     * Dibuja el suelo/arena
     */
    const drawArena = useCallback((ctx: CanvasRenderingContext2D) => {
        // Línea del suelo
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

        // Borde superior del suelo
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y);
        ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
        ctx.stroke();
    }, []);

    /**
     * Dibuja información de debug/estado
     */
    const drawDebugInfo = useCallback((ctx: CanvasRenderingContext2D, gameState: Fight) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(5, 5, 150, 60);

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';

        ctx.fillText(`P1: (${Math.round(gameState.player1.posX)}, ${Math.round(gameState.player1.posY)})`, 10, 20);
        ctx.fillText(`P2: (${Math.round(gameState.player2.posX)}, ${Math.round(gameState.player2.posY)})`, 10, 35);
        ctx.fillText(`Active: ${gameState.active ? 'YES' : 'NO'}`, 10, 50);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Cargar imagen de fondo
        if (!backgroundRef.current) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = backgroundImage;
            backgroundRef.current = img;
        }

        const render = () => {
            // Limpiar canvas
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // Dibujar fondo
            if (backgroundRef.current?.complete) {
                ctx.drawImage(backgroundRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            } else {
                // Fondo de respaldo si la imagen no carga
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }

            // Dibujar arena/suelo
            drawArena(ctx);

            if (gameState) {
                const vp = visualPositionsRef.current;
                
                // Inicializar posiciones visuales en el primer frame
                if (!vp.initialized) {
                    vp.player1.x = gameState.player1.posX;
                    vp.player1.y = gameState.player1.posY;
                    vp.player2.x = gameState.player2.posX;
                    vp.player2.y = gameState.player2.posY;
                    vp.initialized = true;
                }
                
                // Interpolar posiciones hacia el objetivo del servidor
                vp.player1.x = lerp(vp.player1.x, gameState.player1.posX, LERP_SPEED);
                vp.player1.y = lerp(vp.player1.y, gameState.player1.posY, LERP_SPEED);
                vp.player2.x = lerp(vp.player2.x, gameState.player2.posX, LERP_SPEED);
                vp.player2.y = lerp(vp.player2.y, gameState.player2.posY, LERP_SPEED);

                // Dibujar fighters con posiciones interpoladas
                drawFighter(ctx, gameState.player1, vp.player1, true);
                drawFighter(ctx, gameState.player2, vp.player2, false);

                // Info de debug (puedes comentar esto en producción)
                // drawDebugInfo(ctx, gameState);

                // Overlay si la pelea no está activa
                if (!gameState.active) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 36px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('PRESIONA START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
                }
            } else {
                // Estado de carga
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Cargando pelea...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            }

            animationFrameRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [gameState, drawFighter, drawArena, drawDebugInfo]);

    return (
        <canvas 
            ref={canvasRef} 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT} 
            className="rounded-lg shadow-2xl border-4 border-zinc-800 max-w-full"
        />
    );
};

export default ArenaCanvas;
