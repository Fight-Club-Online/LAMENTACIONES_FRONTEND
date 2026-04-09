import React from 'react';
import { JoinPrivateButton } from './JoinPrivateButton';
import { CreatePrivateButton } from './CreatePrivateButton';
import { JoinPublicButton } from './JoinPublicButton';



export const RightSideBar: React.FC  = ()=>{
    return(
        <div className="w-full md:w-[400px] flex flex-col justify-center gap-4">
            <div className="mb-10">
                <h3 className="font-headline text-secondary text-lg uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-8 h-px bg-secondary"></span>
                                        Escoge tu desitno
                </h3>
                <p className="text-on-surface-variant text-sm font-body">Selecciona una opcion para iniciar tu proximo combate.</p>
            </div>
            <div className="flex flex-col gap-3">
                <CreatePrivateButton />
                <JoinPrivateButton />
                <JoinPublicButton />
            </div>
     </div>
    );
}