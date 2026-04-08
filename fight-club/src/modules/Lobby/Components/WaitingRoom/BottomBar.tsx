import React from 'react';
import { StartGameButton } from './PreFooter/StartGameButton';

type props={
    roomCode : string;
  }
  

export const BottonWaitingBar: React.FC<props> = ({roomCode}) => {
    return (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-between items-center h-16 md:h-20 px-2 md:px-4 bg-[#16130f] border-t border-[#39342f]/30">
            <button className="w-20 md:w-28 flex flex-col items-center justify-center text-[#5d4038] py-2 transition-transform active:scale-90 hover:text-orange-500 hover:bg-stone-900 cursor-pointer">
                <span className="material-symbols-outlined text-xl md:text-2xl">group</span>
                <span className="font-['Space_Grotesk'] text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-1">Espectadires</span>
            </button>
 
            <StartGameButton roomCode={roomCode} />
 
            <button className="w-20 md:w-28 flex flex-col items-center justify-center text-[#5d4038] py-2 transition-transform active:scale-90 hover:text-orange-500 hover:bg-stone-900 cursor-pointer">
                <span className="material-symbols-outlined text-xl md:text-2xl">bolt</span>
                <span className="font-['Space_Grotesk'] text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-1">Listo</span>
            </button>
        </nav>
    );
}