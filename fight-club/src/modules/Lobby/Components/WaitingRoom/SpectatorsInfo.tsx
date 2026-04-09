import React from 'react';

type props = {
    spectatorsNumber : number;
}

export const SpectatorsInfo : React.FC<props> = ({spectatorsNumber}) =>{
    return(
        <div className="bg-surface-container-lowest/80 backdrop-blur-md px-4 py-1.5 flex items-center gap-3 pointer-events-auto border border-outline-variant/10">
            <span className="material-symbols-outlined text-[14px] text-tertiary">group</span>
            <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">
                Spectators ({spectatorsNumber})
            </p>
        </div>
    );
}    