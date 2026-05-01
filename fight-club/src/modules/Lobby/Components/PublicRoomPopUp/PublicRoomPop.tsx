import React, { useEffect, useState } from 'react';
import { CloseButtonPopUP } from '../PrivateRoomPopUp/CloseButtomPop';
import { FooterPopUp } from '../PrivateRoomPopUp/FooterPopUp';
import { SelectionPopUp } from './SelectionPopUp';
import { PublicRoomsSelectorPopUp } from './PublicRoomsSelectorPopUp';
import type { Room } from '../../Types/RoomTypes';

type Props = {
    onClose: () => void;
}

export const PublicRoomPopUp: React.FC<Props> = ({onClose}) => {
    const [show, setShow] = useState(false);
    const [bottomPanel, setBottomPanel] = useState<boolean | undefined>(undefined);
    const [roomsP, setRooms] = useState<Room[]>([]);



    useEffect(() => {
        setShow(true);
    }, []);


    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);


    const handleClose = () => {
        setShow(false);
        setTimeout(() => {
            onClose();
        }, 200); 
    };
    
    const anim = show ? "opacity-100" : "opacity-0"

    return(
        <div className="bg-background text-on-surface font-body overflow-hidden">
           <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm ${anim}`} onClick={handleClose} >
                 <div className={`  w-full max-w-xl kinetic-glass fuego-border  relative p-10 flex flex-col gap-8 shadow-2xl transform transition-all duration-200 ${show ? "opacity-100 scale-100" : "opacity-0 scale-95"} rounded-[14px] md:rounded-[18px]`}
                     onClick={(e) => e.stopPropagation()}>                    
                    <CloseButtonPopUP onClose = {handleClose}/>
                    <div className="space-y-1">
                        <h2 className="font-display text-3xl font-black tracking-tighter text-orange-500 uppercase">Join Public</h2>
                        <div className="h-1 w-12 bg-orange-500"></div>
                    </div>  
                    <SelectionPopUp setBottomPanel={setBottomPanel} setRooms={setRooms}/>
                    {
                        bottomPanel && <PublicRoomsSelectorPopUp rooms={roomsP}/>
                    }
                    
                    
                    <FooterPopUp />
                </div>
            </div>
        </div>
    );  
}