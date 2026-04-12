import React, { useRef, useEffect } from 'react';
import type { Fight, Fighter } from '../../types/fight';
import backgroundImage from '../../../../assets/Background.jpeg';
import { CANVAS_CONFIG, ACTION_STYLES, ACTION_COLORS_HEX } from './ArenaVisuals';

interface Props {
    gameState: Fight | null;
}

const LERP_SPEED = 0.25;
const GROUND_Y = CANVAS_CONFIG.HEIGHT - CANVAS_CONFIG.GROUND_Y_OFFSET;

const ArenaCanvas: React.FC<Props> = ({ gameState }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);
    const backgroundRef = useRef<HTMLImageElement | null>(null);
    const gameStateRef = useRef<Fight | null>(null);

    const visualPositionsRef = useRef({
        player1: { x: 100, y: GROUND_Y - CANVAS_CONFIG.FIGHTER_HEIGHT },
        player2: { x: CANVAS_CONFIG.WIDTH - 165, y: GROUND_Y - CANVAS_CONFIG.FIGHTER_HEIGHT },
    });

    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        if (!backgroundRef.current) {
            const img = new Image();
            img.src = backgroundImage;
            backgroundRef.current = img;
        }

        const drawFighter = (ctx: CanvasRenderingContext2D, fighter: Fighter, pos: { x: number, y: number }) => {
            const { x, y } = pos;
            const health = fighter.health?.currentHealth ?? 0;
            const isDead = health <= 0;
            const action = fighter.currentAction as string;
            const actionColor = isDead ? '#4b5563' : (ACTION_STYLES[action] || ACTION_STYLES.IDLE);

            // Sombra/Suelo 
            ctx.fillStyle = isDead ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.ellipse(x + CANVAS_CONFIG.FIGHTER_WIDTH / 2, GROUND_Y, 35, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Cuerpo del Guerrero
            ctx.save();
            if (isDead) {
                ctx.filter = 'grayscale(100%) brightness(0.7)';
                ctx.translate(0, 5); 
            }

            ctx.shadowBlur = action === 'HURT' && !isDead ? 25 : isDead ? 0 : 15;
            ctx.shadowColor = actionColor;
            ctx.fillStyle = actionColor;
            ctx.beginPath();
            ctx.roundRect(x, y, CANVAS_CONFIG.FIGHTER_WIDTH, CANVAS_CONFIG.FIGHTER_HEIGHT, 10);
            ctx.fill();
            
            // Ojo
            ctx.fillStyle = isDead ? '#2d3748' : 'white'; 
            const eyeX = fighter.direction === 'RIGHT' ? x + 42 : x + 8;
            ctx.fillRect(eyeX, y + 25, 15, 6);
            
            ctx.restore();
        };

        const render = () => {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, CANVAS_CONFIG.WIDTH, CANVAS_CONFIG.HEIGHT);

            if (backgroundRef.current?.complete) {
                ctx.save();
                ctx.filter = 'brightness(0.6)';
                ctx.drawImage(backgroundRef.current, 0, 0, CANVAS_CONFIG.WIDTH, CANVAS_CONFIG.HEIGHT);
                
                const gradient = ctx.createRadialGradient(
                    CANVAS_CONFIG.WIDTH / 2, CANVAS_CONFIG.HEIGHT / 2, 0,
                    CANVAS_CONFIG.WIDTH / 2, CANVAS_CONFIG.HEIGHT / 2, CANVAS_CONFIG.WIDTH / 1.2
                );
                gradient.addColorStop(0, 'rgba(0,0,0,0)');
                gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, CANVAS_CONFIG.WIDTH, CANVAS_CONFIG.HEIGHT);
                ctx.restore();
            }

            const state = gameStateRef.current;
            if (state) {
                const vp = visualPositionsRef.current;
                vp.player1.x = (1 - LERP_SPEED) * vp.player1.x + LERP_SPEED * state.player1.posX;
                vp.player1.y = (1 - LERP_SPEED) * vp.player1.y + LERP_SPEED * state.player1.posY;
                vp.player2.x = (1 - LERP_SPEED) * vp.player2.x + LERP_SPEED * state.player2.posX;
                vp.player2.y = (1 - LERP_SPEED) * vp.player2.y + LERP_SPEED * state.player2.posY;

                drawFighter(ctx, state.player1, vp.player1);
                drawFighter(ctx, state.player2, vp.player2);
            }
            animationFrameRef.current = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, []);

    const getDominantColor = () => {
        if (!gameState) return ACTION_COLORS_HEX.IDLE;
        
        if ((gameState.player1.health?.currentHealth ?? 0) <= 0 || (gameState.player2.health?.currentHealth ?? 0) <= 0) {
            return '#374151'; 
        }

        const p1 = gameState.player1.currentAction;
        const p2 = gameState.player2.currentAction;

        if (p1 === 'HURT' || p2 === 'HURT') return ACTION_COLORS_HEX.HURT;
        if (p2 !== 'IDLE') return ACTION_COLORS_HEX[p2] || ACTION_COLORS_HEX.IDLE;
        return ACTION_COLORS_HEX[p1] || ACTION_COLORS_HEX.IDLE;
    };

    const borderColor = getDominantColor();
    const isAnyoneHurt = gameState?.player1.currentAction === 'HURT' || gameState?.player2.currentAction === 'HURT';

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center p-2 md:p-6 bg-transparent overflow-hidden">
            <div className="relative w-full aspect-video transition-all duration-300">
                <div 
                    className={`absolute -inset-4 md:-inset-12 rounded-full blur-[50px] md:blur-[100px] transition-all duration-500 ${isAnyoneHurt ? 'opacity-50 scale-110' : 'opacity-20'}`}
                    style={{ backgroundColor: borderColor }}
                ></div>

                <div 
                    className="relative w-full h-full rounded-xl p-[1px] md:p-[3px] transition-all duration-200"
                    style={{ 
                        backgroundColor: `${borderColor}66`, 
                        boxShadow: `0 0 30px ${borderColor}33` 
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_CONFIG.WIDTH}
                        height={CANVAS_CONFIG.HEIGHT}
                        className="w-full h-full rounded-lg shadow-2xl block bg-zinc-900"
                    />
                </div>
            </div>
        </div>
    );
};

export default ArenaCanvas;