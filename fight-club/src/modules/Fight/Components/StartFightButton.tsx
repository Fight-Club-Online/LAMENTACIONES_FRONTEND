import React from 'react';
import { useCreateFight } from '../Hooks/useCreateFight';

interface Props {
    roomCode: string;
    player1Id: string;
    player2Id: string;
    disabled?: boolean;
    className?: string;
}

/**
 * Botón para iniciar la pelea desde la pantalla de selección de personajes.
 * Al hacer clic:
 * 1. Llama al backend para crear el Fight
 * 2. Navega automáticamente a /fight/:fightId
 * 
 * Uso:
 * ```tsx
 * <StartFightButton 
 *   roomCode="ABC123"
 *   player1Id="user-1"
 *   player2Id="user-2"
 *   disabled={!bothPlayersReady}
 * />
 * ```
 */
export const StartFightButton: React.FC<Props> = ({
    roomCode,
    player1Id,
    player2Id,
    disabled = false,
    className = '',
}) => {
    const { isLoading, error, createAndStartFight } = useCreateFight();

    const handleClick = async () => {
        if (disabled || isLoading) return;
        await createAndStartFight(roomCode, player1Id, player2Id);
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                onClick={handleClick}
                disabled={disabled || isLoading}
                className={`
                    relative px-12 py-4 font-black text-2xl uppercase italic
                    bg-gradient-to-r from-red-600 to-red-700
                    hover:from-red-500 hover:to-red-600
                    disabled:from-zinc-600 disabled:to-zinc-700 disabled:cursor-not-allowed
                    text-white border-b-4 border-red-900
                    disabled:border-zinc-800
                    rounded-lg shadow-lg
                    transform transition-all duration-150
                    hover:scale-105 active:scale-95
                    disabled:hover:scale-100
                    ${className}
                `}
            >
                {isLoading ? (
                    <span className="flex items-center gap-3">
                        <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        INICIANDO...
                    </span>
                ) : (
                    'INICIAR PELEA'
                )}
            </button>
            
            {error && (
                <p className="text-red-400 text-sm font-medium animate-pulse">
                    {error}
                </p>
            )}
        </div>
    );
};

export default StartFightButton;
