import React from 'react';
import type { Fight } from '../types/fight';

interface Props {
    gameState: Fight | null;
    userId: string;
    onStart: () => void;
    onHelp: () => void;
    onClaim: () => void;
}

const FightHUD: React.FC<Props> = ({ gameState, userId, onStart, onHelp, onClaim }) => {
    if (!gameState) return null;

    const calculateHP = (current: number | undefined, max: number | undefined) => {
        if (!current || !max || max === 0) return 100; // Default 100% si no hay datos
        return (current / max) * 100;
    };

    // Verificar si los fighters tienen health (personaje seleccionado)
    const p1Health = gameState.player1.health;
    const p2Health = gameState.player2.health;

    return (
        <div className="absolute inset-x-0 top-0 p-8 flex flex-col items-center pointer-events-none">
            {/* Contenedor de Barras de Vida */}
            <div className="w-full max-w-5xl flex justify-between items-center gap-4">
                
                {/* Player 1 HUD */}
                <div className="flex-1 flex flex-col items-end">
                    <span className="text-white font-black italic text-xl mb-1 drop-shadow-md uppercase">
                        {gameState.player1.characterName || 'Jugador 1'}
                    </span>
                    <div className="w-full h-8 bg-gray-900 border-2 border-white skew-x-[-15deg] overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-yellow-400 to-red-600 transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                            style={{ width: `${calculateHP(p1Health?.currentHealth, p1Health?.maxHealth)}%`, float: 'right' }}
                        />
                    </div>
                </div>

                {/* Reloj o VS */}
                <div className="flex-shrink-0 bg-red-600 text-white font-black text-2xl px-4 py-2 border-4 border-white skew-x-[-15deg]">
                    VS
                </div>

                {/* Player 2 HUD */}
                <div className="flex-1 flex flex-col items-start">
                    <span className="text-white font-black italic text-xl mb-1 drop-shadow-md uppercase">
                        {gameState.player2.characterName || 'Jugador 2'}
                    </span>
                    <div className="w-full h-8 bg-gray-900 border-2 border-white skew-x-[-15deg] overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-red-600 to-yellow-400 transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                            style={{ width: `${calculateHP(p2Health?.currentHealth, p2Health?.maxHealth)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Panel de Control Central (Botones Interactivos) */}
            <div className="mt-10 pointer-events-auto flex gap-4">
                {!gameState.isActive && (
                    <button 
                        onClick={onStart}
                        className="bg-green-600 hover:bg-green-500 text-white font-black px-8 py-3 rounded italic uppercase border-b-4 border-green-800 transition-transform active:scale-95"
                    >
                        START FIGHT
                    </button>
                )}

                {/* Lógica del HelpButton */}
                {gameState.helpButton?.visible && (
                    <div className="flex gap-4 animate-bounce">
                        <button 
                            onClick={onHelp}
                            className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-6 py-2 rounded uppercase border-b-4 border-yellow-700"
                        >
                            ¡PEDIR AYUDA!
                        </button>
                        <button 
                            onClick={onClaim}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-black px-6 py-2 rounded uppercase border-b-4 border-purple-900"
                        >
                            RELEVAR
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FightHUD;
