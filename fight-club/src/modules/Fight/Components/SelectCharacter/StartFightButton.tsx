import React from 'react';
import { useCreateFight } from '../../Hooks/useCreateFight';

interface Props {
    roomCode: string;
    player1Id: string;
    player2Id: string;
    disabled?: boolean;
    className?: string;
}

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
        <div className="flex flex-col items-center gap-4">
            <button
                onClick={handleClick}
                disabled={disabled || isLoading}
                className={`
                    relative px-16 py-5 font-black text-3xl uppercase italic tracking-widest
                    bg-white text-black
                    disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed
                    skew-x-[-15deg] transition-all duration-200
                    hover:bg-red-600 hover:text-white
                    active:scale-95 active:skew-x-[-10deg]
                    shadow-[10px_10px_0px_0px_rgba(220,38,38,1)]
                    hover:shadow-[0px_0px_30px_rgba(220,38,38,0.6)]
                    disabled:shadow-none disabled:border-zinc-700
                    overflow-hidden group
                    ${className}
                `}
            >
                {/* Efecto de brillo que atraviesa el botón al pasar el mouse */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />

                {isLoading ? (
                    <span className="flex items-center gap-4">
                        <span className="w-6 h-6 border-4 border-black border-t-transparent group-hover:border-white group-hover:border-t-transparent rounded-full animate-spin" />
                        CARGANDO...
                    </span>
                ) : (
                    <span className="relative z-10 drop-shadow-sm">
                        ¡COMENZAR!
                    </span>
                )}
            </button>
            
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 px-4 py-1 rounded">
                    <p className="text-red-500 text-xs font-black uppercase italic tracking-tighter">
                        ERROR: {error}
                    </p>
                </div>
            )}

            {/* Estilos inline para la animación personalizada del brillo */}
            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default StartFightButton;