import React from 'react';
import { StartGameButton } from './PreFooter/StartGameButton';

type props={
    roomCode: string;
    isHost: boolean;
    onStartGame: () => Promise<{ success: boolean; error?: string }>;
    isStartingGame: boolean;
}
  
export const BottonWaitingBar: React.FC<props> = ({
    roomCode,
    isHost,
    onStartGame,
    isStartingGame
}) => {
    return (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-between items-center h-16 md:h-20 px-2 md:px-4 bg-[#16130f] border-t border-[#39342f]/30">
            <button className="w-20 md:w-28 flex flex-col items-center justify-center text-[#5d4038] py-2 transition-transform active:scale-90 hover:text-orange-500 hover:bg-stone-900 cursor-pointer !cursor-pointer">
                <span className="material-symbols-outlined text-xl md:text-2xl pointer-events-none select-none">
                    group
                </span>
                <span className="font-['Space_Grotesk'] text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-1 pointer-events-none select-none">
                    Espectadores
                </span>
            </button>

            {isHost && (
                <StartGameButton 
                    onStartGame={onStartGame}
                    isStartingGame={isStartingGame}
                />
            )}
 
            <button className="w-20 md:w-28 flex flex-col items-center justify-center text-[#5d4038] py-2 transition-transform active:scale-90 hover:text-orange-500 hover:bg-stone-900 cursor-pointer !cursor-pointer">
                <span className="material-symbols-outlined text-xl md:text-2xl pointer-events-none select-none">
                    bolt
                </span>
                <span className="font-['Space_Grotesk'] text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-1 pointer-events-none select-none">
                    Listo
                </span>
            </button>
        </nav>
    );
}