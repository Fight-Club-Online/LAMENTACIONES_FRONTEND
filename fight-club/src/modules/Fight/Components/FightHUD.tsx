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
        if (!current || !max || max === 0) return 100;
        return (current / max) * 100;
    };

    // Verificar si los fighters tienen health (personaje seleccionado)
    const p1Health = gameState.player1.health;
    const p2Health = gameState.player2.health;

    // Lógica del botón de ayuda
    const helpButtonState = useMemo(() => {
        const helpButton = gameState.helpButton;
        if (!helpButton) return { showAskHelp: false, showClaim: false, showTakeBack: false };

        // Verificar si este jugador está en poca vida (activatedForUserId es el que puede pedir ayuda)
        // El botón PEDIR AYUDA aparece cuando status es ACTIVE y aún no ha sido visible para todos
        const canAskForHelp = helpButton.activatedForUserId === userId && 
                             helpButton.status === 'ACTIVE' && 
                             !helpButton.isVisible;

        // El botón de CLAIM (RELEVAR) aparece cuando isVisible es true (para todos)
        // Pero solo si no es el jugador que pidió ayuda y el status es ACTIVE
        const showClaimButton = helpButton.isVisible && 
                               helpButton.status === 'ACTIVE' &&
                               helpButton.activatedForUserId !== userId;

        // El botón TAKE BACK aparece cuando el status es CLAIMED
        // Solo para el jugador original que pidió ayuda (activatedForUserId)
        const showTakeBack = helpButton.status === 'CLAIMED' &&
                            helpButton.activatedForUserId === userId;

        return {
            showAskHelp: canAskForHelp,
            showClaim: showClaimButton,
            showTakeBack: showTakeBack,
            status: helpButton.status,
            claimedBy: helpButton.claimedByUserId
        };
    }, [gameState.helpButton, userId]);

    return (
        <div className="absolute inset-0 p-8 flex flex-col items-center pointer-events-none">
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

            {/* Panel de Control Central Superior (Botón Start) */}
            {!gameState.active && (
                <div className="mt-10 pointer-events-auto">
                    <button 
                        onClick={onStart}
                        className="bg-green-600 hover:bg-green-500 text-white font-black px-8 py-3 rounded italic uppercase border-b-4 border-green-800 transition-transform active:scale-95"
                    >
                        START FIGHT
                    </button>
                </div>
            )}

            {/* Botón PEDIR AYUDA - Solo para el jugador con poca vida */}
            {helpButtonState.showAskHelp && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto animate-bounce">
                    <button 
                        onClick={onHelp}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-8 py-4 rounded-lg uppercase border-b-4 border-yellow-700 transition-transform active:scale-95 text-lg shadow-lg shadow-yellow-500/30"
                    >
                        PEDIR AYUDA
                    </button>
                </div>
            )}

            {/* Botón RELEVAR - Para espectadores y oponente cuando isVisible es true */}
            {helpButtonState.showClaim && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto animate-pulse">
                    <button 
                        onClick={onClaim}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-black px-8 py-4 rounded-lg uppercase border-b-4 border-purple-900 transition-transform active:scale-95 text-lg shadow-lg shadow-purple-500/30"
                    >
                        RELEVAR
                    </button>
                </div>
            )}

            {/* Botón RETOMAR CONTROL - Para el jugador original después de 10 segundos */}
            {helpButtonState.showTakeBack && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto animate-bounce">
                    <button 
                        onClick={onTakeBack}
                        className="bg-green-600 hover:bg-green-500 text-white font-black px-8 py-4 rounded-lg uppercase border-b-4 border-green-800 transition-transform active:scale-95 text-lg shadow-lg shadow-green-500/30"
                    >
                        RETOMAR CONTROL
                    </button>
                </div>
            )}
        </div>
    );
};

export default FightHUD;
