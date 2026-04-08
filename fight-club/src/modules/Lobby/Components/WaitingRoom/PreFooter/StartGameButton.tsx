import React from 'react';

type Props = {
    onStartGame: () => Promise<{ success: boolean; error?: string }>;
    isStartingGame: boolean;
}

export const StartGameButton: React.FC<Props> = ({ 
    onStartGame, 
    isStartingGame 
}) => {
    const handleClick = async () => {
        const result = await onStartGame();
        if (!result.success) {
            console.error("Error al iniciar:", result.error);
        }
        // La navegación ocurre automáticamente via WebSocket para todos los participantes
    };

    return (
        <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-[200px] md:max-w-xs px-2 pointer-events-auto">
            <button 
                onClick={handleClick} 
                disabled={isStartingGame}
                className={`w-full kinetic-gradient-fuego py-2 md:py-3 font-headline font-bold text-on-primary tracking-[0.15em] md:tracking-[0.2rem] uppercase text-xs md:text-sm shadow-[0_10px_30px_rgba(255,86,38,0.3)] active:scale-[0.98] transition-all cursor-pointer rounded-[14px] md:rounded-[18px] ${isStartingGame ? 'opacity-50 grayscale' : ''}`}
            >
                {isStartingGame ? 'Preparando arena...' : 'Comenzar Juego'}
            </button>
        </div>
    );
}
