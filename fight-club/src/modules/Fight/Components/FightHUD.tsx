import React, { useMemo } from 'react';
import type { Fight } from '../types/fight';

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
        if (current === undefined || !max || max === 0) return 100;
        return Math.max(0, (current / max) * 100);
    };

    const p1HP = calculateHP(gameState.player1.health?.currentHealth, gameState.player1.health?.maxHealth);
    const p2HP = calculateHP(gameState.player2.health?.currentHealth, gameState.player2.health?.maxHealth);

    const helpButtonState = useMemo(() => {
        const helpButton = gameState.helpButton;
        
        if (!helpButton) return { showAskHelp: false, showClaim: false, showTakeBack: false };

        const canAskForHelp = helpButton.activatedForUserId === userId && helpButton.status === 'ACTIVE' && !helpButton.visible;
        const showClaimButton = helpButton.visible && helpButton.status === 'ACTIVE' && helpButton.activatedForUserId !== userId;
        const showTakeBack = helpButton.status === 'CLAIMED' && helpButton.activatedForUserId === userId;

        return { showAskHelp: canAskForHelp, showClaim: showClaimButton, showTakeBack: showTakeBack };
    }, [gameState.helpButton, userId]);

    return (
        <div className="absolute inset-0 p-6 flex flex-col items-center pointer-events-none select-none">
            
            {/* --- TOP BAR: HEALTH & VS --- */}
            <div className="w-full max-w-6xl flex justify-between items-start gap-2 italic">
                
                {/* Player 1 */}
                <div className="flex-1">
                    <div className="flex justify-between items-end mb-1 px-2">
                        <span className="text-white font-black text-2xl tracking-tighter drop-shadow-[0_2px_2px_rgba(0,0,0,1)] uppercase">
                            {gameState.player1.characterName || 'P1'}
                        </span>
                        <span className="text-yellow-400 font-bold text-sm">{Math.round(p1HP)}%</span>
                    </div>
                    <div className="relative h-9 bg-zinc-900 border-2 border-zinc-700 -skew-x-12 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        <div 
                            className={`h-full transition-all duration-500 ease-out bg-gradient-to-l from-red-600 via-orange-500 to-yellow-400 ${p1HP < 30 ? 'animate-pulse' : ''}`}
                            style={{ width: `${p1HP}%`, float: 'right' }}
                        >
                            <div className="w-full h-1/2 bg-white/10" /> {/* Brillo superior */}
                        </div>
                    </div>
                </div>

                {/* Central VS Element */}
                <div className="flex flex-col items-center z-10 -mt-2">
                    <div className="bg-red-600 border-4 border-zinc-900 text-white font-black text-3xl px-6 py-2 shadow-[0_0_15px_rgba(220,38,38,0.6)] -rotate-6 scale-110">
                        VS
                    </div>
                </div>

                {/* Player 2 */}
                <div className="flex-1">
                    <div className="flex justify-between items-end mb-1 px-2">
                        <span className="text-yellow-400 font-bold text-sm">{Math.round(p2HP)}%</span>
                        <span className="text-white font-black text-2xl tracking-tighter drop-shadow-[0_2px_2px_rgba(0,0,0,1)] uppercase text-right">
                            {gameState.player2.characterName || 'P2'}
                        </span>
                    </div>
                    <div className="relative h-9 bg-zinc-900 border-2 border-zinc-700 -skew-x-12 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        <div 
                            className={`h-full transition-all duration-500 ease-out bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 ${p2HP < 30 ? 'animate-pulse' : ''}`}
                            style={{ width: `${p2HP}%` }}
                        >
                            <div className="w-full h-1/2 bg-white/10" />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CENTER ACTIONS (START) --- */}
            {!gameState.active && (
                <div className="flex-1 flex items-center justify-center pointer-events-auto">
                    <button 
                        onClick={onStart}
                        className="group relative px-12 py-4 bg-white text-black font-black text-2xl italic uppercase transition-all hover:scale-110 active:scale-95"
                    >
                        <div className="absolute inset-0 bg-green-500 translate-x-2 translate-y-2 -z-10 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform" />
                        START BATTLE
                    </button>
                </div>
            )}

            {/* --- BOTTOM ACTIONS (HELP SYSTEM) --- */}
            <div className="mt-auto mb-10 pointer-events-auto">
                {helpButtonState.showAskHelp && (
                    <button 
                        onClick={onHelp}
                        className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-10 py-5 rounded-none -skew-x-12 border-r-8 border-b-8 border-yellow-700 active:translate-y-1 active:border-b-0 transition-all text-xl shadow-2xl shadow-yellow-500/40 animate-bounce"
                    >
                        ¡PEDIR REFUERZOS!
                    </button>
                )}

                {helpButtonState.showClaim && (
                    <button 
                        onClick={onClaim}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-black px-10 py-5 rounded-none -skew-x-12 border-r-8 border-b-8 border-purple-900 active:translate-y-1 active:border-b-0 transition-all text-xl shadow-2xl shadow-purple-500/40 animate-pulse"
                    >
                        ENTRAR AL RELEVO
                    </button>
                )}

                {helpButtonState.showTakeBack && (
                    <button 
                        onClick={onTakeBack}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-black px-10 py-5 rounded-none -skew-x-12 border-r-8 border-b-8 border-blue-900 active:translate-y-1 active:border-b-0 transition-all text-xl shadow-2xl shadow-blue-500/40"
                    >
                        RETOMAR LUCHA
                    </button>
                )}
            </div>
        </div>
    );
};

export default FightHUD;
