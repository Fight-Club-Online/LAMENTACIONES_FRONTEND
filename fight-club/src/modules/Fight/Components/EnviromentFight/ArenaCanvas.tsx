import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Fight, Fighter } from '../../types/fight';
import type { CharacterAssets } from '../../../Lobby/Config/axiosLobby';
import { lobbyApi } from '../../../Lobby/Config/axiosLobby';
import backgroundImage from '../../../../assets/Background.jpeg';
import { CANVAS_CONFIG, ACTION_COLORS_HEX } from './ArenaVisuals';
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

const getSpriteKey = (fighter: Fighter) => `${fighter.userId}:${fighter.characterId ?? 'no-character'}`;

const getSpriteAnimationClass = (action: Fighter['currentAction']) => {
    if (action === 'MOVE_LEFT' || action === 'MOVE_RIGHT') return 'fight-sprite-run';
    if (action === 'BASIC_ATTACK' || action === 'SPECIAL_ATTACK') return 'fight-sprite-attack';
    return 'fight-sprite-idle';
};

const getSpriteAssetUrl = (assets: CharacterAssets | undefined, action: Fighter['currentAction'], isDead: boolean) => {
    if (!assets) return undefined;
    if (isDead) return assets.idle_url || assets.run_url || assets.attack_url || assets.hurt_url;
    if (action === 'MOVE_LEFT' || action === 'MOVE_RIGHT') return assets.run_url || assets.idle_url || assets.attack_url;
    if (action === 'BASIC_ATTACK' || action === 'SPECIAL_ATTACK') return assets.attack_url || assets.idle_url || assets.run_url;
    return assets.idle_url || assets.run_url || assets.attack_url || assets.hurt_url;
};

const getSpriteGlowColor = (action: Fighter['currentAction'], isDead: boolean) => {
    if (isDead) return ACTION_COLORS_HEX.DEAD;
    return ACTION_COLORS_HEX[action] || ACTION_COLORS_HEX.IDLE;
};

const getSpriteScale = (width: number, height: number) => Math.min(width / 42, height / 50);

const ArenaCanvas: React.FC<Props> = ({ gameState }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);
    const backgroundRef = useRef<HTMLImageElement | null>(null);
    const gameStateRef = useRef<Fight | null>(null);
    const player1SpriteRef = useRef<HTMLDivElement>(null);
    const player2SpriteRef = useRef<HTMLDivElement>(null);
    const [characterAssets, setCharacterAssets] = useState<Map<string, CharacterAssets>>(new Map());

    const visualPositionsRef = useRef({
        player1: { x: 100, y: GROUND_Y - CANVAS_CONFIG.FIGHTER_HEIGHT },
        player2: { x: CANVAS_CONFIG.WIDTH - 165, y: GROUND_Y - CANVAS_CONFIG.FIGHTER_HEIGHT },
    });

    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

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

        const updateSpriteElement = (
            element: HTMLDivElement | null,
            fighter: Fighter,
            pos: { x: number, y: number }
        ) => {
            if (!element) return;

            const sprite = element.firstElementChild as HTMLDivElement | null;

            const isDead = (fighter.health?.currentHealth ?? 0) <= 0;
            const action = fighter.currentAction;
            const assets = characterAssets.get(getSpriteKey(fighter));
            const spriteUrl = getSpriteAssetUrl(assets, action, isDead);
            const glowColor = getSpriteGlowColor(action, isDead);
            const slotWidth = CANVAS_CONFIG.FIGHTER_WIDTH * 1.5;
            const slotHeight = CANVAS_CONFIG.FIGHTER_HEIGHT * 1.5;
            const scale = getSpriteScale(slotWidth, slotHeight);

            element.style.left = `${(pos.x / CANVAS_CONFIG.WIDTH) * 100}%`;
            element.style.top = `${((pos.y - 10) / CANVAS_CONFIG.HEIGHT) * 100}%`;
            element.style.setProperty('--sprite-glow', glowColor);
            element.style.width = `${(slotWidth / CANVAS_CONFIG.WIDTH) * 100}%`;
            element.style.height = `${(slotHeight / CANVAS_CONFIG.HEIGHT) * 100}%`; 
            element.style.opacity = isDead ? '0.9' : '1';
            element.style.setProperty('--sprite-direction', fighter.direction === 'LEFT' ? '-1' : '1');

            if (sprite) {
                const spriteClass = getSpriteAnimationClass(action);
                sprite.style.backgroundImage = spriteUrl ? `url(${spriteUrl})` : 'none';
                sprite.style.filter = isDead
                    ? `grayscale(100%) brightness(0.75) drop-shadow(0 0 6px ${glowColor}66)`
                    : `drop-shadow(0 0 6px ${glowColor}88)`;
                sprite.style.setProperty('--sprite-scale', String(scale * 2.3));
                sprite.style.setProperty('--sprite-offset-y', '-30px');

                // Update the class to trigger the correct CSS animation
                sprite.className = `fight-sprite-sheet ${spriteClass}`;
            }
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

                updateSpriteElement(player1SpriteRef.current, state.player1, vp.player1);
                updateSpriteElement(player2SpriteRef.current, state.player2, vp.player2);
            }

            animationFrameRef.current = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [characterAssets]);

    const dominantColor = useMemo(() => {
        if (!gameState) return ACTION_COLORS_HEX.IDLE;
        if ((gameState.player1.health?.currentHealth ?? 0) <= 0 || (gameState.player2.health?.currentHealth ?? 0) <= 0) return '#374151';
        const p1 = gameState.player1.currentAction;
        const p2 = gameState.player2.currentAction;
        if (p1 === 'HURT' || p2 === 'HURT') return ACTION_COLORS_HEX.HURT;
        if (p2 !== 'IDLE') return ACTION_COLORS_HEX[p2] || ACTION_COLORS_HEX.IDLE;
        return ACTION_COLORS_HEX[p1] || ACTION_COLORS_HEX.IDLE;
    }, [gameState]);

    const borderColor = dominantColor;
    const isAnyoneHurt = gameState?.player1.currentAction === 'HURT' || gameState?.player2.currentAction === 'HURT';

    const renderSprite = (fighter: Fighter, ref: React.RefObject<HTMLDivElement | null>) => {
        const isDead = (fighter.health?.currentHealth ?? 0) <= 0;
        const spriteClass = getSpriteAnimationClass(fighter.currentAction);
        const spriteUrl = getSpriteAssetUrl(characterAssets.get(getSpriteKey(fighter)), fighter.currentAction, isDead);
        const glowColor = getSpriteGlowColor(fighter.currentAction, isDead);
        const slotWidth = CANVAS_CONFIG.FIGHTER_WIDTH * 1.5;
        const slotHeight = CANVAS_CONFIG.FIGHTER_HEIGHT * 1.5;
        const scale = getSpriteScale(slotWidth, slotHeight);

        return (
            <div
                ref={ref}
                className="fight-sprite-slot"
                style={{
                    width: `${(slotWidth / CANVAS_CONFIG.WIDTH) * 100}%`,
                    height: `${(slotHeight / CANVAS_CONFIG.HEIGHT) * 100}%`,
                    left: `${(fighter.posX / CANVAS_CONFIG.WIDTH) * 100}%`,
                    top: `${((fighter.posY - 10) / CANVAS_CONFIG.HEIGHT) * 100}%`,
                    opacity: isDead ? 0.9 : 1,
                    boxShadow: `0 0 10px ${glowColor}55`,
                    ['--sprite-direction' as string]: fighter.direction === 'LEFT' ? '-1' : '1',
                } as React.CSSProperties}
            >
                <div
                    className={`fight-sprite-sheet ${spriteClass}`}
                    style={{
                        backgroundImage: spriteUrl ? `url(${spriteUrl})` : 'none',
                        filter: isDead
                            ? `grayscale(100%) brightness(0.75) drop-shadow(0 0 6px ${glowColor}66)`
                            : `drop-shadow(0 0 6px ${glowColor}88)`,
                        ['--sprite-scale' as string]: String(scale * 2.3),
                        ['--sprite-offset-y' as string]: '-30px',
                    } as React.CSSProperties}
                />
            </div>
        );
    };

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center p-2 md:p-6 bg-transparent overflow-hidden">
            <div className="relative w-full aspect-video transition-all duration-300">
                <div
                    className={`absolute -inset-4 md:-inset-12 rounded-full blur-[50px] md:blur-[100px] transition-all duration-500 ${isAnyoneHurt ? 'opacity-50 scale-110' : 'opacity-20'}`}
                    style={{ backgroundColor: borderColor }}
                />
                <div
                    className="relative w-full h-full rounded-xl p-[1px] md:p-[3px] transition-all duration-200"
                    style={{ backgroundColor: `${borderColor}66`, boxShadow: `0 0 30px ${borderColor}33` }}
                >
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_CONFIG.WIDTH}
                        height={CANVAS_CONFIG.HEIGHT}
                        className="w-full h-full rounded-lg shadow-2xl block bg-zinc-900"
                    />
                    {gameState && (
                        <div className="absolute inset-0 z-20">
                            {renderSprite(gameState.player1, player1SpriteRef)}
                            {renderSprite(gameState.player2, player2SpriteRef)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ArenaCanvas;
