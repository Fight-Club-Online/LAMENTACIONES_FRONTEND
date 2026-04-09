import React, { type RefObject } from "react";
import { JoinButtonPanelSection } from "./JoinButtonPanelSection";
import { JoinSpecButton } from "./JoinSpecButton";
import { RefreshButtonPanel } from "./RefreshButtonPanel";


type props = {
    full : boolean;
    formRef : RefObject<HTMLFormElement | null>;
    roomCode: string;
    fullSpectators : boolean;
}

export const SectionPanelPopUp :React.FC<props> = ({full,formRef,roomCode,fullSpectators}) =>{
    return(
        <div className="grid grid-cols-2 gap-4">
            <JoinButtonPanelSection fullRoom={full} roomCode={roomCode}/>
            <JoinSpecButton fullRoom={fullSpectators} roomCode={roomCode}/>
            <RefreshButtonPanel formRef={formRef}/>
        </div>
    );
}