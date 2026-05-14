import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Fight, Fighter } from '../../types/fight';
import type { CharacterAssets } from '../../../Lobby/Config/axiosLobby';
import { lobbyApi } from '../../../Lobby/Config/axiosLobby';
import backgroundImage from '../../../../assets/Background.jpeg';
import { CANVAS_CONFIG, ACTION_COLORS_HEX } from './ArenaVisuals';
import SpriteRenderer from './SpriteRenderer';
import { getSpriteKey } from "../../utils/spriteUtils";
import '../../styles/fight-sprites.css';

interface Props {
    gameState: Fight | null;
}

const LERP_SPEED = 0.4;
const GROUND_Y = CANVAS_CONFIG.HEIGHT - CANVAS_CONFIG.GROUND_Y_OFFSET;
const AZURE_BACKEND_URL = 'https://lobbyservices-f7dghrebachxetg4.mexicocentral-01.azurewebsites.net';

const fixAssetUrl = (url: string | undefined): string | undefined => {
    if (url && url.includes('localhost:8080')) {
        return url.replace('http://localhost:8080', AZURE_BACKEND_URL);
    }
    return url;
};

const getSpriteScale = (width: number, height: number) => Math.min(width / 42, height / 50);

const ArenaCanvas: React.FC<Props> = ({ gameState }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);
    const backgroundRef = useRef<HTMLImageElement | null>(null);
    const gameStateRef = useRef<Fight | null>(null);
    const [characterAssets, setCharacterAssets] = useState<Map<string, CharacterAssets>>(new Map());

    const visualPositionsRef = useRef({
        player1: { x: 100, y: GROUND_Y - CANVAS_CONFIG.FIGHTER_HEIGHT - 40 },
        player2: { x: CANVAS_CONFIG.WIDTH - 165, y: GROUND_Y - CANVAS_CONFIG.FIGHTER_HEIGHT - 40 },
    });

    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    // Cargar assets de personajes
    useEffect(() => {
        let cancelled = false;

        const loadAssets = async () => {
            if (!gameState) {
                setCharacterAssets(new Map());
                return;
            }

            const fighters = [gameState.player1, gameState.player2].filter(
                (fighter) => fighter.hasCharacter && fighter.characterId != null
            );

            if (fighters.length === 0) {
                setCharacterAssets(new Map());
                return;
            }

            const entries = await Promise.all(
                fighters.map(async (fighter) => {
                    const characterId = fighter.characterId as number;
                    try {
                        const assets = await lobbyApi.getUserCharacterAssets(fighter.userId, characterId.toString());
                        const fixedAssets: CharacterAssets = {
                            idle_url: fixAssetUrl(assets.idle_url),
                            run_url: fixAssetUrl(assets.run_url),
                            attack_url: fixAssetUrl(assets.attack_url),
                            hurt_url: fixAssetUrl(assets.hurt_url),
                        };
                        return [getSpriteKey(fighter), fixedAssets] as const;
                    } catch (error) {
                        console.error(`Error cargando assets para characterId ${characterId}:`, error);
                        return null;
                    }
                })
            );

            if (cancelled) return;

            const nextAssets = new Map<string, CharacterAssets>();
            entries.forEach((entry) => {
                if (!entry) return;
                nextAssets.set(entry[0], entry[1]);
            });
            setCharacterAssets(nextAssets);
        };

        void loadAssets();

        return () => { cancelled = true; };
    }, [gameState?.player1.userId, gameState?.player1.characterId, gameState?.player1.hasCharacter, gameState?.player2.userId, gameState?.player2.characterId, gameState?.player2.hasCharacter]);

    // Renderizar canvas y actualizar positions con LERP
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

<<<<<<< Updated upstream
        const drawFighter = (ctx: CanvasRenderingContext2D, fighter: Fighter, pos: { x: number, y: number }) => {
            const { x, y } = pos;
            const health = fighter.health?.currentHealth ?? 0;
            const isDead = health <= 0;
            const action = fighter.currentAction as string;
            
            const isBlocking = fighter.isBlocking;
            const actionColor = isDead 
                ? '#4b5563' 
                : isBlocking 
                    ? ACTION_COLORS_HEX.BLOCK 
                    : (ACTION_STYLES[action] || ACTION_STYLES.IDLE);

            ctx.fillStyle = isDead ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.ellipse(x + CANVAS_CONFIG.FIGHTER_WIDTH / 2, GROUND_Y, 35, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.save();
            if (isDead) {
                ctx.filter = 'grayscale(100%) brightness(0.7)';
                ctx.translate(0, 5); 
            }

            ctx.shadowBlur = (action === 'HURT' || isBlocking) && !isDead ? 30 : isDead ? 0 : 15;
            ctx.shadowColor = actionColor;
            ctx.fillStyle = actionColor;
            ctx.beginPath();
            ctx.roundRect(x, y, CANVAS_CONFIG.FIGHTER_WIDTH, CANVAS_CONFIG.FIGHTER_HEIGHT, 10);
            ctx.fill();
            
            ctx.fillStyle = isDead ? '#2d3748' : 'white'; 
            const eyeHeight = isBlocking ? 3 : 6;
            const eyeX = fighter.direction === 'RIGHT' ? x + 42 : x + 8;
            ctx.fillRect(eyeX, y + 25, 15, eyeHeight);
            
            ctx.restore();
        };

=======
>>>>>>> Stashed changes
        const render = () => {
            // Fondo
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, CANVAS_CONFIG.WIDTH, CANVAS_CONFIG.HEIGHT);

            // Imagen de fondo
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

            // Actualizar posiciones con LERP
            const state = gameStateRef.current;
            if (state) {
                const vp = visualPositionsRef.current;
                vp.player1.x = (1 - LERP_SPEED) * vp.player1.x + LERP_SPEED * state.player1.posX;
                vp.player1.y = (1 - LERP_SPEED) * vp.player1.y + LERP_SPEED * state.player1.posY;
                vp.player2.x = (1 - LERP_SPEED) * vp.player2.x + LERP_SPEED * state.player2.posX;
                vp.player2.y = (1 - LERP_SPEED) * vp.player2.y + LERP_SPEED * state.player2.posY;
            }

            animationFrameRef.current = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, []);

    // Calcular color dominante para borde
    const dominantColor = useMemo(() => {
        if (!gameState) return ACTION_COLORS_HEX.IDLE;
<<<<<<< Updated upstream
        if ((gameState.player1.health?.currentHealth ?? 0) <= 0 || (gameState.player2.health?.currentHealth ?? 0) <= 0) return '#374151'; 
        const p1 = gameState.player1;
        const p2 = gameState.player2;
        
        if (p1.currentAction === 'HURT' || p2.currentAction === 'HURT') return ACTION_COLORS_HEX.HURT;
        if (p1.isBlocking || p2.isBlocking) return ACTION_COLORS_HEX.BLOCK;
        if (p2.currentAction !== 'IDLE') return ACTION_COLORS_HEX[p2.currentAction] || ACTION_COLORS_HEX.IDLE;
        return ACTION_COLORS_HEX[p1.currentAction] || ACTION_COLORS_HEX.IDLE;
    };
=======
        if ((gameState.player1.health?.currentHealth ?? 0) <= 0 || (gameState.player2.health?.currentHealth ?? 0) <= 0) return '#374151';
        const p1 = gameState.player1.currentAction;
        const p2 = gameState.player2.currentAction;
        if (p1 === 'HURT' || p2 === 'HURT') return ACTION_COLORS_HEX.HURT;
        if (p2 !== 'IDLE') return ACTION_COLORS_HEX[p2] || ACTION_COLORS_HEX.IDLE;
        return ACTION_COLORS_HEX[p1] || ACTION_COLORS_HEX.IDLE;
    }, [gameState]);
>>>>>>> Stashed changes

    const isAnyoneHurt = gameState?.player1.currentAction === 'HURT' || gameState?.player2.currentAction === 'HURT';

    const slotWidth = CANVAS_CONFIG.FIGHTER_WIDTH * 1.2;
    const slotHeight = CANVAS_CONFIG.FIGHTER_HEIGHT * 1.2;
    const scale = getSpriteScale(slotWidth, slotHeight);

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center p-2 md:p-6 bg-transparent overflow-hidden">
            <div className="relative w-full aspect-video transition-all duration-300">
                <div
                    className={`absolute -inset-4 md:-inset-12 rounded-full blur-[50px] md:blur-[100px] transition-all duration-500 ${isAnyoneHurt ? 'opacity-50 scale-110' : 'opacity-20'}`}
                    style={{ backgroundColor: dominantColor }}
                />
                <div
                    className="relative w-full h-full rounded-xl p-[1px] md:p-[3px] transition-all duration-200"
                    style={{ backgroundColor: `${dominantColor}66`, boxShadow: `0 0 30px ${dominantColor}33` }}
                >
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_CONFIG.WIDTH}
                        height={CANVAS_CONFIG.HEIGHT}
                        className="w-full h-full rounded-lg shadow-2xl block bg-zinc-900"
                    />
                    {gameState && (
                        <div className="absolute inset-0 z-20">
                            <SpriteRenderer
                                fighter={gameState.player1}
                                position={visualPositionsRef.current.player1}
                                slotWidth={slotWidth}
                                slotHeight={slotHeight}
                                scale={scale * 2.3}
                                characterAssets={characterAssets}
                                canvasWidth={CANVAS_CONFIG.WIDTH}
                                canvasHeight={CANVAS_CONFIG.HEIGHT}
                                spriteKey={getSpriteKey(gameState.player1)}
                            />
                            <SpriteRenderer
                                fighter={gameState.player2}
                                position={visualPositionsRef.current.player2}
                                slotWidth={slotWidth}
                                slotHeight={slotHeight}
                                scale={scale * 2.3}
                                characterAssets={characterAssets}
                                canvasWidth={CANVAS_CONFIG.WIDTH}
                                canvasHeight={CANVAS_CONFIG.HEIGHT}
                                spriteKey={getSpriteKey(gameState.player2)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ArenaCanvas;