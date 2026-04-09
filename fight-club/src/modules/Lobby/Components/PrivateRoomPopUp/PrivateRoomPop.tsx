import React, { useEffect, useRef, useState } from "react";
import { CloseButtonPopUP } from "./CloseButtomPop";
import { InputSectionPopUp } from "./InputSectionPop";
import { SearchResultPopUp } from "./SearchResult";
import { SectionPanelPopUp } from "./PanelSection/SectionPanel";
import { FooterPopUp } from "./FooterPopUp";
import type { Room } from "../../Types/RoomTypes";

type Props = {
    onClose: () => void;
};

export const PrivateRoomPopUp :React.FC<Props> = ({onClose}) =>{
    const [show, setShow] = useState(false);
    const [bottonPanel,setBottonPanel] = useState<boolean | undefined>(undefined);
    const [room,setRoom ] = useState<Room | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    
    useEffect(() => {
        setShow(true);
        setBottonPanel(undefined);
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
                        <h2 className="font-display text-3xl font-black tracking-tighter text-orange-500 uppercase">Join Private</h2>
                        <div className="h-1 w-12 bg-orange-500"></div>
                    </div>
                    <InputSectionPopUp findMatch={bottonPanel}  setBottomPanel={setBottonPanel}  formRef={formRef} setRoom={setRoom}/>
                    {
                        bottonPanel && room &&  (
                            <>
                                <SearchResultPopUp players={room.currentPlayers} spectators={room.currentSpectators} status={room.roomState}/>
                                <SectionPanelPopUp full={room.maxPlayers-room.currentPlayers===0} formRef={formRef} roomCode={room.roomCode} fullSpectators={room.maxSpectators-room.currentSpectators===0} />
                            </>
                        )
                    }
                    <FooterPopUp />
                </div>
            </div>
        </div>
    );
}