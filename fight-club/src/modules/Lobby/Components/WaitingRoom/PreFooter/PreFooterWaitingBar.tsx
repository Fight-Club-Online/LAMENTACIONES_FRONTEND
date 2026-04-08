import React from 'react';
import { LobbyCode } from './LobbyCode';

type props={
    roomCode : string;
}

export const PreFooterWaitingBar : React.FC<props> = ({roomCode}) =>{
    return(
        <div className="fixed bottom-24 left-0 w-full z-40 px-8 flex flex-col items-center gap-6 pointer-events-none">
            <LobbyCode roomCode={roomCode} />
        </div>
    );
}