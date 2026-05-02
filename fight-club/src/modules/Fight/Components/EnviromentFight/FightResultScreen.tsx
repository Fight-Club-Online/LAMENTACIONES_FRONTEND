import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Fight } from '../../types/fight';

type Result = 'WIN' | 'LOSE' | 'DRAW';

interface Props {
    result: Result;
    gameState: Fight | null;
    userId: string;
    pointsChange?: number;
    player1Username?: string;
    player2Username?: string;
}

const REDIRECT_SECONDS = 10;

const RESULT_CONFIG = {
    WIN:  { label: 'VICTORIA', color: '#22c55e', glow: 'rgba(34,197,94,0.18)',  particle: '#22c55e' },
    LOSE: { label: 'DERROTA',  color: '#ef4444', glow: 'rgba(239,68,68,0.18)',  particle: '#ef4444' },
    DRAW: { label: 'EMPATE',   color: '#eab308', glow: 'rgba(234,179,8,0.18)',  particle: '#eab308' },
} as const;

interface Particle {
    x: number; y: number;
    vx: number; vy: number;
    size: number; alpha: number;
    decay: number; color: string;
}

function useParticles(color: string) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const frameRef  = useRef<number>(0);

    const spawn = useCallback((w: number, h: number): Particle[] =>
        Array.from({ length: 60 }, () => ({
            x:     Math.random() * w,
            y:     h + 10,
            vx:    (Math.random() - 0.5) * 1.4,
            vy:    -(1.8 + Math.random() * 3.2),
            size:  2 + Math.random() * 4,
            alpha: 0.7 + Math.random() * 0.3,
            decay: 0.004 + Math.random() * 0.006,
            color,
        }))
    , [color]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;

        const resize = () => {
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            particles.current = spawn(canvas.width, canvas.height);
        };
        resize();
        window.addEventListener('resize', resize);

        const loop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.current.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= p.decay;
                if (p.alpha <= 0) {
                    p.y     = canvas.height + 10;
                    p.x     = Math.random() * canvas.width;
                    p.alpha = 0.7 + Math.random() * 0.3;
                }
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.fillStyle   = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            });
            ctx.globalAlpha = 1;
            frameRef.current = requestAnimationFrame(loop);
        };
        loop();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(frameRef.current);
        };
    }, [spawn]);

    return canvasRef;
}

function initials(name?: string) {
    if (!name) return '??';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function hpPercent(current?: number, max?: number) {
    if (!current || !max || max === 0) return 0;
    return Math.round((current / max) * 100);
}

function hpColor(pct: number) {
    if (pct > 50) return '#16a34a';
    if (pct > 25) return '#ca8a04';
    return '#dc2626';
}

export const FightResultScreen: React.FC<Props> = ({ result, gameState, userId, pointsChange, player1Username, player2Username }) => {
    const navigate    = useNavigate();
    const [cd, setCd] = useState(REDIRECT_SECONDS);
    const cfg         = RESULT_CONFIG[result];
    const canvasRef   = useParticles(cfg.particle);

    const p1DisplayName = player1Username ?? gameState?.player1.characterName ?? 'P1';
    const p2DisplayName = player2Username ?? gameState?.player2.characterName ?? 'P2';

    const isPlayer1 = gameState?.player1.userId === userId;
    const myFighter = isPlayer1 ? gameState?.player1 : gameState?.player2;
    const rival     = isPlayer1 ? gameState?.player2 : gameState?.player1;

    const myHp     = hpPercent(myFighter?.health?.currentHealth, myFighter?.health?.maxHealth);
    const rivalHp  = hpPercent(rival?.health?.currentHealth,     rival?.health?.maxHealth);
    const winnerHp = result === 'WIN' ? myHp : rivalHp;
    const winnerHpColor = hpColor(winnerHp);

    const winnerStyle = { background: '#052e16', borderColor: '#16a34a', color: '#4ade80' };
    const loserStyle  = { background: '#1c1917', borderColor: '#57534e', color: '#78716c' };
    const drawStyle   = { background: '#1c1403', borderColor: '#a16207', color: '#facc15' };

    const p1Style = result === 'DRAW' ? drawStyle
        : (result === 'WIN'  ? (isPlayer1  ? winnerStyle : loserStyle)
                             : (isPlayer1  ? loserStyle  : winnerStyle));

    const p2Style = result === 'DRAW' ? drawStyle
        : (result === 'WIN'  ? (!isPlayer1 ? winnerStyle : loserStyle)
                             : (!isPlayer1 ? loserStyle  : winnerStyle));

    useEffect(() => {
        if (cd <= 0) { navigate('/lobby', { replace: true }); return; }
        const t = setTimeout(() => setCd(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cd, navigate]);

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 overflow-hidden"
            style={{ background: '#09090b' }}
        >
            {/* Partículas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* Glow radial */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 50% 35%, ${cfg.glow} 0%, transparent 65%)` }}
            />

            <div className="relative z-10 flex flex-col items-center w-full max-w-lg">

                <div className="text-[10px] tracking-[.35em] text-zinc-500 uppercase mb-4 px-4 py-1 border border-zinc-800 rounded-full">
                    Resultado de la partida
                </div>

                <h1
                    className="font-black italic tracking-tighter leading-none text-7xl md:text-8xl mb-1"
                    style={{ color: cfg.color }}
                >
                    {cfg.label}
                </h1>

                <p className="text-zinc-500 font-bold tracking-[.4em] uppercase text-sm mb-8">
                    K . O .
                </p>

                {/* Jugadores */}
                <div className="flex items-center gap-8 mb-6">
                    <div className="flex flex-col items-center gap-2">
                        <div
                            className="w-14 h-14 rounded-full flex items-center justify-center font-black text-lg border-2"
                            style={p1Style}
                        >
                            {initials(p1DisplayName)}
                        </div>
                        <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: p1Style.color }}>
                            {p1DisplayName}
                        </span>
                    </div>

                    <span className="text-zinc-700 font-black tracking-widest text-xs">VS</span>

                    <div className="flex flex-col items-center gap-2">
                        <div
                            className="w-14 h-14 rounded-full flex items-center justify-center font-black text-lg border-2"
                            style={p2Style}
                        >
                            {initials(p2DisplayName)}
                        </div>
                        <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: p2Style.color }}>
                            {p2DisplayName}
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-3 mb-6">
                    {[
                        { label: 'Tu HP',    value: `${myHp}%`,    color: hpColor(myHp) },
                        { label: 'HP rival', value: `${rivalHp}%`, color: '#71717a'      },
                        { label: 'Nivel',    value: String(myFighter?.characterLevel ?? '?'), color: '#a78bfa' },
                    ].map(s => (
                    <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-center min-w-[80px]">
                        <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">{s.label}</p>
                        <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                    </div>
                    ))}
                    
                    {/* Card de puntos dentro del mismo flex */}
                    {pointsChange !== undefined && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-center min-w-[80px]">
                            <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">Puntos</p>
                            <p className="text-xl font-black" style={{
                                color: pointsChange >= 0 ? '#22c55e' : '#ef4444'
                            }}>
                                {pointsChange >= 0 ? `+${pointsChange}` : pointsChange}
                                </p>
                        </div>
                    )}
                </div>

                {/* Barra HP del ganador */}
                {result !== 'DRAW' && (
                    <div className="w-full mb-6">
                        <div className="flex justify-between text-[9px] text-zinc-600 uppercase tracking-widest mb-2">
                            <span>Vida restante del ganador</span>
                            <span style={{ color: winnerHpColor }}>{winnerHp}%</span>
                        </div>
                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{ width: `${winnerHp}%`, background: winnerHpColor }}
                            />
                        </div>
                    </div>
                )}

                {/* Botón lobby */}
                <button
                    onClick={() => navigate('/lobby', { replace: true })}
                    className="bg-white text-black font-black text-[13px] tracking-[.2em] uppercase px-10 py-4 rounded-xl hover:opacity-85 active:scale-95 transition-all mb-6 cursor-pointer"
                >
                    Volver al lobby
                </button>

                {/* Countdown */}
                <p className="text-[11px] text-zinc-700">
                    Redirigiendo al lobby en{' '}
                    <span className="text-zinc-400 font-bold">{cd}s</span>
                </p>
            </div>
        </div>
    );
};