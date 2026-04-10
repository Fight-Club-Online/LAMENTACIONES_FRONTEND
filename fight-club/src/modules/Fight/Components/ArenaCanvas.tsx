import React, { useRef, useEffect } from 'react';
import type { Fight, Fighter, FighterAction } from '../types/fight';
import backgroundImage from '../../../assets/Background.jpeg';

interface Props { gameState: Fight | null; }

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const FIGHTER_WIDTH = 60;
const FIGHTER_HEIGHT = 120;

const GROUND_Y = CANVAS_HEIGHT - 20; 
const LERP_SPEED = 0.60;

const ACTION_THEMES: Record<FighterAction, { color: string; glow: string }> = {
    IDLE: { color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },
    MOVE_LEFT: { color: '#60a5fa', glow: 'rgba(96, 165, 250, 0.3)' },
    MOVE_RIGHT: { color: '#60a5fa', glow: 'rgba(96, 165, 250, 0.3)' },
    JUMP: { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.6)' },
    BLOCK: { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.8)' },
    BASIC_ATTACK: { color: '#ffffff', glow: 'rgba(255, 255, 255, 0.8)' },
    SPECIAL_ATTACK: { color: '#ec4899', glow: 'rgba(236, 72, 153, 0.9)' },
    HURT: { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.8)' },
    DEAD: { color: '#27272a', glow: 'rgba(0, 0, 0, 0)' },
};

const lerp = (current: number, target: number, speed: number) =>
    current + (target - current) * speed;

export const ArenaCanvas: React.FC<Props> = ({ gameState }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);
    const backgroundRef = useRef<HTMLImageElement | null>(null);
    const gameStateRef = useRef<Fight | null>(null);
    const visualPositionsRef = useRef({
        player1: { x: 80, y: GROUND_Y - FIGHTER_HEIGHT },
        player2: { x: CANVAS_WIDTH - 140, y: GROUND_Y - FIGHTER_HEIGHT },
        initialized: false,
    });

    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!backgroundRef.current) {
            const img = new Image();
            img.src = backgroundImage;
            backgroundRef.current = img;
        }

        const drawFighter = (ctx: CanvasRenderingContext2D, fighter: Fighter, pos: { x: number; y: number }, isP1: boolean) => {
            const theme = ACTION_THEMES[fighter.currentAction] || ACTION_THEMES.IDLE;
            const { x, y } = pos;

            // SOMBRA
            const distanceFromGround = Math.max(0, (GROUND_Y - FIGHTER_HEIGHT) - y);
            const shadowScale = Math.max(0.2, 1 - distanceFromGround / 150);
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            ctx.ellipse(x + FIGHTER_WIDTH / 2, GROUND_Y, (FIGHTER_WIDTH / 2) * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fill();

            // CUERPO CON ESTIRAMIENTO (Si cae rápido, se estira)
            const gradient = ctx.createLinearGradient(x, y, x + FIGHTER_WIDTH, y);
            gradient.addColorStop(0, isP1 ? '#1e40af' : '#991b1b');
            gradient.addColorStop(0.5, theme.color);
            gradient.addColorStop(1, isP1 ? '#1e40af' : '#991b1b');

            if (fighter.currentAction !== 'IDLE') {
                ctx.shadowBlur = 15;
                ctx.shadowColor = theme.glow;
            }

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, FIGHTER_WIDTH, FIGHTER_HEIGHT);
            ctx.shadowBlur = 0;

            // Ojo/Visor
            ctx.fillStyle = fighter.currentAction === 'HURT' ? '#ffffff' : '#000000';
            const eyeX = fighter.direction === 'RIGHT' ? x + FIGHTER_WIDTH - 15 : x + 5;
            ctx.fillRect(eyeX, y + 20, 10, 5);

            // Ataques
            if (fighter.currentAction.includes('ATTACK')) {
                const isSpecial = fighter.currentAction === 'SPECIAL_ATTACK';
                ctx.fillStyle = isSpecial ? 'rgba(236, 72, 153, 0.6)' : 'rgba(255, 255, 255, 0.4)';
                const attackAreaX = fighter.direction === 'RIGHT' ? x + FIGHTER_WIDTH : x - 40;
                ctx.beginPath();
                ctx.arc(attackAreaX + 20, y + 40, isSpecial ? 50 : 30, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        const render = () => {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            if (backgroundRef.current?.complete) {
                ctx.drawImage(backgroundRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; 
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }

            const state = gameStateRef.current;
            if (state) {
                const vp = visualPositionsRef.current;
                if (!vp.initialized) {
                    vp.player1 = { x: state.player1.posX, y: state.player1.posY };
                    vp.player2 = { x: state.player2.posX, y: state.player2.posY };
                    vp.initialized = true;
                }

                vp.player1.x = lerp(vp.player1.x, state.player1.posX, LERP_SPEED);
                vp.player1.y = lerp(vp.player1.y, state.player1.posY, LERP_SPEED);
                vp.player2.x = lerp(vp.player2.x, state.player2.posX, LERP_SPEED);
                vp.player2.y = lerp(vp.player2.y, state.player2.posY, LERP_SPEED);

                drawFighter(ctx, state.player1, vp.player1, true);
                drawFighter(ctx, state.player2, vp.player2, false);
            }

            animationFrameRef.current = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full object-contain drop-shadow-2xl"
        />
    );
};
export default ArenaCanvas;