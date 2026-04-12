import React, { useMemo } from 'react';
import type { Fight } from '../../types/fight';

interface Props {
    gameState: Fight | null;
    userId: string;
    onStart: () => void;
    onHelp: () => void;
    onClaim: () => void;
    onTakeBack: () => void;
}

const FightHUD: React.FC<Props> = ({ gameState, userId, onStart, onHelp, onClaim, onTakeBack }) => {
    if (!gameState) return null;

    const calculateHP = (current: number | undefined, max: number | undefined) => {
        if (current === undefined || max === undefined || max <= 0 || current <= 0) return 0;
        return (current / max) * 100;
    };

    const p1HealthPerc = calculateHP(gameState.player1.health?.currentHealth, gameState.player1.health?.maxHealth);
    const p2HealthPerc = calculateHP(gameState.player2.health?.currentHealth, gameState.player2.health?.maxHealth);

    const P1_DEAD = p1HealthPerc <= 0;
    const P2_DEAD = p2HealthPerc <= 0;
    const IS_P1_CRITICAL = p1HealthPerc < 30 && !P1_DEAD;
    const IS_P2_CRITICAL = p2HealthPerc < 30 && !P2_DEAD;

    const helpButtonState = useMemo(() => {
        const helpButton = gameState.helpButton;
        if (!helpButton) return { showAskHelp: false, showClaim: false, showTakeBack: false };
        return {
            showAskHelp: helpButton.activatedForUserId === userId && helpButton.status === 'ACTIVE' && !helpButton.visible,
            showClaim: helpButton.visible && helpButton.status === 'ACTIVE' && helpButton.activatedForUserId !== userId,
            showTakeBack: helpButton.status === 'CLAIMED' && helpButton.activatedForUserId === userId,
        };
    }, [gameState.helpButton, userId]);

    return (
        <div className="absolute inset-0 p-6 flex flex-col items-center pointer-events-none select-none">
            
            <div className="w-full max-w-4xl flex justify-between items-start gap-4 pt-2">
                
                {/* Player 1 HUD */}
                <div className="flex-1">
                    <div className="flex justify-between items-end mb-1 px-2">
                        <span className={`font-black italic text-xl tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase transition-all duration-500
                            ${P1_DEAD ? 'text-zinc-600' : IS_P1_CRITICAL ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {gameState.player1.characterName || 'P1'} {P1_DEAD && '(K.O.)'}
                        </span>
                        <span className={`font-bold text-xs mb-1 transition-colors ${P1_DEAD ? 'text-zinc-600' : IS_P1_CRITICAL ? 'text-red-400' : 'text-zinc-400'}`}>
                            {Math.ceil(p1HealthPerc)}%
                        </span>
                    </div>
                    <div className={`relative h-8 bg-zinc-900/80 border-2 skew-x-[-15deg] overflow-hidden backdrop-blur-sm transition-all duration-500 
                        ${P1_DEAD ? 'border-zinc-700 grayscale' : IS_P1_CRITICAL ? 'border-red-500' : 'border-zinc-200'}`}>
                        <div 
                            className={`h-full transition-all duration-700 ease-out 
                                ${P1_DEAD ? 'bg-zinc-700' : 'bg-gradient-to-l from-red-600 via-orange-500 to-yellow-400'}
                                ${IS_P1_CRITICAL ? 'animate-[pulse_0.4s_infinite] shadow-[0_0_30px_rgba(220,38,38,0.8)]' : !P1_DEAD ? 'shadow-[0_0_20px_rgba(239,68,68,0.4)]' : ''}`}
                            style={{ width: `${p1HealthPerc}%`, float: 'right' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                    </div>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center z-10 px-2">
                    <div className={`bg-zinc-950 border-2 text-white font-black text-xl px-4 py-1 skew-x-[-15deg] transition-all
                        ${(P1_DEAD || P2_DEAD) ? 'border-zinc-600 shadow-none' : 'border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)]'}`}>
                        VS
                    </div>
                </div>

                {/* Player 2 HUD */}
                <div className="flex-1">
                    <div className="flex justify-between items-end mb-1 px-2">
                        <span className={`font-bold text-xs mb-1 transition-colors ${P2_DEAD ? 'text-zinc-600' : IS_P2_CRITICAL ? 'text-red-400' : 'text-zinc-400'}`}>
                            {Math.ceil(p2HealthPerc)}%
                        </span>
                        <span className={`font-black italic text-xl tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase transition-all duration-500
                            ${P2_DEAD ? 'text-zinc-600' : IS_P2_CRITICAL ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {P2_DEAD && '(K.O.) '} {gameState.player2.characterName || 'P2'}
                        </span>
                    </div>
                    <div className={`relative h-8 bg-zinc-900/80 border-2 skew-x-[-15deg] overflow-hidden backdrop-blur-sm transition-all duration-500 
                        ${P2_DEAD ? 'border-zinc-700 grayscale' : IS_P2_CRITICAL ? 'border-red-500' : 'border-zinc-200'}`}>
                        <div 
                            className={`h-full transition-all duration-700 ease-out 
                                ${P2_DEAD ? 'bg-zinc-700' : 'bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400'}
                                ${IS_P2_CRITICAL ? 'animate-[pulse_0.4s_infinite] shadow-[0_0_30px_rgba(220,38,38,0.8)]' : !P2_DEAD ? 'shadow-[0_0_20px_rgba(239,68,68,0.4)]' : ''}`}
                            style={{ width: `${p2HealthPerc}%` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* BOTÓN START */}
            {!gameState.active && (
                <div className="mt-20 pointer-events-auto">
                    <button 
                        onClick={onStart} 
                        className="relative px-12 py-4 bg-white hover:bg-green-500 text-black hover:text-white cursor-pointer transition-all duration-300 transform hover:scale-110 active:scale-95 font-black italic text-2xl tracking-widest uppercase shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                    >
                        INICIAR COMBATE
                    </button>
                </div>
            )}

            {/* BOTONES DE ACCIÓN */}
            <div className="mt-auto mb-10 flex gap-4 pointer-events-auto">
                {helpButtonState.showAskHelp && !P1_DEAD && (
                    <button onClick={onHelp} className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-10 py-5 rounded-sm uppercase tracking-tighter border-r-8 border-b-8 border-yellow-700 cursor-pointer transition-all active:translate-y-1 active:border-b-0 animate-bounce shadow-xl shadow-yellow-500/20">
                        SOLICITAR REFUERZO
                    </button>
                )}
                {helpButtonState.showClaim && (
                    <button onClick={onClaim} className="bg-purple-700 hover:bg-purple-600 text-white font-black px-10 py-5 rounded-sm uppercase tracking-tighter border-r-8 border-b-8 border-purple-950 cursor-pointer transition-all active:translate-y-1 active:border-b-0 shadow-xl shadow-purple-500/20">
                        TOMAR EL RELEVO
                    </button>
                )}
                {helpButtonState.showTakeBack && (
                    <button onClick={onTakeBack} className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-10 py-5 rounded-sm uppercase tracking-tighter border-r-8 border-b-8 border-emerald-800 cursor-pointer transition-all active:translate-y-1 active:border-b-0 shadow-xl shadow-emerald-500/20">
                        RETOMAR CONTROL
                    </button>
                )}
            </div>
        </div>
    );
};

export default FightHUD;