import React, { useRef, useEffect } from 'react';
import type { Fight, Fighter, FighterAction } from '../types/fight';
import backgroundImage from '../../../assets/Background.jpeg';

interface Props {
    gameState: Fight | null;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const FIGHTER_WIDTH = 60;
const FIGHTER_HEIGHT = 120;
const GROUND_Y = CANVAS_HEIGHT - 50;
const LERP_SPEED = 0.25;

const ACTION_COLORS: Record<FighterAction, string> = {
    IDLE: '#3b82f6',
    MOVE_LEFT: '#06b6d4',
    MOVE_RIGHT: '#06b6d4',
    JUMP: '#8b5cf6',
    BLOCK: '#f59e0b',
    BASIC_ATTACK: '#ef4444',
    SPECIAL_ATTACK: '#ec4899',
    HURT: '#dc2626',
    DEAD: '#4b5563',
};

interface VisualPositions {
    player1: { x: number; y: number };
    player2: { x: number; y: number };
    initialized: boolean;
}

const lerp = (current: number, target: number, speed: number) =>
    current + (target - current) * speed;

const ArenaCanvas: React.FC<Props> = ({ gameState }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);
    const backgroundRef = useRef<HTMLImageElement | null>(null);

    // El ref que el loop siempre lee — nunca queda stale
    const gameStateRef = useRef<Fight | null>(null);

    const visualPositionsRef = useRef<VisualPositions>({
        player1: { x: 100, y: GROUND_Y - FIGHTER_HEIGHT },
        player2: { x: CANVAS_WIDTH - 160, y: GROUND_Y - FIGHTER_HEIGHT },
        initialized: false,
    });

    // Sincronizar el ref cuando cambia la prop — sin recrear el loop
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // El loop de animación se crea UNA sola vez
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!backgroundRef.current) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = backgroundImage;
            backgroundRef.current = img;
        }

        const drawFighter = (
            ctx: CanvasRenderingContext2D,
            fighter: Fighter,
            visualPos: { x: number; y: number },
            isPlayer1: boolean
        ) => {
            const { x, y } = visualPos;
            const baseColor = isPlayer1 ? '#3b82f6' : '#ef4444';
            const actionColor = ACTION_COLORS[fighter.currentAction] ?? baseColor;

            // Sombra
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(x + FIGHTER_WIDTH / 2, GROUND_Y + 5, FIGHTER_WIDTH / 2, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // Cuerpo
            ctx.fillStyle = actionColor;
            ctx.fillRect(x, y, FIGHTER_WIDTH, FIGHTER_HEIGHT);

            // Borde
            ctx.strokeStyle = isPlayer1 ? '#1d4ed8' : '#b91c1c';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, FIGHTER_WIDTH, FIGHTER_HEIGHT);

            // Indicador de dirección
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

            // Bloqueo
            if (fighter.isBlocking) {
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(x + FIGHTER_WIDTH / 2, y + FIGHTER_HEIGHT / 2, 40, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Flash de ataque
            if (fighter.currentAction === 'BASIC_ATTACK' || fighter.currentAction === 'SPECIAL_ATTACK') {
                ctx.fillStyle = 'rgba(255,255,0,0.3)';
                const attackX = fighter.direction === 'RIGHT' ? x + FIGHTER_WIDTH : x - 30;
                ctx.fillRect(attackX, y + 20, 30, 30);
            }

            // Efecto de daño
            if (fighter.currentAction === 'HURT') {
                ctx.fillStyle = 'rgba(255,0,0,0.4)';
                ctx.fillRect(x - 5, y - 5, FIGHTER_WIDTH + 10, FIGHTER_HEIGHT + 10);
            }

            // Nombre y acción
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(fighter.characterName ?? (isPlayer1 ? 'P1' : 'P2'), x + FIGHTER_WIDTH / 2, y - 10);
            ctx.font = '10px Arial';
            ctx.fillStyle = '#fbbf24';
            ctx.fillText(fighter.currentAction, x + FIGHTER_WIDTH / 2, y - 25);
        };

        const drawArena = (ctx: CanvasRenderingContext2D) => {
            ctx.fillStyle = '#3f3f46';
            ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
            ctx.strokeStyle = '#71717a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, GROUND_Y);
            ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
            ctx.stroke();
        };

        const render = () => {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            if (backgroundRef.current?.complete) {
                ctx.drawImage(backgroundRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            } else {
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }

            drawArena(ctx);

            // Leer siempre el estado más fresco desde el ref
            const state = gameStateRef.current;

            if (state) {
                const vp = visualPositionsRef.current;

                if (!vp.initialized) {
                    vp.player1.x = state.player1.posX;
                    vp.player1.y = state.player1.posY;
                    vp.player2.x = state.player2.posX;
                    vp.player2.y = state.player2.posY;
                    vp.initialized = true;
                }

                // Interpolar hacia la posición del servidor
                vp.player1.x = lerp(vp.player1.x, state.player1.posX, LERP_SPEED);
                vp.player1.y = lerp(vp.player1.y, state.player1.posY, LERP_SPEED);
                vp.player2.x = lerp(vp.player2.x, state.player2.posX, LERP_SPEED);
                vp.player2.y = lerp(vp.player2.y, state.player2.posY, LERP_SPEED);

                drawFighter(ctx, state.player1, vp.player1, true);
                drawFighter(ctx, state.player2, vp.player2, false);

                if (!state.active) {
                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 36px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('PRESIONA START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
                }
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Cargando pelea...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            }

            animationFrameRef.current = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationFrameRef.current);
    }, []); // <- sin dependencias: el loop vive toda la vida del componente

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