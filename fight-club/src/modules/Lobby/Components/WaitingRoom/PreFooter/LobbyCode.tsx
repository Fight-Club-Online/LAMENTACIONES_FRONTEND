import React, { useState } from 'react';

type props={
  roomCode : string;
}


export const LobbyCode: React.FC<props> = ({roomCode}) => {
    
  const [copiado, setCopiado] = useState(false);

  const copiarTexto = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiado(true);

      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  return (
    <div className="flex items-center gap-2 pointer-events-auto">
      <div onClick={copiarTexto} className="bg-surface-container-highest px-2 py-1.5 md:px-3 md:py-2 flex items-center gap-2 md:gap-3 group cursor-pointer hover:bg-surface-bright transition-all border border-outline-variant/20 rounded-[14px] md:rounded-[18px] active:scale-[0.98]">
        
        <span className="font-label text-[8px] md:text-[10px] text-on-surface-variant uppercase tracking-wide">
          Lobby Code
        </span>

        <span className="font-orbitron text-sm md:text-lg font-bold text-on-surface tracking-[0.15em]">
          {roomCode}
        </span>

        <span className="material-symbols-outlined text-primary text-sm md:text-base group-hover:scale-110 transition-transform">
          content_copy
        </span>

      </div>
    </div>
  );
};